import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { getAuthSession } from "@/lib/auth";
import { ADMIN_CUSTOM_SCRIPTS, ADMIN_RUNNABLE_SCRIPT_SET } from "@/lib/admin-custom-scripts";

export const runtime = "nodejs";

const MAX_OUTPUT_CHARS = 12000;
const MAX_RUN_MS = 10 * 60 * 1000;

function trimOutput(value: string) {
  if (value.length <= MAX_OUTPUT_CHARS) return value;
  return `${value.slice(0, MAX_OUTPUT_CHARS)}\n... output truncated ...`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const rootAdminEmail = process.env.ROOT_ADMIN_EMAIL?.toLowerCase().trim();
    const sessionEmail = session?.user?.email?.toLowerCase().trim();

    if (!session?.user?.id || !rootAdminEmail || !sessionEmail || sessionEmail !== rootAdminEmail) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const script = typeof body?.script === "string" ? body.script.trim() : "";
    if (!script) {
      return NextResponse.json({ error: "Missing script" }, { status: 400 });
    }
    if (!ADMIN_RUNNABLE_SCRIPT_SET.has(script)) {
      return NextResponse.json({ error: "Script not allowed" }, { status: 400 });
    }

    const scriptMeta = ADMIN_CUSTOM_SCRIPTS.find((item) => item.script === script);
    if (!scriptMeta) {
      return NextResponse.json({ error: "Unknown script" }, { status: 404 });
    }

    const command = `npm run ${script}`;
    const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
    const startedAt = Date.now();

    const result = await new Promise<{
      ok: boolean;
      exitCode: number | null;
      stdout: string;
      stderr: string;
    }>((resolve) => {
      const child = spawn(npmCommand, ["run", script], {
        cwd: process.cwd(),
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
      }, MAX_RUN_MS);

      child.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString("utf8");
      });

      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString("utf8");
      });

      child.on("close", (exitCode) => {
        clearTimeout(timer);
        if (timedOut) {
          resolve({
            ok: false,
            exitCode: exitCode ?? -1,
            stdout,
            stderr: `${stderr}\nExecution timed out after ${Math.round(MAX_RUN_MS / 1000)} seconds.`,
          });
          return;
        }
        resolve({
          ok: (exitCode ?? 1) === 0,
          exitCode: exitCode ?? null,
          stdout,
          stderr,
        });
      });
    });

    return NextResponse.json({
      script,
      command,
      ok: result.ok,
      exitCode: result.exitCode,
      durationMs: Date.now() - startedAt,
      stdout: trimOutput(result.stdout),
      stderr: trimOutput(result.stderr),
    });
  } catch (error) {
    console.error("Failed to run admin script:", error);
    return NextResponse.json({ error: "Failed to run script" }, { status: 500 });
  }
}
