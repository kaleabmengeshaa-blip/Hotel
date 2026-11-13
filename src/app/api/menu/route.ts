import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noCacheHeaders = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const isAdmin = await isAdminAuthenticated();
    const menuSettings = await prisma.menuSettings.findUnique({
      where: { id: "global" },
      select: { newestDishesFirst: true },
    });

    const hotel = await prisma.hotel.findUnique({
      where: { slug: "default" },
      select: {
        categories: {
          include: {
            items: {
              where: isAdmin ? undefined : { isAvailable: true },
              orderBy: menuSettings?.newestDishesFirst
                ? [{ createdAt: "desc" }, { displayOrder: "asc" }]
                : [{ displayOrder: "asc" }, { createdAt: "desc" }],
            },
          },
          orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    return NextResponse.json(hotel?.categories ?? [], { headers: noCacheHeaders });
  } catch (error) {
    console.error("Failed to load menu:", error);
    return NextResponse.json(
      { error: "Failed to load menu" },
      { status: 500, headers: noCacheHeaders },
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Administrator sign-in required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    return NextResponse.json({ ok: true, body }, { status: 201 });
  } catch (error) {
    console.error("Failed to create menu item:", error);
    return NextResponse.json(
      { error: "Could not save the menu item." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Administrator sign-in required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    return NextResponse.json({ ok: true, body }, { status: 200 });
  } catch (error) {
    console.error("Failed to update menu item:", error);
    return NextResponse.json(
      { error: "Could not update the menu item." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Administrator sign-in required." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    return NextResponse.json({ ok: true, body }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete menu item:", error);
    return NextResponse.json(
      { error: "Could not delete the menu item." },
      { status: 500 },
    );
  }
}
