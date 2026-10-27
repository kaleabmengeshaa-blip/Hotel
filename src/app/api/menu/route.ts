
import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { prisma, DEFAULT_HOTEL_NAME, DEFAULT_HOTEL_SLUG } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        items: {
          orderBy: { displayOrder: "asc" },
        },
      },
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json(categories);
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
  await writeFile(uploadedFilePath, Buffer.from(await photo.arrayBuffer()));

  return `/uploads/${fileName}`;
}

async function getDefaultHotel() {
  return prisma.hotel.upsert({
    where: { slug: DEFAULT_HOTEL_SLUG },
    update: { name: DEFAULT_HOTEL_NAME },
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

    if (!Number.isFinite(price) || price < 0) {
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

    if (photo) {
      try {
        const savedPhoto = await saveUploadedPhoto(photo);
        if (savedPhoto) {
          imageUrl = savedPhoto;
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

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (uploadedFilePath) await rm(uploadedFilePath, { force: true }).catch(() => undefined);
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

  try {
    const isMultipart = request.headers.get("content-type")?.includes("multipart/form-data");
    const formData = isMultipart ? await request.formData() : null;
    const body = !isMultipart ? await request.json() : null;

    const id = String(formData?.get("id") ?? body?.id ?? "").trim();
    const name = String(formData?.get("name") ?? body?.name ?? "").trim();
    const description = String(formData?.get("description") ?? body?.description ?? "").trim();
    const categoryName = String(formData?.get("category") ?? body?.category ?? "").trim();
    const price = Number(formData?.get("price") ?? body?.price ?? 0);
    const prepTimeMins = Number(formData?.get("prepTimeMins") ?? body?.prepTimeMins ?? 0);
    const photoEntry = formData?.get("photo");
    const shouldReplacePhoto = photoEntry instanceof File && photoEntry.size > 0;
    const photo = shouldReplacePhoto ? photoEntry : null;

    if (!id) {
      return NextResponse.json({ error: "Menu item ID is required." }, { status: 400 });
    }

    const existingItem = await prisma.menuItem.findUnique({ where: { id } });
    if (!existingItem) {
      return NextResponse.json({ error: "Menu item not found." }, { status: 404 });
    }

    let imageUrl = existingItem.imageUrl;
    if (shouldReplacePhoto && photo) {
      try {
        const savedPhoto = await saveUploadedPhoto(photo);
        if (savedPhoto) {
          imageUrl = savedPhoto;
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
        price: Number.isFinite(price) && price >= 0 ? price : existingItem.price,
        prepTimeMins: Number.isInteger(prepTimeMins) && prepTimeMins >= 0 ? prepTimeMins : existingItem.prepTimeMins,
        imageUrl,
      },
    });

    return NextResponse.json(item, { status: 200 });
  } catch (error) {
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

    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Menu item not found." }, { status: 404 });
    }

    if (item.imageUrl && item.imageUrl.startsWith("/uploads/")) {
      const filePath = join(process.cwd(), "public", item.imageUrl.replace(/^\//, ""));
      await rm(filePath, { force: true }).catch(() => undefined);
    }

    await prisma.menuItem.delete({ where: { id } });

    return NextResponse.json({ ok: true, id }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete menu item:", error);
    return NextResponse.json({ error: "Could not delete the menu item." }, { status: 500 });
  }
}
