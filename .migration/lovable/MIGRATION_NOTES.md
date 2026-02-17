# Lovable -> Next.js Migration Notes

Source copied from:
`/Users/fmoya/Documents/Posibles proyectos/resume-ai-connector`

This folder is a staging area. Files are not wired automatically into Next.js routes.

## Suggested integration order

1. Tokens/styles:
   - Review `meta/tailwind.config.ts`
   - Merge CSS variables into `app/globals.css`

2. Shared UI components:
   - Start with `src/components`
   - Move reusable parts to `components/` or `app/_components/`

3. Pages:
   - Convert each staged page from `src/pages` to `app/<route>/page.tsx`
   - Replace `react-router-dom` with `next/link` + `useRouter`

4. Hooks/lib:
   - Merge only UI-safe helpers from `src/hooks` and `src/lib`
   - Do not overwrite backend/auth logic in `resumeai`

5. Assets:
   - Copy staged `public` assets to root `public/` as needed

## Important

- Keep Next.js API/auth/Prisma files unchanged.
- Do not copy `vite.config`, `index.html`, or Lovable `main.tsx` into Next.js runtime paths.
- Validate after each page migration:
  - `npm run dev`
  - `npm run build`
