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

### 2. Read q units from the file instead of assuming them

Corrected 2026-08-30 after looking at a real B21 file. The primary user recalled
that B21 emits nm^-1; the file itself declares otherwise:

```
# Diamond Light Source Ltd.
# Data extracted from: /dls/b21/.../b21-475689_00000.dat
q(1/A)          Column          Error
```

q runs 0.0045 to 0.34, which is inverse angstroms on its face. So the app has
**not** been mislabelling her Rg, and this is no longer a blocking correctness
bug. The lesson is the opposite of the one first drawn: the unit is stated in
the file, in a header line `parseDat` throws away, and neither assuming nor
sniffing nor asking the user was ever the right answer.

Scope: capture the header block in `parseDat` instead of discarding it, read the
q unit from the column header where present, carry a `qUnits` field on
`SaxsData`, and drive axis labels, stat cards and CSV headers from it. Fall back
to an explicit, visible, changeable choice when a file does not declare one -
never a silent default. Rg inherits q's inverse unit and volumes inherit its
cube, so the unit has to travel with every derived quantity.

Nothing in the analysis needs re-deriving: the only q-dependent threshold in
`src/lib` is `qRgMax > 1.3`, which is dimensionless, and everything else is
index-based.

The same header capture serves the report in item 6, which needs provenance.
Note what the header does *not* carry: there is no sample concentration in these
files, so the absolute MW route in item 3 still needs one entered by hand.

### 2b. autoFindGuinierRegion on real data - DONE (2026-08-30)

Found by running the pipeline over a real B21 file: `autoFindGuinierRegion`
returned `null`. Not a wrong answer - no answer, with the Auto-find button
silently doing nothing.

Cause: the search only considered windows starting within the first 15 points
and running 8-60 points long, which assumed a few-hundred-point curve. The B21
file carries 2551 points between q = 0.0045 and 0.34, so those windows spanned
q = 0.0045-0.014 - entirely inside the low-q upturn, where every candidate gave
a huge Rg, failed the `qRg <= 1.3` test, and was discarded. With a weaker upturn
the same cause produced something worse than nothing: a confident answer several
times too large.

Rewritten so the bounds are physical. Windows grow from each start until q*Rg
leaves the valid range rather than stopping at a fixed point count, start
candidates are strided so cost does not scale with grid density, and the score
now penalises the positive low-q residual bias that marks an upturn - R2 alone
prefers the upturn, which is straighter than the real Guinier region.

Measured on a 2551-point fixture with an upturn, against a known sphere Rg:

| upturn strength | before | after |
| --- | --- | --- |
| none | q*Rg only 0.55, 59 points | q*Rg 1.00, 159 points, 0.5% error |
| 0.25 | 23% error | 1.1% error |
| 0.5 | 221% error | 1.4% error |
| 1.0 | 336% error | 1.5% error |
| 2.0 | 463% error | 1.3% error |

On the real BSA run - 335 frames, buffer averaged from a matched baseline region
and subtracted - auto-find now returns Rg = 33.3 A at q*Rg = 1.00 with
R2 = 0.994, stable to 0.3 A across two independent buffer selections, in 22 ms.

Four regression tests cover it: grid-density independence, q*Rg coverage on a
beamline-density grid, recovery through an upturn, and the start index moving
outward as the upturn strengthens.

### 3. Fix Porod - DONE (2026-08-30) - then build molecular weight on top

`computePorod` in `src/lib/porod.ts` integrates `q^2 * I(q)` over only the
measured range - no low-q extrapolation to q -> 0, no Porod `q^-4` tail beyond
`qmax`, and no constant background subtraction. The invariant is therefore
truncated and Vp is systematically off, yet `StatsRow` presents it as a bare
number with no caveat. This is the most defensible bug in the codebase.

The invariant needed three separate corrections, not one. All three are in:

1. **Constant background.** Real data carries a flat background B, and the q^2
   weighting means it contributes B*q^3/3 - growing with the integration range.
   On real data this is a larger error than truncation. In the Porod region
   I(q) = B + K/q^4, so a straight-line fit of q^4*I against q^4 gives slope B
   and intercept K, reusing `linearFit`.
2. **High-q tail.** After subtracting B the tail is K/q^4, so the missing piece
   is a closed form: K/qmax. K comes free from the same fit.
