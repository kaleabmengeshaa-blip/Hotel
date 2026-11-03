import { NextResponse } from "next/server";
import { DEFAULT_HOTEL_SLUG, prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";

const guestTokenPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const noCacheHeaders = { "Cache-Control": "no-store" };

// Guest selections are only useful during a visit. Anything untouched for this long
// is deleted (items cascade) so the table does not grow forever.
const SELECTION_RETENTION_MS = 10 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 1000;
let lastCleanupAt = 0;

function selectionCutoff() {
  return new Date(Date.now() - SELECTION_RETENTION_MS);
}

// Runs at most once per minute per server instance; the admin dashboard polls this route
// every few seconds, which is enough to keep cleanup going without a separate cron job.
async function cleanUpStaleSelections(hotelId: string) {
  const now = Date.now();
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;
  lastCleanupAt = now;

  try {
    const { count } = await prisma.guestSelection.deleteMany({
      where: { hotelId, updatedAt: { lt: selectionCutoff() } },
    });
    if (count > 0) console.info(`Removed ${count} stale guest selection(s).`);
  } catch (error) {
    console.error("Failed to clean up stale guest selections:", error);
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const guestToken = url.searchParams.get("guestToken");
    const hotel = await prisma.hotel.findUnique({
      where: { slug: DEFAULT_HOTEL_SLUG },
      select: { id: true },
    });

    if (!hotel) {
      return NextResponse.json([], { headers: noCacheHeaders });
    }

    if (guestToken !== null) {
      if (!guestTokenPattern.test(guestToken)) {
        return NextResponse.json({ error: "Invalid guest session." }, { status: 400 });
      }

      const selection = await prisma.guestSelection.findUnique({
        where: { hotelId_guestToken: { hotelId: hotel.id, guestToken } },
        include: { items: { orderBy: { updatedAt: "asc" } } },
      });

      if (selection && selection.updatedAt < selectionCutoff()) {
        await prisma.guestSelection.delete({ where: { id: selection.id } });
        return NextResponse.json([], { headers: noCacheHeaders });
      }

      return NextResponse.json(
        (selection?.items ?? []).map((item) => ({
          itemId: item.menuItemId,
          name: item.name,
          categoryName: item.categoryName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          unitPriceUsd: item.unitPriceUsd === null ? null : Number(item.unitPriceUsd),
        })),
        { headers: noCacheHeaders }
      );
    }

    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Administrator sign-in required." }, { status: 401 });
    }

    await cleanUpStaleSelections(hotel.id);

    const selections = await prisma.guestSelection.findMany({
      where: {
        hotelId: hotel.id,
        isDismissed: false,
        updatedAt: { gte: selectionCutoff() },
        items: { some: {} },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: { items: { orderBy: { updatedAt: "asc" } } },
    });

    return NextResponse.json(
      selections.map((selection) => ({
        id: selection.id,
        guestLabel: `Guest ${selection.guestToken.slice(0, 6).toUpperCase()}`,
        updatedAt: selection.updatedAt.toISOString(),
        items: selection.items.map((item) => ({
          itemId: item.menuItemId,
          name: item.name,
          categoryName: item.categoryName,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          unitPriceUsd: item.unitPriceUsd === null ? null : Number(item.unitPriceUsd),
        })),
      })),
      { headers: noCacheHeaders }
    );
  } catch (error) {
    console.error("Failed to load guest selections:", error);
    return NextResponse.json(
      { error: "Could not load guest selections." },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { guestToken, itemId, quantity } = body as {
    guestToken?: unknown;
    itemId?: unknown;
    quantity?: unknown;
  };

  if (
    typeof guestToken !== "string" ||
    !guestTokenPattern.test(guestToken) ||
    typeof itemId !== "string" ||
    itemId.length === 0 ||
    itemId.length > 100 ||
    !Number.isInteger(quantity) ||
    Number(quantity) < 0 ||
    Number(quantity) > 99
  ) {
    return NextResponse.json({ error: "Invalid selection." }, { status: 400 });
  }

  try {
    const hotel = await prisma.hotel.findUnique({
      where: { slug: DEFAULT_HOTEL_SLUG },
      select: { id: true },
    });
    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found." }, { status: 404 });
    }

    const requestedQuantity = Number(quantity);
    if (requestedQuantity === 0) {
      await prisma.$transaction(async (transaction) => {
        const selection = await transaction.guestSelection.findUnique({
          where: { hotelId_guestToken: { hotelId: hotel.id, guestToken } },
          select: { id: true, updatedAt: true },
        });
        if (selection) {
          if (selection.updatedAt < selectionCutoff()) {
            await transaction.guestSelection.delete({ where: { id: selection.id } });
            return;
          }

          await transaction.guestSelectionItem.deleteMany({
            where: { selectionId: selection.id, menuItemId: itemId },
          });
          await transaction.guestSelection.update({
            where: { id: selection.id },
            data: { updatedAt: new Date() },
          });
        }
      });
      return NextResponse.json({ ok: true });
    }

    const item = await prisma.menuItem.findFirst({
      where: {
        id: itemId,
        isAvailable: true,
        category: { hotelId: hotel.id },
      },
      include: { category: { select: { name: true } } },
    });

    if (!item) {
      return NextResponse.json(
        { error: "This menu item is no longer available." },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (transaction) => {
      const existingSelection = await transaction.guestSelection.findUnique({
        where: { hotelId_guestToken: { hotelId: hotel.id, guestToken } },
        select: { id: true, updatedAt: true },
      });
      if (existingSelection && existingSelection.updatedAt < selectionCutoff()) {
        await transaction.guestSelection.delete({ where: { id: existingSelection.id } });
      }

      const selection = await transaction.guestSelection.upsert({
        where: { hotelId_guestToken: { hotelId: hotel.id, guestToken } },
        create: { hotelId: hotel.id, guestToken },
        update: { updatedAt: new Date(), isDismissed: false },
        select: { id: true },
      });

      await transaction.guestSelectionItem.upsert({
        where: {
          selectionId_menuItemId: { selectionId: selection.id, menuItemId: itemId },
        },
        create: {
          selectionId: selection.id,
          menuItemId: itemId,
          name: item.name,
          categoryName: item.category.name,
          quantity: requestedQuantity,
          unitPrice: item.price,
          unitPriceUsd: item.priceUsd,
        },
        update: {
          name: item.name,
          categoryName: item.category.name,
          quantity: requestedQuantity,
          unitPrice: item.price,
          unitPriceUsd: item.priceUsd,
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to save guest selection:", error);
    return NextResponse.json(
      { error: "Could not save your selection." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Administrator sign-in required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const selectionId =
    body && typeof body === "object" && "id" in body && typeof body.id === "string"
      ? body.id.trim()
      : "";
  if (!selectionId) {
    return NextResponse.json({ error: "Selection ID is required." }, { status: 400 });
  }

  try {
    const hotel = await prisma.hotel.findUnique({
      where: { slug: DEFAULT_HOTEL_SLUG },
      select: { id: true },
    });
    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found." }, { status: 404 });
    }

    const result = await prisma.guestSelection.updateMany({
      where: { id: selectionId, hotelId: hotel.id },
      data: { isDismissed: true },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Selection not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to clear guest selection:", error);
    return NextResponse.json(
      { error: "Could not clear guest selection." },
      { status: 500 }
    );
  }
}
