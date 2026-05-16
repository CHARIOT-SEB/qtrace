# QTrace

A modern, browser-based SAXS data analysis tool — a spiritual successor to [Scatter IV](https://bl1231.als.lbl.gov/scatter/) by Rob Rambo.

Built with **React + TypeScript + Vite**. Runs entirely in the browser — no backend, no install.

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

- **R<sub>g</sub>** = √(−3 · slope) — radius of gyration
- **I(0)** = exp(intercept) — forward scattering intensity

## Roadmap

- [ ] Error-weighted linear fit (currently OLS)
- [ ] Kratky plot (q² · I vs q)
- [ ] Porod analysis & volume
- [ ] P(r) distribution via indirect Fourier transform
- [ ] SEC-SAXS frame selection
- [ ] Export results as CSV / report

## Credits

Inspired by Scatter IV (Dr. Rob Rambo, Diamond Light Source / SIBYLS beamline).
