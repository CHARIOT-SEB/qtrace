# QTrace roadmap

Written 2026-08-29, after a review of the app and the preceding 20 commits. This
expands on the short checklist in the README, which stays as the one-line
summary.

## Where we are

The last 20 commits are almost entirely presentation: the styled-components
migration, mobile layout, colour palette, welcome modal, toolbar redesign,
navbar polish. The exceptions are `c4611aa` (weighted Guinier with confidence
intervals), `387086a` (Porod), and `d97c117` (Supabase accounts). The UI has
raced ahead of the science, and the science layer is where the ceiling is.

What is genuinely good and worth protecting:

- The analysis core in `src/lib/` is clean and honest - weighted least squares
  with real covariance-propagated `dRg`/`dI0`, a documented auto-find, and
  `analysisHeuristics.ts` explaining *why* a fit is bad rather than just
  scoring it.
- The cloud design: dedupe-by-checksum dataset upload, snapshots as thin rows
  pointing at one gzipped blob, RLS-only isolation with a public anon key.

## The theme for the next stage

**Make QTrace trustworthy enough that a structural biologist uses it on real
beamline data instead of as a demo.**

A careful user currently has three reasons not to: numbers they cannot verify,
an incomplete analysis story, and nothing they can put in a paper. Everything
below serves one of those three.

## Major work, in recommended order

### 1. Test harness - DONE (2026-08-29)

Vitest over `src/lib`, 86 tests, ~89% statement coverage, running in about a
second. `npm run test`, `npm run coverage`, `npm run typecheck`, `npm run lint`.

- **Fixtures** (`src/test/fixtures.ts`) are seeded and analytically exact: a
  pure Guinier curve, a sphere form factor with closed-form Rg and volume, and a
  synthetic SEC run. The app's own `sampleData.ts` could not back a regression
  test - it uses bare `Math.random()` and adds an oscillatory tail that
  perturbs the low-q region.
- **Real-data slot** at `src/test/data/`, discovering cases from a committed
  directory for redistributable data and a gitignored `local/` one for real
  experimental data, which must never be committed. A guard test asserts the
  ignore rule still exists. With no cases present the data tests skip and the
  suite passes, which is what CI sees. See the README there.
- **eslint** now actually runs - a flat config was added along with the missing
  dependencies. Clean at 0 errors, 15 warnings.
- **CI** at `.github/workflows/ci.yml`: lint, type-check, test, build on push
  and PR.

Two problems surfaced while building it, both fixed:

- `tsconfig.node.json` had `composite: true` with no `outDir`, so `tsc -b`
  emitted `vite.config.js` into the repo root - and Vite resolves `.js` ahead of
  `.ts`. Every build was reading a stale compiled config. Output now goes to
  `node_modules/.tmp`.
- Tests needed Node types and a newer lib than the browser app targets, so they
  type-check under their own `tsconfig.test.json` rather than loosening
  `tsconfig.app.json`.

Left deliberately undone:

- `sampleData.ts` sits at 0% coverage. It is a UI convenience generator, not
  analysis, and testing a random-number source has little value.
- eslint-plugin-react-hooks v7 ships compiler-adjacent rules
  (`set-state-in-effect`, `immutability`, `purity`) that flag real patterns in
  `SecTrace`, `WelcomeModal` and `useCloudSnapshots`. They are switched off so
  the config could land green; turning them on is its own pass.
- No component or hook tests. Worth revisiting once the UI settles.

### 2. Fix Porod, then build molecular weight on top

`computePorod` in `src/lib/porod.ts` integrates `q^2 * I(q)` over only the
measured range - no low-q extrapolation to q -> 0, no Porod `q^-4` tail beyond
`qmax`, and no constant background subtraction. The invariant is therefore
truncated and Vp is systematically off, yet `StatsRow` presents it as a bare
number with no caveat. This is the most defensible bug in the codebase.

Once Q is correct, **molecular weight** falls out nearly free - and MW is what
most users actually come for. Implement both routes:

- the Porod-volume estimate, and
- Rambo-Tainer volume-of-correlation (Vc), which is robust to q-range
  truncation and acts as a cross-check.

### 3. P(r) distribution and Dmax via indirect Fourier transform

Already on the README roadmap, and it is the other half of a real SAXS session.
Guinier gives Rg from the low-q sliver; P(r) uses the whole curve and describes
the shape. Without it QTrace answers half the question.

The largest single piece of work here - regularised IFT with alpha selection -
but it is what makes the app complete rather than a Guinier tool.

### 4. Per-frame Rg trace on the SEC chromatogram

`autoDetectRegions` in `src/lib/secSaxs.ts` thresholds on mean intensity at 50%.
That finds *a* peak but says nothing about whether it is one species. The
standard move is an Rg-vs-frame overlay: flat across the peak means
monodisperse, sloping means heterogeneity or aggregation.

`computeGuinier` and the frames are already in hand, so this is mostly plumbing,
and it directly improves the frame selection users are making by hand today.

### 5. Report export, not just CSV

`src/lib/csvExport.ts` is thorough, but nobody puts a CSV in a paper. A one-page
PDF/PNG - Guinier plot, residuals, stats with uncertainties, the insights list,
provenance - is what gets QTrace used in a lab and shared with a supervisor.

## Smaller fixes worth doing along the way

- **q units.** `parseDat` assumes inverse angstroms. Feed it an inverse-nanometre
  file (common from several beamlines) and Rg is silently wrong by a factor of
  10. Header sniffing plus a visible unit toggle is cheap insurance against
  exactly the failure mode that destroys trust.
- ~~**`@anthropic-ai/claude-code` is in `dependencies`**~~ - removed 2026-08-29.
- **Manual deploy.** CI now checks every push, but `npm run deploy` still runs
  from a dev machine against a local `.env.production`. A Pages deploy job needs
  the Supabase URL and anon key added as repository secrets first.
- **Bundle size.** 993 kB main chunk plus roughly 1.5 MB of Blueprint icon fonts
  and SVGs. Subset the icons and lazy-load the charts.
- **Parsing is main-thread.** `FileDropZone` uses `FileReader` with no worker, and
  `ProcessingModal` fakes its stages with `setTimeout` ticks. A 500-frame SEC run
  will jank badly. Move parsing to a worker and report real progress.
- **No error boundary.** One bad chart render blanks the whole app.
- **Accounts do not yet pay off.** You can save snapshots but not compare them.
  Snapshot-vs-snapshot overlay (two curves, Rg delta) is the feature that
  justifies having built the auth system.
- **Memory shape.** Frames are plain JS number arrays shared by reference into
  snapshots. Fine today; typed arrays (`Float64Array`) would cut memory and speed
  up fitting once SEC runs get large.
- **Guinier auto-find scoring.** `autoFindGuinierRegion` ranks windows by R^2 with
  a small q*Rg penalty. The stronger convention is a q*Rg window plus a check for
  systematic structure in the residuals.

## Sequencing

~~Tests~~ -> Porod fix and MW -> SEC per-frame Rg -> report export -> P(r).

Item 2 has a target waiting for it: `porod.test.ts` holds an `it.fails` case
asserting the true sphere volume within 1%. Vitest reports a passing `.fails`
test as a failure, so the marker turns red the moment extrapolation lands and
forces itself to be promoted.

This keeps every step verifiable and puts a user-visible win in front of us at
each stage.
