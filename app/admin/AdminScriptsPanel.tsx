"use client";

import { useMemo, useState } from "react";
import type { AdminCustomScript } from "@/lib/admin-custom-scripts";

type RunResult = {
  script: string;
  ok: boolean;
  exitCode: number | null;
  durationMs: number;
  stdout: string;
  stderr: string;
  command: string;
};

type Props = {
  scripts: AdminCustomScript[];
};

function categoryLabel(category: AdminCustomScript["category"]) {
  switch (category) {
    case "templates":
      return "Templates";
    case "e2e":
      return "E2E";
    case "database":
      return "Database";
    case "migrations":
      return "Migrations";
    case "payments":
      return "Payments";
    default:
      return category;
  }
}

export default function AdminScriptsPanel({ scripts }: Props) {
  const [runningScript, setRunningScript] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [results, setResults] = useState<Record<string, RunResult>>({});
  const [activeCategory, setActiveCategory] = useState<AdminCustomScript["category"]>("templates");

  const grouped = useMemo(() => {
    const map = new Map<AdminCustomScript["category"], AdminCustomScript[]>();
    for (const script of scripts) {
      const current = map.get(script.category) || [];
      current.push(script);
      map.set(script.category, current);
    }
    return Array.from(map.entries());
  }, [scripts]);

  const categories = useMemo(
    () =>
      grouped.map(([category]) => category).sort((a, b) => {
        const order: AdminCustomScript["category"][] = [
          "templates",
          "e2e",
          "database",
          "migrations",
          "payments",
        ];
        return order.indexOf(a) - order.indexOf(b);
      }),
    [grouped]
  );

  const activeItems = useMemo(
    () => grouped.find(([category]) => category === activeCategory)?.[1] || [],
    [grouped, activeCategory]
  );

  const handleCopy = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setError("");
      setMessage(`Command copied: ${command}`);
    } catch {
      setMessage("");
      setError("Could not copy command to clipboard.");
    }
  };

  const handleRun = async (script: string) => {
    setRunningScript(script);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/scripts/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ script }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Script execution failed.");
      }

      setResults((prev) => ({ ...prev, [script]: data }));
      if (data.ok) {
        setMessage(`${script} completed successfully in ${Math.round(data.durationMs / 1000)}s.`);
      } else {
        setError(`${script} finished with exit code ${data.exitCode ?? "unknown"}.`);
      }
    } catch (e: any) {
      setError(e?.message || "Script execution failed.");
    } finally {
      setRunningScript(null);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="font-semibold text-slate-900">Custom Scripts Control Center</h2>
        <p className="text-xs text-slate-600">
          Ejecuta y revisa todos tus scripts custom desde admin. Solo root admin puede correrlos.
        </p>
      </div>

      {message ? <p className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{message}</p> : null}
      {error ? <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
              activeCategory === category
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {categoryLabel(category)}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
            {categoryLabel(activeCategory)}
          </p>
        </div>
        <div className="space-y-3 p-3">
          {activeItems.map((item) => {
            const result = results[item.script];
            return (
              <div key={item.script} className="rounded-md border border-slate-200 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-600">{item.description}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                    {item.script}
                  </span>
                </div>

                <p className="mt-2 rounded bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700">
                  {item.command}
                </p>

                {item.prerequisites?.length ? (
                  <p className="mt-2 text-[11px] text-amber-700">
                    Prereqs: {item.prerequisites.join(" · ")}
                  </p>
                ) : null}

                {item.runNote ? <p className="mt-2 text-[11px] text-slate-500">{item.runNote}</p> : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleRun(item.script)}
                    disabled={!item.runAllowed || runningScript !== null}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {runningScript === item.script ? "Running..." : "Run Script"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.command)}
                    className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Copy Command
                  </button>
                </div>

                {result ? (
                  <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-2">
                    <p
                      className={`text-xs font-semibold ${
                        result.ok ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      Last run: {result.ok ? "success" : "failed"} · exit {result.exitCode ?? "n/a"} ·{" "}
                      {Math.round(result.durationMs / 1000)}s
                    </p>
                    {result.stdout ? (
                      <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-[11px] text-slate-700">
                        {result.stdout}
                      </pre>
                    ) : null}
                    {result.stderr ? (
                      <pre className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap text-[11px] text-red-700">
                        {result.stderr}
                      </pre>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
          {activeItems.length === 0 ? (
            <p className="text-xs text-slate-500">No scripts found in this category.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