3. **Low-q extrapolation.** Integrate the Guinier model from 0 to qmin. Small,
   and the cheapest of the three.

The background stays internal to the invariant and is surfaced as a diagnostic
(decision, 2026-08-30). The scattering curve, the Guinier fit and every existing
snapshot keep their current meaning.

This forced an API change: `computePorod` needs Rg for the low-q term, so the
signature is now `computePorod(data, guinierResult)`.

Measured against a sphere of known volume, over a realistic q window:

- volume recovered to within **0.15%**, where the old code was 4-7% high;
- the answer is now **independent of the background level** - identical to three
  decimal places at B = 0, 0.001, 0.01 and 0.1, where the old code degraded
  without limit, since an unremoved background contributes B*q^3/3 and grows
  with the integration range;
- stable across truncation, within 2% for qMax from 0.3 to 0.5.

On the real BSA run the **q^-4 tail is 12.15% of Q** - far more than the 3.8% on
the synthetic fixture, because the measured range stops at q = 0.34. That whole
12% was missing before. The fitted background came out at 5.2e-5, about 0.2% of
I(0).

`PorodResult` now carries the three contributions to Q, the fitted background,
the Porod constant K and the fit window, all exported (format version 3) so a
reader can see how much was measured and how much was extrapolated. The Vp stat
card shows the extrapolated percentage, with the background in its tooltip.

r^2 is deliberately not used to gate the background fit: form-factor
oscillations dominate it even where B is recovered to four significant figures.
The gate is the point count.

#### Molecular weight - three routes, not two - ONE OF THREE DONE

The roadmap previously said MW "falls out nearly free". That was wrong. Asked
which method she uses, the primary user's answer was that she uses **all** of
them, because disagreement between them is itself informative about the
protein - and that she mainly relies on **forward scattering intensity for
absolute MW**. So:

- **From I(0)** - her main method, and the one the app currently cannot do at
  all. It needs the sample concentration in mg/mL and absolutely-scaled
  intensity.

  She takes the .dat files as they come from B21 and does no scaling herself
  (confirmed 2026-08-30), so the calibration is Diamond's. B21's standard
  reduction scales to absolute units against water, which means I(0) is very
  likely already in cm^-1 - but that is an inference about a beamline pipeline
  sitting under her primary MW method, so verify it against a real file before
  relying on it. No standard-scaling workflow is needed either way, which
  removes a chunk of the original scope.

  **Check the file headers first.** `parseDat` currently discards every line
  starting with `#` or `//`, and B21's reduction writes metadata there. Units,
  scaling and possibly concentration may already be in the file, which would
  turn a manual input surface into a parsing job. Header capture also feeds the
  report in item 6, which needs provenance - beamline, date, exposure.

  Do not hardcode an assumption of absolute scale. Whatever the source, carry an
  explicit flag and warn when I(0)/c implies an implausible mass - a silent
  assumption about units is exactly what produced item 2.
- **From the Porod volume** - inherits everything above.
- **From the volume of correlation** (Rambo-Tainer) - **DONE 2026-09-02**, in
  `src/lib/molecularWeight.ts`.

  Source fixed by the primary user: Rambo, R. P. & Tainer, J. A., *Nature* 496,
  477-481 (2013). Proteins only - she does not work on RNA, so the RNA
  parameterisation is deliberately absent and the code says so.

      Vc = I(0) / integral of q*I(q) dq     [A^2]
      QR = Vc^2 / Rg                        [A^3]
      MW = (QR / c)^k,  c = 0.1231, k = 1   [Da]

  The paper leaves c and k to its supplementary material, noting they are
  "empirically determined and specific to the class of macromolecular particle".
  BioXTAS RAW documents the protein values and flags that the paper writes the
  law as mass = (QR/c)^(1/k), so its k is the reciprocal of the one used here -
  identical at k = 1.

  The integral runs over the measured range with no background removal and no
  extrapolation, which is what the published method and the common
  implementations do. That keeps the number comparable with ATSAS and RAW rather
  than marginally more self-consistent and quietly different.

  **Validated on the real BSA run: 69.5 kDa against a 66.4 kDa monomer, 4.7%
  out**, in line with the ~4% average error the paper reports. Tail fraction
  1.6%, so the integral had converged.

  Tests pin the published definitions, concentration independence (the central
  claim of the method - a scale factor on I cancels exactly), the scaling with
  Rg, and that it survives truncation better than the Porod volume does.

  A uniform sphere is deliberately *not* used as a mass reference: the constants
  are fitted to real protein shapes and hydration, and the sphere fixture comes
  out at 264 kDa against 426 kDa from density. The sphere tests cover arithmetic
  only.

