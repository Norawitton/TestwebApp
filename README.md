# ออมกัน (AomGun)

แอปจัดการรายรับ–รายจ่ายภาษาไทยแบบ mobile-first ช่วยบันทึกรายจ่ายจากสลิปธนาคาร
เพิ่มรายการด้วยตนเอง ตั้งงบประมาณ และวิเคราะห์พฤติกรรมการใช้เงิน พร้อมมาสคอต
"น้องออม" แมวไทยสีส้มที่คอยแนะนำและให้กำลังใจ

This is a Next.js (App Router) + TypeScript + Tailwind CSS v4 prototype PWA.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 — it redirects to `/onboarding` on first run, then
`/home` once onboarding is completed (tracked in the mocked profile record).

## Project structure

```
src/
  app/                    Route pages (Next.js App Router)
    onboarding/           3-slide onboarding
    home/                 Home Dashboard
    history/              Transaction History (search/filter/swipe)
    analytics/            Analytics & insights
    budget/               Budget + Saving Goals
    profile/              Profile & Privacy
    add/expense|income|credit-card/   Manual entry forms
    scan/                 Slip capture/upload + OCR review flow
  components/
    ui/                   Button, Card, ProgressBar, CategoryIcon, ScreenHeader, MascotTipCard
    mascot/                Mascot.tsx — original "น้องออม" SVG character, 8 poses
    illustrations/        Flat-vector/isometric scene illustrations
    charts/                Recharts wrappers (donut, line, bar)
    transactions/         TransactionForm, TransactionRow, AddTransactionSheet, SlipReviewSheet
    nav/                   AppShell, BottomNav
  hooks/
    useAppData.ts          Central data hook: wires the database service into React state
  lib/
    types.ts               Core data model (Transaction, Account, Budget, SavingGoal, UserProfile, ...)
    categories.ts           Category + bank definitions (labels, colors, icons)
    mockData.ts             ~25 seeded realistic Thai transactions, accounts, budget, goals
    format.ts               Thai Baht + Buddhist-era date formatting helpers
    analytics.ts            Derived-data calculations (sums, top categories/merchants, series)
    insights.ts              Rule-based Thai mascot coaching copy
    services/
      database.ts            ALL storage reads/writes go through here (currently localStorage)
      ocr.ts                  Mocked slip-scanning; swap internals for a real vision/OCR API
      auth.ts                 Mocked session/PIN; swap internals for real auth
```

## Swapping in real backends later

- **Database**: rewrite the internals of `lib/services/database.ts` to call
  Supabase/Firebase instead of `localStorage`. Function signatures already
  return Promises and match the shapes in `lib/types.ts`, so no consuming
  component should need to change.
- **OCR**: rewrite `lib/services/ocr.ts`'s `scanSlip()` to POST the captured
  image to a real slip-reading/vision endpoint and map the response into a
  `SlipOcrResult`.
- **Auth**: rewrite `lib/services/auth.ts` to call a real auth provider.

## Design system

Brand colors, type scale, radii, and motion are defined as CSS variables in
`src/app/globals.css` (prefixed `--ag-*`) and mirrored into Tailwind's
`@theme inline` block, so they're usable both as `bg-ag-yellow`-style
utility classes and as raw CSS variables.

- Font: IBM Plex Sans Thai (rounded, Thai-native, loaded via Google Fonts import)
- Mascot: `components/mascot/Mascot.tsx` — original character, no third-party assets
- Illustrations: `components/illustrations/Illustrations.tsx` — original flat/isometric geometric scenes
- Motion: a small set of orchestrated CSS keyframes in `globals.css`
  (slide-up on load, coin bounce, mascot blink, float, pulse ring), all
  respecting `prefers-reduced-motion`

## Known prototype limitations

- Data lives in `localStorage` and is seeded once per browser (see
  `ensureSeeded()` in `database.ts`); clearing site data or using the
  Profile screen's "ลบข้อมูลทั้งหมด" resets it.
- OCR results are randomized mock data, not a real slip reading.
- PIN/biometric and CSV export are functional (CSV export produces a real
  downloadable file); auth is a stub.
