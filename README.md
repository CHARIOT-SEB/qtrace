# QTrace

A modern, browser-based SAXS data analysis tool.

Built with **React + TypeScript + Vite**. Analysis runs entirely in the browser - nothing is
uploaded unless you sign in and explicitly save a snapshot to your account.

## Current state

Prototype. Implements **Guinier analysis** end-to-end:

- Drag-and-drop `.dat` file loading
- Live R<sub>g</sub>, I(0), q·R<sub>g</sub>, R² as you drag the fit window
- Residuals plot for fit quality
- Full I(q) vs q curve with the fit region highlighted
- Auto-find for a sensible default region

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Run the dev server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) (Vite should open it for you).

## Accounts (optional)

Without configuration QTrace behaves exactly as before: everything is in-session, and account
features hide themselves. To enable sign-in and cloud snapshots, point the app at a Supabase
project:

1. Create a project, run `supabase/schema.sql` in its SQL editor, and create a **private** storage
   bucket named `datasets` (the file's last policy expects it).
2. In Auth settings: enable the Email provider with **Confirm email** on, set the Site URL to the
   deployed app, and add `http://localhost:5173/qtrace/` as a redirect URL. Configure custom SMTP -
   the built-in sender is rate-limited to a handful of messages per hour.
3. Copy `.env.example` to `.env.local` (dev) and `.env.production` (for `npm run deploy`), filling
   in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Both values are public by design; user
   isolation comes from row-level security. The `service_role` key must never go in this repo.

Snapshots store frames once per dataset as a gzipped blob in storage, with each snapshot a small
row of ranges pointing at it.

## Other scripts

```bash
npm run build      # type-check and bundle for production into ./dist
npm run preview    # serve the production build locally
```

## Project structure

```
src/
├── App.tsx                   # top-level component, owns the data + range state
├── main.tsx                  # React entry point
├── styles.css                # global styles (light + dark mode)
├── components/
│   ├── FileDropZone.tsx      # drag-and-drop file input
│   ├── StatsRow.tsx          # Rg, I(0), q·Rg, R², n stat cards
│   ├── GuinierChart.tsx      # ln I vs q² with fit overlay
│   ├── ResidualsChart.tsx    # residuals from the linear fit
│   ├── FullCurveChart.tsx    # log I(q) vs q with selected region
│   └── RangeControls.tsx     # twin sliders for the fit window
├── lib/
│   ├── parseDat.ts           # .dat file parser
│   ├── guinier.ts            # linear fit + Guinier maths + auto-find
│   └── sampleData.ts         # synthetic test data
└── types/
    └── saxs.ts               # shared data types
```

## The maths

Guinier approximation, valid in the low-q regime where q·R<sub>g</sub> ≲ 1.3:

```
ln I(q) = ln I(0) − (Rg² / 3) · q²
```

Fitting ln I vs q² as a straight line gives:

- **R<sub>g</sub>** = √(−3 · slope) - radius of gyration
- **I(0)** = exp(intercept) - forward scattering intensity

## Roadmap

- [ ] Error-weighted linear fit (currently OLS)
- [ ] Kratky plot (q² · I vs q)
- [ ] Porod analysis & volume
- [ ] P(r) distribution via indirect Fourier transform
- [ ] SEC-SAXS frame selection
- [ ] Export results as CSV / report

