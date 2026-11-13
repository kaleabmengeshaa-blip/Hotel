import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noCacheHeaders = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const settings = await prisma.menuSettings.findUnique({
      where: { id: "global" },
      select: { languageSwitcherEnabled: true, newestDishesFirst: true },
    });

    return NextResponse.json(
      {
        languageSwitcherEnabled: settings?.languageSwitcherEnabled ?? false,
        newestDishesFirst: settings?.newestDishesFirst ?? false,
      },
      { headers: noCacheHeaders },
    );
  } catch (error) {
    console.error("Could not load menu settings:", error);
    return NextResponse.json(
      { error: "Could not load the menu settings." },
      { status: 500, headers: noCacheHeaders },
    );
  }
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { error: "Administrator sign-in required." },
      { status: 401, headers: noCacheHeaders },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Menu settings are required." },
      { status: 400, headers: noCacheHeaders },
    );
  }

  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  const hasLanguageSwitcher =
    payload !== null && "languageSwitcherEnabled" in payload && typeof payload.languageSwitcherEnabled === "boolean";
  const hasNewestDishesFirst =
    payload !== null && "newestDishesFirst" in payload && typeof payload.newestDishesFirst === "boolean";

  if (!payload || (!hasLanguageSwitcher && !hasNewestDishesFirst)) {
    return NextResponse.json(
      { error: "A valid menu setting is required." },
      { status: 400, headers: noCacheHeaders },
    );
  }

  try {
    const settings = await prisma.menuSettings.upsert({
      where: { id: "global" },
      create: {
        id: "global",
        languageSwitcherEnabled: hasLanguageSwitcher ? payload.languageSwitcherEnabled : false,
        newestDishesFirst: hasNewestDishesFirst ? payload.newestDishesFirst : false,
      },
      update: {
        ...(hasLanguageSwitcher ? { languageSwitcherEnabled: payload.languageSwitcherEnabled } : {}),
        ...(hasNewestDishesFirst ? { newestDishesFirst: payload.newestDishesFirst } : {}),
      },
      select: { languageSwitcherEnabled: true, newestDishesFirst: true },
    });

    return NextResponse.json(settings, { headers: noCacheHeaders });
  } catch (error) {
    console.error("Could not update menu settings:", error);
    return NextResponse.json(
      { error: "Could not update the menu settings." },
      { status: 500, headers: noCacheHeaders },
    );
  }
}
