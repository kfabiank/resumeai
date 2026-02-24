export default function UnderConstruction() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-3 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
          Maintenance Mode
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          We are under construction
        </h1>
        <p className="mt-4 max-w-xl text-sm text-slate-300 sm:text-base">
          We are improving the platform and payment experience. Please check back soon.
        </p>
      </div>
    </main>
  );
}
