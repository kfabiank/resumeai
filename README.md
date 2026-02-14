# ResumeAI - AI-Powered Resume Builder

🎯 **ATS-Optimized Resumes in Minutes**

Create professional resumes that pass Applicant Tracking Systems with AI assistance.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
```bash
# Use Neon (recommended): https://console.neon.tech
# Create a project and copy:
# 1) Pooled connection string -> DATABASE_URL
# 2) Direct connection string -> DIRECT_URL
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your keys
```

### 4. Run Migrations
```bash
npx prisma generate
npx prisma db push
```

### 5. Start Development Server
```bash
npm run dev
```

Open http://localhost:3000

### 6. Run Unit Tests
```bash
npm run test
```

### 7. Run Coverage
```bash
npm run test:coverage
```

## 📦 What's Included

✅ **Complete Landing Page** - Professional design with pricing
✅ **Dashboard** - User stats, resume management
✅ **Resume Builder** - Multi-step wizard (coming soon)
✅ **ATS Score System** - Real-time scoring
✅ **Templates** - 5+ professional templates
✅ **Database Schema** - Complete Prisma schema
✅ **Stripe Integration** - Ready for payments
✅ **OpenAI Integration** - AI-powered generation

## 🔑 Required API Keys

1. **OpenAI** (Required) - https://platform.openai.com
   - Used for resume generation and optimization
   - Cost: ~$0.01-0.05 per resume

2. **Stripe** (Optional) - https://stripe.com
   - For payment processing
   - Test keys available

3. **PostgreSQL** (Required)
   - Local or Supabase/Railway/Neon
   - Free tiers available

## 💰 Pricing Plans

- **Free**: $0 - 3 resumes/month
- **Pro**: $19/mo - Unlimited resumes
- **Premium**: $49/mo - All features + tracker

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma
- **AI**: OpenAI GPT-4
- **Payments**: Stripe
- **Hosting**: Vercel (recommended)

## 📚 Documentation

See `ANALISIS_RESUMEAI.md` for complete documentation including:
- Architecture details
- API documentation
- Deployment guides
- Cost estimates
- Growth strategy

## 🚢 Deploy to Production

### Vercel (Recommended)
```bash
# 1. Push to GitHub
git init && git add . && git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main

# 2. Import to Vercel
# - Go to vercel.com
# - Import GitHub repo
# - Add environment variables
# - Deploy!
```

### Database Setup
1. Use Supabase (https://supabase.com) or Railway
2. Get connection string
3. Add to Vercel environment variables
4. Run migrations: `DATABASE_URL="..." npx prisma db push`

### Neon + Vercel (Recommended)
1. Create your DB in Neon: https://console.neon.tech
2. In Neon, copy:
   - `Pooled connection` -> `DATABASE_URL`
   - `Direct connection` -> `DIRECT_URL`
3. In Vercel Project Settings > Environment Variables, add both URLs.
4. Deploy and run schema sync once:
   - Local: `npx prisma db push`
   - Or with env inline: `DATABASE_URL="..." DIRECT_URL="..." npx prisma db push`

## 📁 Project Structure

```
resumeai/
├── app/
│   ├── page.tsx              # Landing page
│   ├── dashboard/            # User dashboard
│   ├── builder/              # Resume builder (to build)
│   └── api/                  # API routes (to build)
├── components/
│   └── ui/                   # Reusable components
├── lib/
│   ├── prisma.ts             # DB client
│   └── utils.ts              # Utilities
├── prisma/
│   └── schema.prisma         # Database schema
└── ANALISIS_RESUMEAI.md      # Complete documentation
```

## 🎯 Next Steps to Complete

1. **Build Resume Builder** - Multi-step form
2. **Integrate OpenAI** - Resume generation API
3. **Add Templates** - 5-10 professional designs
4. **Implement ATS Scoring** - Algorithm + UI
5. **Setup Stripe** - Payment flows
6. **Add Authentication** - NextAuth or Clerk
7. **PDF Export** - jsPDF integration
8. **Deploy** - Vercel + Supabase

## 💡 Features to Build

### Phase 1 (MVP - 2 weeks)
- [ ] Resume builder form
- [ ] Basic AI generation
- [ ] 3 templates
- [ ] PDF export
- [ ] Simple ATS score

### Phase 2 (Growth - 2 weeks)
- [ ] Stripe payments
- [ ] 10+ templates
- [ ] Advanced ATS scoring
- [ ] Cover letter generator
- [ ] User authentication

### Phase 3 (Scale - 4 weeks)
- [ ] Application tracker
- [ ] LinkedIn optimizer
- [ ] Analytics dashboard
- [ ] A/B template testing
- [ ] API for developers

## 🐛 Common Issues

**"Module not found: Can't resolve 'tailwindcss-animate'"**
```bash
npm install tailwindcss-animate
```

**"Prisma Client not found"**
```bash
npx prisma generate
```

**"Can't connect to database"**
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Test connection: `psql $DATABASE_URL`

## 📧 Support

- Documentation: See ANALISIS_RESUMEAI.md
- Issues: Create GitHub issue
- Email: support@resumeai.com (setup after launch)

## 📄 License

MIT License - See LICENSE file

---

Made with ❤️ for job seekers everywhere
