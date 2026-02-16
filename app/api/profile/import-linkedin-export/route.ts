import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import {
  detectLinkedInCsvType,
  mapEducation,
  mapPositions,
  mapSkills,
  parseCsv,
  type LinkedInCsvType,
} from "@/lib/linkedin-import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

function detectTypeFromFilename(name: string): LinkedInCsvType {
  const lower = name.toLowerCase();
  if (lower.includes("position")) return "positions";
  if (lower.includes("education")) return "education";
  if (lower.includes("skill")) return "skills";
  return "unknown";
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStoreHeaders });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing CSV file. Upload LinkedIn Positions/Education/Skills CSV." },
      { status: 400, headers: noStoreHeaders }
    );
  }

  const content = await file.text();
  const rows = parseCsv(content);
  if (!rows.length) {
    return NextResponse.json(
      { error: "CSV appears empty or invalid." },
      { status: 400, headers: noStoreHeaders }
    );
  }

  const byName = detectTypeFromFilename(file.name);
  const byHeaders = detectLinkedInCsvType(rows);
  const type = byHeaders !== "unknown" ? byHeaders : byName;

  if (type === "unknown") {
    return NextResponse.json(
      {
        error:
          "Unsupported CSV format. Use LinkedIn export files like Positions.csv, Education.csv, or Skills.csv.",
      },
      { status: 400, headers: noStoreHeaders }
    );
  }

  const existing = await prisma.userProfile.findUnique({
    where: { userId },
    select: {
      experiences: true,
      education: true,
      skills: true,
    },
  });

  const currentExperiences = Array.isArray(existing?.experiences) ? existing?.experiences : [];
  const currentEducation = Array.isArray(existing?.education) ? existing?.education : [];
  const currentSkills = Array.isArray(existing?.skills) ? existing?.skills : [];

  let nextExperiences = currentExperiences;
  let nextEducation = currentEducation;
  let nextSkills = currentSkills;
  let importedCount = 0;

  if (type === "positions") {
    const mapped = mapPositions(rows);
    nextExperiences = mapped;
    importedCount = mapped.length;
  } else if (type === "education") {
    const mapped = mapEducation(rows);
    nextEducation = mapped;
    importedCount = mapped.length;
  } else if (type === "skills") {
    const mapped = mapSkills(rows);
    nextSkills = mapped;
    importedCount = mapped.length;
  }

  await prisma.userProfile.upsert({
    where: { userId },
    update: {
      experiences: nextExperiences,
      education: nextEducation,
      skills: nextSkills,
    },
    create: {
      userId,
      phone: null,
      location: null,
      headline: null,
      summary: null,
      linkedinUrl: null,
      portfolioUrl: null,
      githubUrl: null,
      experiences: nextExperiences,
      education: nextEducation,
      skills: nextSkills,
      languages: [],
      certifications: [],
    },
  });

  return NextResponse.json(
    {
      success: true,
      importedType: type,
      importedCount,
    },
    { headers: noStoreHeaders }
  );
}
