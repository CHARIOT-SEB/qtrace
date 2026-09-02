/**
 * Writes the QTrace redesign artboards. Run:  node design/emit.mjs
 * Shared tokens, icons and plot builders live in build.mjs.
 */
import {
  T, FONT, MONO, I, logoMark, plotCss, secPlot, guinierPlot, residualsPlot,
  curvePlot, kratkyPlot, topbar, datasetChip, railHead, snapshotRow, statTile,
  tag, insight, dc, accentScript, here, writeFileSync, join,
} from './build.mjs';

const write = (name, html) => {
  writeFileSync(join(here, name), html);
  console.log(`wrote ${name}  ${(html.length / 1024).toFixed(1)} KB`);
};

const W = 1440, H = 1040;
const LEFT = 264, RIGHT = 316;

const legendChip = (color, label, dim) =>
  `<span style="display:inline-flex;align-items:center;gap:5px;font-size:10.5px;color:${T.ink500}"><span style="width:9px;height:9px;border-radius:2px;background:${color};opacity:${dim || 1}"></span>${label}</span>`;

const cardHead = (title, right = '') => `
<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px">
  <span style="font-size:12.5px;font-weight:600;color:${T.ink900};letter-spacing:-0.005em">${title}</span>
  <div style="display:flex;align-items:center;gap:12px">${right}</div>
</div>`;

const ghostBtn = (icon, label, accent) => `
<button style="display:inline-flex;align-items:center;gap:6px;height:27px;padding:0 10px;border:1px solid ${accent ? '#c4dee2' : T.line};background:${accent ? T.accentSoft : T.surface};border-radius:5px;font:inherit;font-size:11.5px;font-weight:500;color:${accent ? T.accent : T.ink500};cursor:pointer">${icon}${label}</button>`;

