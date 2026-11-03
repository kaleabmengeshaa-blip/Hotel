import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma, DEFAULT_HOTEL_SLUG } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Administrator sign-in required." }, { status: 401 });
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Category name is required." }, { status: 400 });
    }

    if (!body || typeof body !== "object" || !("name" in body) || typeof body.name !== "string") {
      return NextResponse.json({ error: "Category name is required." }, { status: 400 });
    }

    const name = body.name.trim();
    if (!name || name.length > 80) {
      return NextResponse.json(
        { error: "Enter a category name of 1 to 80 characters." },
        { status: 400 }
      );
    }

    const hotel = await prisma.hotel.findUnique({ where: { slug: DEFAULT_HOTEL_SLUG } });
    if (!hotel) {
      return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }

    const existing = await prisma.category.findFirst({
      where: { hotelId: hotel.id, name },
    });
    if (existing) {
      return NextResponse.json({ error: "That category already exists." }, { status: 409 });
    }

    const lastCategory = await prisma.category.findFirst({
      where: { hotelId: hotel.id },
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });
    const category = await prisma.category.create({
      data: {
        hotelId: hotel.id,
        name,
        displayOrder: (lastCategory?.displayOrder ?? 0) + 1,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/m/[hotelSlug]", "page");
    return NextResponse.json(
      { category: { ...category, items: [] } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to add category:", error);
    return NextResponse.json({ error: "Could not add the category." }, { status: 500 });
  }
}
