Create a premium, conversion-focused pricing experience for ResumeAI inspired by top SaaS pricing pages (like Enhancv), but do not copy branding or exact layout.

Context:
- App is Next.js 14 (App Router) + TypeScript + Tailwind.
- Existing routes and APIs already exist.
- Pricing data must come from GET /api/stripe/plans.
- Checkout must use POST /api/stripe/checkout with { plan, billingPeriod, priceId }.
- Keep compatibility with existing auth/session logic.
- Maintain existing site nav and visual language.

Goal:
Design and implement an interactive pricing page that feels modern, trustworthy, and high-converting on desktop and mobile.

Deliverables:
1) Rewrite app/pricing/page.tsx
2) Add reusable components under components/pricing/*
3) Keep code strongly typed and clean
4) No mock prices in final UI
5) Add graceful loading/error/empty states

Required UX sections:
1. Hero section
- Headline + subheadline focused on outcomes (ATS, interviews, speed)
- Trust badges (secure checkout, cancel anytime, used by X users)
- CTA anchor button: “See Plans”

2. Interactive billing toggle
- Monthly / Yearly switch with clear savings badge (“Save 20%”)
- Smooth animated number transitions on plan cards

3. Plan cards (Free, Pro, Premium)
- Pro marked as “Most Popular”
- Clear CTAs:
  - Free -> /builder/new
  - Paid -> checkout button
- Show what is included/excluded with concise bullets
- If user is logged in and already on that plan:
  - disable CTA
  - show “Current plan”
- If Stripe plan missing/inactive:
  - disable CTA + informative tooltip/message

4. Feature comparison matrix
- Rows grouped by category (Core, Templates, Exports, Support)
- Desktop: sticky first column
- Mobile: compact stacked comparison
- Visual highlights where plans differ

5. FAQ accordion
- 6–8 practical questions (billing, cancellation, refunds, upgrades/downgrades, invoices, plan limits)

6. Trust + guarantee block
- “14-day money-back guarantee”
- “Secure payment powered by Stripe”
- “No hidden fees”

Interaction + animation requirements:
- Subtle entrance animations (fade/slide/stagger)
- Hover elevation on cards/buttons
- Smooth toggle transition
- Respect prefers-reduced-motion

Technical requirements:
- Fetch plans from /api/stripe/plans on mount
- Normalize this shape:
  - plan: "pro" | "premium"
  - billingPeriod: "monthly" | "annual"
  - priceId
  - unitAmount (in cents)
  - currency
  - productName
  - active
- Build derived model:
  - prices.pro.monthly, prices.pro.annual, etc.
  - corresponding priceIds for checkout
- Checkout flow:
  - call /api/stripe/checkout
  - loading state per plan button
  - show API error banner
  - redirect to data.url on success
- Never hardcode numeric prices in final render

Accessibility:
- Proper headings hierarchy
- All controls keyboard accessible
- Visible focus states
- aria-expanded/aria-controls for FAQ
- Minimum contrast AA

Design direction:
- Clean, high-contrast, trustworthy SaaS style
- Strong typography hierarchy
- Clear whitespace rhythm
- Avoid generic template look
- Keep color system aligned with existing app (blue primary), avoid purple-heavy default styling

Responsive behavior:
- Mobile-first
- Cards stack on mobile, 3-column on desktop
- Comparison table transforms to cards/list on small screens

Code quality:
- Extract components:
  - PricingHero
  - BillingToggle
  - PlanCard
  - FeatureComparison
  - PricingFAQ
  - TrustBlock
- Keep page component orchestration-focused
- Add helper formatter for currency display
- Strict TypeScript types, no any

Acceptance criteria:
- Page loads with real Stripe prices
- Toggle monthly/annual updates all prices instantly
- Paid checkout buttons call API with correct priceId
- Current plan state is reflected for logged-in users
- Missing Stripe config does not crash page
- Mobile UX is polished and usable
