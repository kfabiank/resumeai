type CsvRow = Record<string, string>;

export type LinkedInCsvType = "positions" | "education" | "skills" | "unknown";

function normalizeHeader(header: string) {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      out.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  out.push(current.trim());
  return out;
}

export function parseCsv(content: string): CsvRow[] {
  const lines = content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    const row: CsvRow = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? "";
    });
    rows.push(row);
  }

  return rows;
}

export function detectLinkedInCsvType(rows: CsvRow[]): LinkedInCsvType {
  if (!rows.length) return "unknown";
  const first = rows[0];
  const keys = Object.keys(first);
  const keySet = new Set(keys);

  if (
    keySet.has("company name") ||
    keySet.has("title") ||
    keySet.has("position")
  ) {
    return "positions";
  }

  if (
    keySet.has("school name") ||
    keySet.has("degree name") ||
    keySet.has("field of study")
  ) {
    return "education";
  }

  if (keySet.has("name") || keySet.has("skill name")) {
    const hasOnlyFewColumns = keys.length <= 4;
    if (hasOnlyFewColumns) return "skills";
  }

  return "unknown";
}

function parseLinkedInDate(raw: string) {
  const value = raw.trim();
  if (!value) return "";

  const isoLike = value.match(/^(\d{4})-(\d{1,2})/);
  if (isoLike) {
    const year = isoLike[1];
    const month = String(Number(isoLike[2])).padStart(2, "0");
    return `${year}-${month}`;
  }

  const slashLike = value.match(/^(\d{1,2})\/(\d{4})$/);
  if (slashLike) {
    const month = String(Number(slashLike[1])).padStart(2, "0");
    const year = slashLike[2];
    return `${year}-${month}`;
  }

  const monthMap: Record<string, string> = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12",
  };

  const textMatch = value.match(/^([A-Za-z]{3,9})\s+(\d{4})$/);
  if (textMatch) {
    const key = textMatch[1].slice(0, 3).toLowerCase();
    const month = monthMap[key];
    const year = textMatch[2];
    if (month) return `${year}-${month}`;
  }

  const yearOnly = value.match(/^(\d{4})$/);
  if (yearOnly) {
    return `${yearOnly[1]}-01`;
  }

  return "";
}

function readFirst(row: CsvRow, keys: string[]) {
  for (const key of keys) {
    const normalized = normalizeHeader(key);
    if (row[normalized]) return row[normalized].trim();
  }
  return "";
}

export function mapPositions(rows: CsvRow[]) {
  return rows
    .map((row) => {
      const title = readFirst(row, ["title", "position", "job title"]);
      const company = readFirst(row, ["company name", "company"]);
      const location = readFirst(row, ["location"]);
      const description = readFirst(row, ["description", "summary"]);
      const startDate = parseLinkedInDate(
        readFirst(row, ["started on", "start date", "from"])
      );
      const endRaw = readFirst(row, ["finished on", "end date", "to"]);
      const current = /present|current/i.test(endRaw);
      const endDate = current ? "" : parseLinkedInDate(endRaw);

      return {
        title,
        company,
        location,
        startDate,
        endDate,
        current,
        description,
      };
    })
    .filter((item) => item.title || item.company || item.description);
}

export function mapEducation(rows: CsvRow[]) {
  return rows
    .map((row) => {
      const institution = readFirst(row, ["school name", "school", "institution"]);
      const degree = readFirst(row, ["degree name", "degree", "field of study"]);
      const location = readFirst(row, ["location"]);
      const startDate = parseLinkedInDate(
        readFirst(row, ["start date", "started on", "from"])
      );
      const endDate = parseLinkedInDate(
        readFirst(row, ["end date", "finished on", "to"])
      );
      const graduationDate = endDate || startDate;
      const gpa = readFirst(row, ["grade", "gpa"]);

      return {
        degree,
        institution,
        location,
        graduationDate,
        gpa,
      };
    })
    .filter((item) => item.degree || item.institution);
}

export function mapSkills(rows: CsvRow[]) {
  const collected = rows
    .map((row) => readFirst(row, ["name", "skill name", "skill"]))
    .map((skill) => skill.trim())
    .filter(Boolean);

  return Array.from(new Set(collected));
}
