import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import {
  canPlanUseTemplate,
  getEffectiveTemplateAccessMap,
} from "@/lib/template-access";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { planType: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const map = await getEffectiveTemplateAccessMap();
  const resolvedPlan = user.planType || "free";
  const allowedTemplateIds = Object.keys(map).filter((templateId) =>
    canPlanUseTemplate(resolvedPlan, templateId, map)
  );

  return NextResponse.json({
    planType: resolvedPlan,
    allowedTemplateIds,
    map,
  });
}