Display: one figure per method, side by side, so they can be compared - not a
single blended number and not a range (decision, 2026-08-30). The Vc card is in
the results rail, labelled by method, with Vc and QR in its tooltip and a
warning in place of the Vc value when the integral has not converged.

**Still outstanding:**

- The **I(0) route**, her main method. Needs a sample concentration in mg/mL,
  which the B21 headers do not carry, so it is an input surface that has to flow
  through snapshots, cloud saves and export - the larger piece of work.
- The **Porod volume route**. Vp is now correct, but the Vp-to-MW factor is a
  separate empirical constant that is not in Rambo & Tainer and still needs its
  own source.
- Insight checks for Porod and MW quality: a large extrapolated fraction, an
  unconverged Vc integral, and disagreement between routes once there is more
  than one to disagree.

**Convention:** match ATSAS. She works in ATSAS/PRIMUS and ScAtter and writes up
ATSAS-4 CHROMIXS and PRIMUS numbers, so results need to be directly comparable
with those. Every empirical constant - the Vp-to-MW factor, the Rambo-Tainer
power-law constants, whether a corrected Porod volume is used - must be verified
against the primary literature and ATSAS's own documented behaviour before
implementation, and encoded as named constants carrying their citation. This is
the highest-risk hour of the item.

### 4. P(r) distribution and Dmax via indirect Fourier transform

Already on the README roadmap, and it is the other half of a real SAXS session.
Guinier gives Rg from the low-q sliver; P(r) uses the whole curve and describes
the shape. Without it QTrace answers half the question.

The largest single piece of work here - regularised IFT with alpha selection -
but it is what makes the app complete rather than a Guinier tool.

### 5. Per-frame Rg trace on the SEC chromatogram

`autoDetectRegions` in `src/lib/secSaxs.ts` thresholds on mean intensity at 50%.
That finds *a* peak but says nothing about whether it is one species. The
standard move is an Rg-vs-frame overlay: flat across the peak means
monodisperse, sloping means heterogeneity or aggregation.

`computeGuinier` and the frames are already in hand, so this is mostly plumbing,
and it directly improves the frame selection users are making by hand today.

The tool to match here is ATSAS-4 CHROMIXS, which is what the primary user
currently uses for SEC-SAXS frame selection and writes up in her methods.

A second defect showing up on the same real run, which is 335 frames:
`frameIntensity` averages I over the *whole* q range, so the flat high-q
background dominates and the elution peak reads as a 15% bump over baseline.
Averaging over a low-q band instead roughly doubles that contrast. Integrating a
selectable low-q region is what CHROMIXS does, and it is a small change to
`secSaxs.ts`.

### 6. Report export, not just CSV

`src/lib/csvExport.ts` is thorough, but nobody puts a CSV in a paper. A one-page
PDF/PNG - Guinier plot, residuals, stats with uncertainties, the insights list,
provenance - is what gets QTrace used in a lab and shared with a supervisor.

## Smaller fixes worth doing along the way

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

~~Tests~~ -> ~~auto-find fix~~ -> header capture and q units -> Porod fix -> MW
-> SEC per-frame Rg -> report export -> P(r).

Reordered twice on 2026-08-30. Units were promoted to blocking on the
understanding that B21 emits nm^-1, then demoted when a real file turned out to
declare inverse angstroms in its header. The auto-find failure took its place at
the front: it is a hard failure on real data, and it is small.

The Porod fix has a target waiting for it: `porod.test.ts` holds an `it.fails`
case asserting the true sphere volume within 1%. Vitest reports a passing
`.fails` test as a failure, so the marker turns red the moment extrapolation
lands and forces itself to be promoted.

This keeps every step verifiable and puts a user-visible win in front of us at
each stage.
