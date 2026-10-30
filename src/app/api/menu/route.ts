
import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { prisma, DEFAULT_HOTEL_NAME, DEFAULT_HOTEL_SLUG } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const isAdmin = await isAdminAuthenticated();
    const hotel = await prisma.hotel.findUnique({
      where: { slug: DEFAULT_HOTEL_SLUG },
      select: {
        categories: {
          where: isAdmin ? undefined : { items: { some: { isAvailable: true } } },
          include: {
            items: {
              where: isAdmin ? undefined : { isAvailable: true },
              orderBy: { displayOrder: "asc" },
            },
          },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    return NextResponse.json(hotel?.categories ?? []);
  } catch (error) {
    console.error("Failed to load menu:", error);
    return NextResponse.json(
      { error: "Failed to load menu" },
      { status: 500 }
    );
  }
}

async function saveUploadedPhoto(photo: File | null) {
  if (!photo || photo.size === 0) return null;

  if (photo.size > 5 * 1024 * 1024) {
    throw new Error("The photo must be 5 MB or smaller.");
  }

  const photoExtensions: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };

  if (!photoExtensions[photo.type]) {
    throw new Error("Choose a JPG, PNG, WebP, or GIF photo.");
  }

  const uploadDirectory = join(process.cwd(), "public", "uploads");
  const fileName = `${randomUUID()}${photoExtensions[photo.type]}`;
  const uploadedFilePath = join(uploadDirectory, fileName);
  await mkdir(uploadDirectory, { recursive: true });
  try {
    await writeFile(uploadedFilePath, Buffer.from(await photo.arrayBuffer()));
  } catch (error) {
    await rm(uploadedFilePath, { force: true }).catch((cleanupError) => {
      console.error("Failed to remove incomplete menu photo:", cleanupError);
    });
    throw error;
  }

  return { imageUrl: `/uploads/${fileName}`, filePath: uploadedFilePath };
}

function getUploadedPhotoPath(imageUrl: string | null) {
  if (!imageUrl?.startsWith("/uploads/")) return null;

  const fileName = imageUrl.slice("/uploads/".length);
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|gif)$/i.test(fileName)) return null;

  return join(process.cwd(), "public", "uploads", fileName);
}

async function removeUploadedPhoto(filePath: string) {
  await rm(filePath, { force: true }).catch((error) => {
    console.error("Failed to remove menu photo:", error);
  });
}

async function getDefaultHotel() {
  return prisma.hotel.upsert({
    where: { slug: DEFAULT_HOTEL_SLUG },
    update: {},
    create: {
      name: DEFAULT_HOTEL_NAME,
      slug: DEFAULT_HOTEL_SLUG,
      themeColor: "#d97706",
    },
  });
}

