import Link from "next/link";
import Image from "next/image";

export default function AppFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 grid gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center space-x-2">
              <Image
                src="/logo-b-neural-dark.svg"
                alt="Resuify"
                width={150}
                height={34}
                className="h-12 w-auto"
              />
            </div>
            <p className="text-sm">
              AI-powered resume builder focused on ATS optimization and conversion-ready job applications.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/#features" className="transition hover:text-white">Features</Link></li>
              <li><Link href="/templates" className="transition hover:text-white">Templates</Link></li>
              <li><Link href="/pricing" className="transition hover:text-white">Pricing</Link></li>
              <li><Link href="/builder/new" className="transition hover:text-white">Resume Builder</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/#demo" className="transition hover:text-white">ATS Demo</Link></li>
              <li><Link href="/cover-letter" className="transition hover:text-white">Cover Letter</Link></li>
              <li><Link href="/tracker" className="transition hover:text-white">Application Tracker</Link></li>
              <li><Link href="/dashboard" className="transition hover:text-white">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="transition hover:text-white">Privacy</Link></li>
              <li><Link href="/terms" className="transition hover:text-white">Terms</Link></li>
              <li><Link href="/login" className="transition hover:text-white">Sign In</Link></li>
              <li><Link href="/pricing" className="transition hover:text-white">Upgrade</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-sm">
          <p>© {new Date().getFullYear()} ResumeAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
