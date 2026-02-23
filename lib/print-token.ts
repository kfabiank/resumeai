import crypto from "node:crypto";

function getSecret() {
  return (
    process.env.PRINT_EXPORT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "resume-print-secret"
  );
}

export function createPrintToken(resumeId: string, ttlSeconds = 180) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${resumeId}:${exp}`;
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${exp}.${sig}`;
}

export function verifyPrintToken(resumeId: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const [expRaw, sig] = token.split(".");
  if (!expRaw || !sig) return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp)) return false;
  if (Math.floor(Date.now() / 1000) > exp) return false;

  const payload = `${resumeId}:${exp}`;
  const expected = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