async function ensureCategory(hotelId: string, categoryName: string) {
  let category = await prisma.category.findFirst({
    where: { hotelId, name: categoryName },
  });

  if (!category) {
    category = await prisma.category.create({
      data: { hotelId, name: categoryName },
    });
  }

  return category;
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Administrator sign-in required." }, { status: 401 });
  }

  let uploadedFilePath: string | undefined;

  try {
    const isMultipart = request.headers.get("content-type")?.includes("multipart/form-data");
    let name: string;
    let description: string;
    let categoryName: string;
    let price: number;
    let prepTimeMins: number;
    let imageUrl: string | null = null;
    let dietaryTags: string[] = [];
    let photo: File | null = null;

    if (isMultipart) {
      const formData = await request.formData();
      name = String(formData.get("name") ?? "").trim();
      description = String(formData.get("description") ?? "").trim();
      categoryName = String(formData.get("category") ?? "").trim();
      price = Number(formData.get("price"));
      prepTimeMins = Number(formData.get("prepTimeMins") ?? 0);
      const uploadedPhoto = formData.get("photo");
      if (uploadedPhoto instanceof File && uploadedPhoto.size > 0) photo = uploadedPhoto;
    } else {
      const body = await request.json();
      name = String(body.name ?? "").trim();
      description = String(body.description ?? "").trim();
      categoryName = String(body.category ?? "").trim();
      price = Number(body.price);
      prepTimeMins = Number(body.prepTimeMins ?? 0);
      imageUrl = body.imageUrl ? String(body.imageUrl) : null;
      dietaryTags = Array.isArray(body.dietaryTags)
        ? body.dietaryTags.map(String)
        : [];
    }

    if (!name || !description || !categoryName) {
      return NextResponse.json(
        { error: "Name, description, and category are required." },
        { status: 400 }
      );
    }

    if (name.length > 120 || description.length > 2000 || categoryName.length > 80) {
      return NextResponse.json(
        { error: "Name, description, or category is too long." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price < 0 || price >= 100000000) {
      return NextResponse.json(
        { error: "Enter a valid price." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(prepTimeMins) || prepTimeMins < 0) {
      return NextResponse.json(
        { error: "Preparation time must be a whole number of 0 or more." },
        { status: 400 }
      );
    }

    if (
      dietaryTags.length > 20 ||
      dietaryTags.some((tag) => tag.length > 40)
    ) {
      return NextResponse.json(
        { error: "Use no more than 20 dietary tags, each 40 characters or fewer." },
        { status: 400 }
      );
    }

    if (photo) {
      try {
        const savedPhoto = await saveUploadedPhoto(photo);
        if (savedPhoto) {
          imageUrl = savedPhoto.imageUrl;
          uploadedFilePath = savedPhoto.filePath;
        }
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Could not save the menu item." },
          { status: 400 }
        );
      }
    }

    const hotel = await getDefaultHotel();

    const category = await ensureCategory(hotel.id, categoryName);

    const item = await prisma.menuItem.create({
      data: {
        categoryId: category.id,
        name,
        description,
        price,
        prepTimeMins,
        imageUrl,
        dietaryTags,
      },
    });

    uploadedFilePath = undefined;
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (uploadedFilePath) await removeUploadedPhoto(uploadedFilePath);
    console.error("Failed to create menu item:", error);
    return NextResponse.json(
      { error: "Could not save the menu item." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Administrator sign-in required." }, { status: 401 });
  }

  let uploadedFilePath: string | undefined;

  try {
    const isMultipart = request.headers.get("content-type")?.includes("multipart/form-data");
    const formData = isMultipart ? await request.formData() : null;
    const body = !isMultipart ? await request.json() : null;

    const id = String(formData?.get("id") ?? body?.id ?? "").trim();
    const name = String(formData?.get("name") ?? body?.name ?? "").trim();
    const description = String(formData?.get("description") ?? body?.description ?? "").trim();
    const categoryName = String(formData?.get("category") ?? body?.category ?? "").trim();
    const rawPrice = formData?.get("price") ?? body?.price;
    const rawPrepTimeMins = formData?.get("prepTimeMins") ?? body?.prepTimeMins;
    const photoEntry = formData?.get("photo");
    const shouldReplacePhoto = photoEntry instanceof File && photoEntry.size > 0;
    const photo = shouldReplacePhoto ? photoEntry : null;

    if (!id) {
      return NextResponse.json({ error: "Menu item ID is required." }, { status: 400 });
    }

    const existingItem = await prisma.menuItem.findFirst({
      where: {
        id,
        category: { hotel: { slug: DEFAULT_HOTEL_SLUG } },
      },
    });
    if (!existingItem) {
      return NextResponse.json({ error: "Menu item not found." }, { status: 404 });
    }

    const price = rawPrice === undefined || rawPrice === null || rawPrice === ""
      ? Number(existingItem.price)
      : Number(rawPrice);
    const prepTimeMins = rawPrepTimeMins === undefined || rawPrepTimeMins === null || rawPrepTimeMins === ""
      ? existingItem.prepTimeMins
      : Number(rawPrepTimeMins);
    if (!Number.isFinite(price) || price < 0 || price >= 100000000) {
      return NextResponse.json({ error: "Enter a valid price." }, { status: 400 });
    }
    if (!Number.isInteger(prepTimeMins) || prepTimeMins < 0) {
      return NextResponse.json(
        { error: "Preparation time must be a whole number of 0 or more." },
        { status: 400 }
      );
    }
    if (name.length > 120 || description.length > 2000 || categoryName.length > 80) {
      return NextResponse.json(
        { error: "Name, description, or category is too long." },
        { status: 400 }
      );
    }

    let imageUrl = existingItem.imageUrl;
    if (shouldReplacePhoto && photo) {
      try {
        const savedPhoto = await saveUploadedPhoto(photo);
        if (savedPhoto) {
          imageUrl = savedPhoto.imageUrl;
          uploadedFilePath = savedPhoto.filePath;
        }
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Could not update the menu item photo." },
          { status: 400 }
        );
      }
    }

    const hotel = await getDefaultHotel();

    const category = await ensureCategory(hotel.id, categoryName || (await prisma.category.findUnique({ where: { id: existingItem.categoryId } }))?.name || "General");

    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        categoryId: category.id,
        name: name || existingItem.name,
        description: description || existingItem.description,
        price,
        prepTimeMins,
        imageUrl,
      },
    });

    uploadedFilePath = undefined;
    const previousPhotoPath = getUploadedPhotoPath(existingItem.imageUrl);
    if (shouldReplacePhoto && previousPhotoPath) {
      await removeUploadedPhoto(previousPhotoPath);
    }

    return NextResponse.json(item, { status: 200 });
  } catch (error) {
    if (uploadedFilePath) await removeUploadedPhoto(uploadedFilePath);
    console.error("Failed to update menu item:", error);
    return NextResponse.json({ error: "Could not update the menu item." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Administrator sign-in required." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const id = String(body.id ?? "").trim();

    if (!id) {
      return NextResponse.json({ error: "Menu item ID is required." }, { status: 400 });
    }

    const item = await prisma.menuItem.findFirst({
      where: {
        id,
        category: { hotel: { slug: DEFAULT_HOTEL_SLUG } },
      },
    });
    if (!item) {
      return NextResponse.json({ error: "Menu item not found." }, { status: 404 });
    }

    const photoPath = getUploadedPhotoPath(item.imageUrl);
    await prisma.menuItem.delete({ where: { id } });
    if (photoPath) await removeUploadedPhoto(photoPath);

    return NextResponse.json({ ok: true, id }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete menu item:", error);
    return NextResponse.json({ error: "Could not delete the menu item." }, { status: 500 });
  }
}