/* ══ Main.dc.html - the loaded-analysis workspace ══════════════════════ */
{
  const leftRail = `
<aside style="width:${LEFT}px;flex-shrink:0;background:${T.surface};border-right:1px solid ${T.line};display:flex;flex-direction:column;padding:16px 14px;gap:16px;overflow:hidden">

  <section>
    ${railHead('Dataset')}
    <div style="border:1px solid ${T.line};border-radius:7px;padding:10px 11px;display:flex;flex-direction:column;gap:7px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="color:${T.accent};display:flex">${I.layers}</span>
        <span class="mono" style="font-size:12.5px;font-weight:500;color:${T.ink900}">lysozyme_sec_01</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px 10px;font-size:11px;color:${T.ink500}">
        <span>240 frames</span><span style="color:${T.line}">·</span>
        <span>SEC-SAXS</span><span style="color:${T.line}">·</span>
        <span class="mono">q 0.008–0.42 Å⁻¹</span>
      </div>
      <button style="align-self:flex-start;padding:0;border:none;background:none;font:inherit;font-size:11.5px;font-weight:500;color:${T.accent};cursor:pointer;text-decoration:underline;text-underline-offset:2px">Replace files</button>
    </div>
  </section>

  <section>
    ${railHead('Frame selection')}
    <div style="display:flex;flex-direction:column;gap:6px">
      ${[['Buffer', T.secBuf, '12 – 38', '27 frames'], ['Signal', T.secSig, '116 – 142', '27 frames']].map(([n, c, r, k]) => `
      <div style="display:flex;align-items:center;gap:9px;padding:8px 10px;border:1px solid ${T.line};border-radius:6px">
        <span style="width:3px;height:26px;border-radius:2px;background:${c};flex-shrink:0"></span>
        <div style="flex-grow:1;min-width:0">
          <div style="font-size:11px;font-weight:600;color:${T.ink500}">${n}</div>
          <div class="mono" style="font-size:13px;font-weight:500;color:${T.ink900};margin-top:1px">${r}</div>
        </div>
        <span class="mono" style="font-size:10.5px;color:${T.ink400}">${k}</span>
      </div>`).join('')}
    </div>
  </section>

  <div style="height:1px;background:${T.line}"></div>

  <section style="flex-grow:1;min-height:0;display:flex;flex-direction:column">
    ${railHead('Snapshots', ghostBtn(I.plus, 'New'))}
    <div style="display:flex;flex-direction:column;gap:10px;overflow:hidden">
      <div>
        <div style="display:flex;align-items:center;gap:6px;padding:0 0 5px 2px">
          <span style="color:${T.accent};display:flex;transform:scale(.8);transform-origin:left">${I.cloud}</span>
          <span style="font-size:10.5px;font-weight:500;color:${T.ink400}">Saved to account</span>
        </div>
        ${snapshotRow({ name: 'Monomer peak, tight fit', meta: '2 Sep · Rg 24.8 Å', cloud: true, active: true })}
        ${snapshotRow({ name: 'Wider q range test', meta: '2 Sep · Rg 25.6 Å', cloud: true })}
        ${snapshotRow({ name: 'Aggregate shoulder', meta: '29 Aug · Rg 41.2 Å', cloud: true })}
      </div>
      <div>
        <div style="display:flex;align-items:center;gap:6px;padding:0 0 5px 2px">
          <span style="font-size:10.5px;font-weight:500;color:${T.ink400}">This session only</span>
        </div>
        ${snapshotRow({ name: 'Before auto-find', meta: '14:22 · Rg 23.1 Å', cloud: false })}
      </div>
    </div>
  </section>

  <div style="border-top:1px solid ${T.line};padding-top:11px;display:flex;align-items:center;gap:7px">
    <span style="color:${T.ink400};display:flex;transform:scale(.85);transform-origin:left">${I.trash}</span>
    <span style="font-size:11.5px;color:${T.ink400}">Clear session</span>
  </div>
</aside>`;

  const centre = `
<main style="flex-grow:1;min-width:0;padding:18px 20px;display:flex;flex-direction:column;gap:14px;overflow:hidden">

  <!-- SEC chromatogram: pinned, because it governs everything below it -->
  <section class="card" style="padding:14px">
    ${cardHead('SEC chromatogram', `
      <div style="display:flex;align-items:center;gap:11px">
        ${legendChip(T.secOut, 'Excluded', .5)}
        ${legendChip(T.secBuf, 'Buffer')}
        ${legendChip(T.secSig, 'Signal')}
      </div>
      <span style="width:1px;height:14px;background:${T.line}"></span>
      <span style="font-size:11px;color:${T.ink400}">Drag the handles to re-select</span>`)}
    ${secPlot()}
    <div style="display:flex;justify-content:space-between;margin-top:6px">
      <span class="mono" style="font-size:10px;color:${T.ink400}">frame 1</span>
      <span class="mono" style="font-size:10px;color:${T.ink400}">240</span>
    </div>
  </section>

  <!-- Fit + residuals share an x-axis, so they share a card -->
  <section class="card" style="padding:14px">
    ${cardHead('Guinier fit', `
      <span class="mono" style="font-size:11px;color:${T.ink500}">36 of 62 points</span>
      ${ghostBtn(I.wand, 'Auto-find range', true)}`)}
    ${guinierPlot()}
    <div style="display:flex;align-items:center;gap:8px;margin:8px 0 2px">
      <span class="lbl" style="font-size:9.5px">Residuals</span>
      <span style="flex-grow:1;height:1px;background:${T.line}"></span>
      <span class="mono" style="font-size:10px;color:${T.ink400}">no trend · 34 of 36 within ±2σ</span>
    </div>
    ${residualsPlot()}

    <!-- Fit range control, inline under the plot it controls -->
    <div style="display:flex;align-items:center;gap:14px;margin-top:12px;padding:10px 13px;background:${T.canvas};border:1px solid ${T.line};border-radius:7px">
      <span class="lbl" style="font-size:9.5px">Fit range</span>
      <div style="flex-grow:1;position:relative;height:4px;background:${T.line};border-radius:2px">
        <div style="position:absolute;left:14%;right:31%;top:0;bottom:0;background:{{accent}};border-radius:2px"></div>
        <div style="position:absolute;left:14%;top:-6px;width:14px;height:16px;margin-left:-7px;border-radius:4px;background:${T.surface};border:2px solid {{accent}};box-shadow:0 1px 2px rgba(22,38,46,.18)"></div>
        <div style="position:absolute;left:69%;top:-6px;width:14px;height:16px;margin-left:-7px;border-radius:4px;background:${T.surface};border:2px solid {{accent}};box-shadow:0 1px 2px rgba(22,38,46,.18)"></div>
      </div>
      <div style="display:flex;align-items:baseline;gap:6px">
        <span class="mono" style="font-size:13px;font-weight:500;color:${T.ink900}">0.0170</span>
        <span style="color:${T.ink400};font-size:11px">→</span>
        <span class="mono" style="font-size:13px;font-weight:500;color:${T.ink900}">0.0525</span>
        <span class="mono" style="font-size:10.5px;color:${T.ink400}">Å⁻¹</span>
      </div>
    </div>
  </section>

  <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:14px">
    <section class="card" style="padding:14px">
      ${cardHead('Scattering curve', `<span class="mono" style="font-size:10.5px;color:${T.ink400}">buffer-subtracted</span>`)}
      ${curvePlot()}
    </section>
    <section class="card" style="padding:14px">
      ${cardHead('Kratky', `<span style="font-size:10.5px;color:${T.goodInk};font-weight:500">folded, globular</span>`)}
      ${kratkyPlot()}
    </section>
  </div>
</main>`;

  const rightRail = `
<aside style="width:${RIGHT}px;flex-shrink:0;background:${T.surface};border-left:1px solid ${T.line};display:flex;flex-direction:column;padding:16px;gap:14px;overflow:hidden">

  <section>
    ${railHead('Result', tag('OK'))}
    ${statTile('Radius of gyration', '24.82', 'Å', '± 0.31 Å  (95% CI)', true)}
  </section>

  <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:8px">
    ${statTile('I(0)', '101.4', '', '± 1.2')}
    <div class="card" style="padding:10px 11px;display:flex;flex-direction:column;gap:2px">
      <span class="lbl" style="font-size:9.5px">q · Rg max</span>
      <div style="display:flex;align-items:baseline;gap:7px">
        <span class="mono" style="font-size:19px;font-weight:500;line-height:1.05;color:${T.ink900}">1.27</span>
        ${tag('OK')}
      </div>
      <span class="mono" style="font-size:10px;color:${T.ink500}">limit 1.30</span>
    </div>
    ${statTile('R²', '0.9981', '', '')}
    ${statTile('Points used', '36', '', 'of 62')}
  </div>
  <div style="margin-top:-6px">
    ${statTile('Porod volume', '46 300', 'Å³', '18% extrapolated beyond measured q')}
  </div>

  <div style="height:1px;background:${T.line}"></div>

  <section style="flex-grow:1;min-height:0;display:flex;flex-direction:column">
    ${railHead('Analysis insights', `
      <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:10px;background:${T.warnBg};border:1px solid #eddcb4;color:${T.warnInk};font-size:9.5px;font-weight:600;letter-spacing:0.05em">1 WARNING</span>`)}
    <div style="display:flex;flex-direction:column;gap:8px">
      ${insight({ kind: 'warn', msg: 'The lowest four points sit below the fitted line.', why: 'A downturn at very low q usually means interparticle repulsion at high concentration, which biases Rg low. Try a more dilute frame range, or start the fit above q = 0.019 Å⁻¹.' })}
      ${insight({ kind: 'info', msg: 'Frames 96–115 show a leading shoulder that was excluded from the signal region.' })}
      ${insight({ kind: 'info', msg: 'Porod volume implies ≈ 28 kDa, close to the 24 kDa expected for a monomer.' })}
    </div>
  </section>

  <div style="border-top:1px solid ${T.line};padding-top:10px">
    <p class="mono" style="margin:0;font-size:10px;line-height:1.6;color:${T.ink400}">Weighted least squares · uncertainties propagated from the fit covariance</p>
  </div>
</aside>`;

  write('Main.dc.html', dc({
    css: plotCss + `
      body { width: ${W}px; height: ${H}px; overflow: hidden; }
      button:hover { filter: brightness(.97); }
    `,
    body: `
<div style="display:flex;flex-direction:column;width:${W}px;height:${H}px;background:${T.canvas}">
  ${topbar({ dataset: datasetChip, actionsEnabled: true })}
  <div style="flex-grow:1;display:flex;min-height:0">
    ${leftRail}
    ${centre}
    ${rightRail}
  </div>
</div>`,
    script: accentScript(W, H),
  }));
}

/* ══ Empty.dc.html - first run ════════════════════════════════════════ */
{
  const quietRail = (side, head, body) => `
<aside style="width:${side}px;flex-shrink:0;background:${T.surface};border-${head === 'left' ? 'right' : 'left'}:1px solid ${T.line};display:flex;flex-direction:column;padding:16px 14px;gap:14px">${body}</aside>`;

  const emptyNote = (text) => `
<div style="border:1px dashed ${T.lineStrong};border-radius:7px;padding:14px 12px;text-align:center">
  <p style="margin:0;font-size:11.5px;line-height:1.55;color:${T.ink400}">${text}</p>
</div>`;

  const startCard = (icon, title, sub, primary) => `
<button style="display:flex;align-items:center;gap:12px;text-align:left;padding:14px 15px;border:1px solid ${primary ? '#c4dee2' : T.line};background:${primary ? T.accentSoft : T.surface};border-radius:8px;font:inherit;cursor:pointer;min-height:64px">
  <span style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:8px;flex-shrink:0;background:${primary ? T.accent : T.canvas};color:${primary ? '#fff' : T.ink500}">${icon}</span>
  <span style="flex-grow:1;min-width:0">
    <span style="display:block;font-size:13px;font-weight:600;color:${T.ink900}">${title}</span>
    <span style="display:block;font-size:11.5px;color:${T.ink500};margin-top:2px">${sub}</span>
  </span>
  <span style="color:${T.ink400};display:flex">${I.chevR}</span>
</button>`;

  write('Empty.dc.html', dc({
    css: plotCss + `
      body { width: ${W}px; height: ${H}px; overflow: hidden; }
    `,
    body: `
<div style="display:flex;flex-direction:column;width:${W}px;height:${H}px;background:${T.canvas}">
  ${topbar({
    dataset: `<span style="font-size:12.5px;color:${T.ink400}">No dataset loaded</span>`,
    actionsEnabled: false,
  })}
  <div style="flex-grow:1;display:flex;min-height:0">

    ${quietRail(LEFT, 'left', `
      <section>${railHead('Dataset')}${emptyNote('Nothing loaded yet.')}</section>
      <section style="flex-grow:1;display:flex;flex-direction:column">
        ${railHead('Snapshots')}
        <div style="display:flex;flex-direction:column;gap:10px">
          <div>
            <div style="display:flex;align-items:center;gap:6px;padding:0 0 5px 2px">
              <span style="color:${T.accent};display:flex;transform:scale(.8);transform-origin:left">${I.cloud}</span>
              <span style="font-size:10.5px;font-weight:500;color:${T.ink400}">Saved to account</span>
            </div>
            ${snapshotRow({ name: 'Monomer peak, tight fit', meta: '2 Sep · Rg 24.8 Å', cloud: true })}
            ${snapshotRow({ name: 'Aggregate shoulder', meta: '29 Aug · Rg 41.2 Å', cloud: true })}
          </div>
        </div>
      </section>
    `)}

    <main style="flex-grow:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 56px;gap:26px">
      <div style="width:100%;max-width:520px;display:flex;flex-direction:column;gap:22px">

        <div style="text-align:center">
          <h1 style="margin:0 0 8px;font-size:25px;font-weight:600;letter-spacing:-0.02em;color:${T.ink900};text-wrap:pretty">Load a scattering dataset</h1>
          <p style="margin:0;font-size:13.5px;line-height:1.6;color:${T.ink500};text-wrap:pretty">QTrace reads <span class="mono" style="font-size:12.5px">.dat</span> frame files from the beamline, ATSAS or RAW. Everything is computed in your browser — nothing is uploaded unless you save a snapshot to your account.</p>
        </div>

        <div style="border:2px dashed ${T.lineStrong};background:${T.surface};border-radius:12px;padding:34px 24px;display:flex;flex-direction:column;align-items:center;gap:13px">
          <span style="display:flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:13px;background:${T.accentSoft};color:${T.accent}">${I.upload}</span>
          <div style="text-align:center">
            <div style="font-size:14.5px;font-weight:600;color:${T.ink900}">Drop frame files here</div>
            <div style="font-size:12px;color:${T.ink400};margin-top:3px">A single curve, or a whole SEC run</div>
          </div>
          <button style="height:36px;padding:0 16px;border:1px solid ${T.line};background:${T.surface};border-radius:7px;font:inherit;font-size:12.5px;font-weight:500;color:${T.ink700};cursor:pointer">Browse files</button>
        </div>

        <div style="display:flex;align-items:center;gap:12px">
          <span style="flex-grow:1;height:1px;background:${T.line}"></span>
          <span class="lbl">or start from</span>
          <span style="flex-grow:1;height:1px;background:${T.line}"></span>
        </div>

        <div style="display:flex;flex-direction:column;gap:9px">
          ${startCard(I.flask, 'Load the sample SEC run', '240 synthetic frames — see the whole workflow in one click', true)}
          ${startCard(I.cloud, 'Reopen a saved snapshot', '3 snapshots in your account', false)}
        </div>
      </div>
    </main>

    ${quietRail(RIGHT, 'right', `
      <section>${railHead('Result')}${emptyNote('Rg, I(0) and fit quality appear here once a Guinier range is set.')}</section>
      <section>${railHead('Analysis insights')}${emptyNote('QTrace flags the reasons a fit may be wrong — aggregation, repulsion, too few points — and explains each one.')}</section>
      <div style="flex-grow:1"></div>
      <div style="border-top:1px solid ${T.line};padding-top:10px;display:flex;align-items:center;gap:7px">
        <span style="color:${T.ink400};display:flex">${I.lock}</span>
        <p style="margin:0;font-size:10.5px;line-height:1.55;color:${T.ink400}">Data stays in this browser until you save it.</p>
      </div>
    `)}
  </div>
</div>`,
    script: accentScript(W, H),
  }));
}
