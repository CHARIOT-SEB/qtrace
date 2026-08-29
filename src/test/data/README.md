# Reference datasets

The synthetic fixtures in `../fixtures.ts` give exact ground truth. These give
realism: real files, with real headers, real noise and a real finite q range.

`reference.regression.test.ts` discovers cases from two places:

| Directory | Committed? | For |
| --- | --- | --- |
| `src/test/data/` | yes | redistributable published data |
| `src/test/data/local/` | **no - gitignored** | real experimental data |

Both are optional. With neither present the data tests skip and the suite still
passes, which is what CI sees.

## Private data comes first

Experimental data is usually confidential long before publication, and it must
not end up in a public repository. `src/test/data/local/` is gitignored for that
reason, and a guard test asserts the ignore rule still exists so it cannot
vanish in a refactor without something going red.

Put real data there and the full regression runs on your machine and nowhere
else. Nothing in that directory is committed, uploaded, or sent anywhere.

## Adding a case

A case is a pair of files sharing a stem, in either directory:

1. **`<name>.dat`** - anything `parseDat` accepts: whitespace or comma separated
   `q  I(q)  [err]`, with `#` or `//` comments.

   **q must be in inverse angstroms.** QTrace assumes it throughout, so an
   nm^-1 file would silently produce an Rg ten times too large. The parse test
   checks the first q is below 0.1 as a rough guard against exactly that.

2. **`<name>.json`** - what the file is, and what the analysis should produce:

   ```json
   {
     "sample": "Lysozyme",
     "source": "SASBDB SASDXX0",
     "url": "https://www.sasbdb.org/data/SASDXX0/",
     "licence": "check the entry page before committing",
     "Rg": 15.1,
     "RgTolerance": 0.6,
     "I0": null,
     "I0Tolerance": null
   }
   ```

   `Rg` is in angstroms. `RgTolerance` is the absolute window the fit must land
   within - tight enough to catch a regression, loose enough to absorb the
   difference between our auto-found range and whatever range the reference
   value came from. Set `I0` to `null` when the reference value is on a
   different intensity scale, which it usually is; that assertion then skips.

   For a private case, `source` and `licence` can just record where it came from
   and who to ask before it ever goes anywhere.

## Getting redistributable public data

SASBDB (<https://www.sasbdb.org>) publishes SAS datasets alongside their models,
downloadable per entry, each with published Rg and I(0). Check the terms on the
entry page before committing anything, and record what you find in `licence`.
