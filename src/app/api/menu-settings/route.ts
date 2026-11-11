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
      select: { languageSwitcherEnabled: true },
    });

    return NextResponse.json(
      { languageSwitcherEnabled: settings?.languageSwitcherEnabled ?? false },
      { headers: noCacheHeaders },
    );
  } catch (error) {
    console.error("Could not load menu language setting:", error);
    return NextResponse.json(
      { error: "Could not load the language setting." },
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
      { error: "A language setting is required." },
      { status: 400, headers: noCacheHeaders },
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("languageSwitcherEnabled" in body) ||
    typeof body.languageSwitcherEnabled !== "boolean"
  ) {
    return NextResponse.json(
      { error: "A valid language setting is required." },
      { status: 400, headers: noCacheHeaders },
    );
  }

  try {
    const settings = await prisma.menuSettings.upsert({
      where: { id: "global" },
      create: { id: "global", languageSwitcherEnabled: body.languageSwitcherEnabled },
      update: { languageSwitcherEnabled: body.languageSwitcherEnabled },
      select: { languageSwitcherEnabled: true },
    });

    return NextResponse.json(settings, { headers: noCacheHeaders });
  } catch (error) {
    console.error("Could not update menu language setting:", error);
    return NextResponse.json(
      { error: "Could not update the language setting." },
      { status: 500, headers: noCacheHeaders },
    );
  }
}
