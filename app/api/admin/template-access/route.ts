import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import {
  getDefaultTemplateAccessMap,
  getEffectiveTemplateAccessMap,
  saveTemplateAccessOverride,
} from "@/lib/template-access";

function isAdminEmail(email: string | null | undefined) {
  const rootAdminEmail = process.env.ROOT_ADMIN_EMAIL?.toLowerCase().trim();
  const sessionEmail = email?.toLowerCase().trim();
  return Boolean(rootAdminEmail && sessionEmail && rootAdminEmail === sessionEmail);
}

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const map = await getEffectiveTemplateAccessMap();
    return NextResponse.json({ map });
  } catch (error: any) {
    return NextResponse.json(
      {
        map: getDefaultTemplateAccessMap(),
        warning: "Falling back to defaults",
        error: error?.message || "Failed to load template access from DB",
      },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { map?: unknown };
  if (!body.map || typeof body.map !== "object") {
    return NextResponse.json({ error: "Invalid payload, expected map object" }, { status: 400 });
  }

  try {
    const saved = await saveTemplateAccessOverride(session.user.id, body.map);
    return NextResponse.json({ ok: true, map: saved });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to save template access", message: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
