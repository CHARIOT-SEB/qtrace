/**
 * Phone artboards. Run:  node design/emit3.mjs
 *
 * 390x844 (iPhone 14/15 class). No fake status bar or keyboard - the real
 * ones render on top of the layout on a device, and a painted copy reads as
 * doubled up.
 */
import {
  T, FONT, MONO, I, logoMark, plotCss, secPlot, guinierPlot, residualsPlot,
  kratkyPlot, dc, accentScript, here, writeFileSync, join,
} from './build.mjs';

const write = (name, html) => {
  writeFileSync(join(here, name), html);
  console.log(`wrote ${name}  ${(html.length / 1024).toFixed(1)} KB`);
};

const W = 390, H = 844;

/* ── Shared phone chrome ───────────────────────────────────────────── */

const topbar = (datasetLabel, actionsLive) => `
<header style="display:flex;align-items:center;gap:9px;height:52px;padding:0 12px;background:${T.surface};border-bottom:1px solid ${T.line};flex-shrink:0">
  ${logoMark(26)}
  ${datasetLabel
    ? `<div style="display:flex;align-items:center;gap:7px;height:32px;padding:0 9px;background:${T.canvas};border:1px solid ${T.line};border-radius:6px;min-width:0">
         <span style="color:${T.accent};display:flex;transform:scale(.82)">${I.layers}</span>
         <span class="mono" style="font-size:12px;font-weight:500;color:${T.ink900};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:96px">${datasetLabel}</span>
       </div>`
    : ''}
  <span style="flex-grow:1"></span>
  ${[
      [I.layers, false],
      [I.download, false],
      [I.bookmark, true],
    ].map(([icon, primary]) => `
    <button style="display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:8px;cursor:pointer;flex-shrink:0;
      border:${primary ? 'none' : `1px solid ${T.line}`};
      background:${primary ? (actionsLive ? '{{accent}}' : '#9fc4c9') : T.surface};
      color:${primary ? '#fff' : T.ink500};
      opacity:${actionsLive ? 1 : 0.55}">${icon}</button>`).join('')}
</header>`;

/* The verdict, in 52px instead of a screenful. */
const summaryBar = (expanded) => `
<button style="display:flex;align-items:center;gap:10px;width:100%;min-height:52px;padding:0 12px;border:none;border-bottom:1px solid ${T.line};background:${T.surface};font:inherit;text-align:left;cursor:pointer;flex-shrink:0">
  <span class="lbl" style="font-size:10px">Rg</span>
  <span class="mono" style="font-size:17px;font-weight:500;letter-spacing:-0.01em;color:{{accent}}">24.82</span>
  <span class="mono" style="font-size:11px;color:${T.ink450}">Å</span>
  <span style="display:inline-flex;align-items:center;padding:2px 7px;border-radius:4px;background:${T.goodBg};border:1px solid #bfe3d0;color:${T.goodInk};font-size:9.5px;font-weight:600;letter-spacing:0.06em">OK</span>
  <span style="flex-grow:1"></span>
  <span style="display:inline-flex;align-items:center;padding:2px 7px;border-radius:4px;background:${T.warnBg};border:1px solid #eddcb4;color:${T.warnInk};font-size:9.5px;font-weight:600">1 to check</span>
  <span style="display:flex;color:${T.ink450};transform:rotate(${expanded ? 180 : 0}deg)">${I.chev}</span>
</button>`;

const tabs = (active) => `
<div style="display:flex;gap:6px;overflow:hidden;flex-shrink:0">
  ${['Chromatogram', 'Guinier fit', 'Curve', 'Kratky'].map((label) => {
    const on = label === active;
    return `<button style="flex:1 0 auto;min-height:44px;padding:0 13px;border-radius:7px;cursor:pointer;font:inherit;font-size:12.5px;white-space:nowrap;
      font-weight:${on ? 600 : 500};
      border:1px solid ${on ? '#c4dee2' : T.line};
      background:${on ? T.accentSoft : T.surface};
      color:${on ? T.accent : T.ink500}">${label}</button>`;
  }).join('')}
</div>`;

const card = (title, right, body) => `
<section style="background:${T.surface};border:1px solid ${T.line};border-radius:8px;padding:12px;min-width:0">
  <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;flex-wrap:wrap">
    <span style="font-size:12.5px;font-weight:600;color:${T.ink900}">${title}</span>
    ${right ?? ''}
  </div>
  ${body}
</section>`;

const phone = (name, inner, note) => {
  write(name, dc({
    css: plotCss + `
      body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${T.canvas}; }
    `,
    body: `
<div style="display:flex;flex-direction:column;width:${W}px;height:${H}px;background:${T.canvas}">
  ${inner}
</div>`,
    script: accentScript(W, H),
  }));
  return note;
};

/* ── MobileFit: the default landing, fit tab ───────────────────────── */
phone('MobileFit.dc.html', `
  ${topbar('lysozyme_sec_01', true)}
  ${summaryBar(false)}
  <main style="flex-grow:1;min-height:0;padding:12px;display:flex;flex-direction:column;gap:12px;overflow:hidden">
    ${tabs('Guinier fit')}
    ${card('Guinier fit',
      `<button style="display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:0 11px;border:1px solid #c4dee2;background:${T.accentSoft};border-radius:6px;font:inherit;font-size:11.5px;font-weight:500;color:${T.accent}">${I.wand}Auto-find</button>`,
      `<div style="margin:0 -4px">${guinierPlot()}</div>
       <div style="display:flex;align-items:center;gap:8px;margin:10px 0 2px">
         <span class="lbl" style="font-size:9.5px">Residuals</span>
         <span style="flex-grow:1;height:1px;background:${T.line}"></span>
       </div>
       <div style="margin:0 -4px">${residualsPlot()}</div>
       <div style="display:flex;flex-direction:column;gap:9px;margin-top:12px;padding:11px;background:${T.canvas};border:1px solid ${T.line};border-radius:7px">
         <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
           <span class="lbl" style="font-size:9.5px">Fit range</span>
           <span class="mono" style="font-size:12.5px;font-weight:500;color:${T.ink900}">0.0170 → 0.0525 <span style="font-size:10px;color:${T.ink450}">Å⁻¹</span></span>
         </div>
         <div style="position:relative;height:4px;background:${T.line};border-radius:2px;margin:8px 8px 6px">
           <div style="position:absolute;left:14%;right:31%;top:0;bottom:0;background:{{accent}};border-radius:2px"></div>
           <div style="position:absolute;left:14%;top:-9px;width:22px;height:22px;margin-left:-11px;border-radius:6px;background:${T.surface};border:2px solid {{accent}};box-shadow:0 1px 3px rgba(22,38,46,.2)"></div>
           <div style="position:absolute;left:69%;top:-9px;width:22px;height:22px;margin-left:-11px;border-radius:6px;background:${T.surface};border:2px solid {{accent}};box-shadow:0 1px 3px rgba(22,38,46,.2)"></div>
         </div>
       </div>`)}
  </main>
`);

/* ── MobileResults: summary bar expanded ───────────────────────────── */
const statTile = (label, value, unit, sub, tag) => `
<div style="background:${T.surface};border:1px solid ${T.line};border-radius:8px;padding:10px 11px;display:flex;flex-direction:column;gap:2px;min-width:0">
  <span class="lbl" style="font-size:9.5px">${label}</span>
  <div style="display:flex;align-items:baseline;gap:6px">
    <span class="mono" style="font-size:19px;font-weight:500;line-height:1.05;color:${T.ink900}">${value}</span>
    ${unit ? `<span class="mono" style="font-size:10.5px;color:${T.ink450}">${unit}</span>` : ''}
    ${tag ?? ''}
  </div>
  ${sub ? `<span class="mono" style="font-size:10px;color:${T.ink500}">${sub}</span>` : ''}
</div>`;

phone('MobileResults.dc.html', `
  ${topbar('lysozyme_sec_01', true)}
  ${summaryBar(true)}
  <div style="background:${T.surface};border-bottom:1px solid ${T.line};padding:12px;display:flex;flex-direction:column;gap:12px;overflow:hidden">
    <div style="background:${T.surface};border:1px solid ${T.line};border-radius:8px;padding:13px 14px">
      <span class="lbl" style="font-size:10px">Radius of gyration</span>
      <div style="display:flex;align-items:baseline;gap:5px;margin-top:3px">
        <span class="mono" style="font-size:34px;font-weight:500;line-height:1.05;letter-spacing:-0.02em;color:{{accent}}">24.82</span>
        <span class="mono" style="font-size:13px;color:${T.ink450}">Å</span>
      </div>
      <span class="mono" style="font-size:11.5px;color:${T.ink500}">± 0.31 Å  (95% CI)</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:8px">
      ${statTile('I(0)', '101.4', '', '± 1.2')}
      ${statTile('q · Rg max', '1.27', '', 'limit 1.30',
        `<span style="display:inline-flex;padding:2px 6px;border-radius:4px;background:${T.goodBg};border:1px solid #bfe3d0;color:${T.goodInk};font-size:9px;font-weight:600">OK</span>`)}
      ${statTile('R²', '0.9981', '', '')}
      ${statTile('Points used', '36', '', 'of 62')}
    </div>
    <div style="border:1px solid #eddcb4;background:${T.warnBg};border-radius:7px;padding:10px 11px;display:flex;gap:8px;align-items:flex-start">
      <span style="color:${T.warnInk};display:flex;margin-top:1px;transform:scale(.85);transform-origin:top left">${I.alert}</span>
      <div style="flex-grow:1;min-width:0">
        <span style="font-size:12.5px;line-height:1.45;color:${T.ink900}">The lowest four points sit below the fitted line.</span>
        <button style="display:block;margin-top:6px;padding:0;border:none;background:none;font:inherit;font-size:11.5px;font-weight:500;color:${T.warnInk};text-decoration:underline;min-height:32px">Why?</button>
      </div>
    </div>
  </div>
  <main style="flex-grow:1;min-height:0;padding:12px;overflow:hidden">
    ${tabs('Guinier fit')}
  </main>
`);

/* ── MobileChromatogram: the SEC tab ───────────────────────────────── */
phone('MobileChromatogram.dc.html', `
  ${topbar('lysozyme_sec_01', true)}
  ${summaryBar(false)}
  <main style="flex-grow:1;min-height:0;padding:12px;display:flex;flex-direction:column;gap:12px;overflow:hidden">
    ${tabs('Chromatogram')}
    ${card('SEC chromatogram',
      `<span class="mono" style="font-size:10.5px;color:${T.ink450}">240 frames</span>`,
      `<div style="margin:0 -4px">${secPlot()}</div>
       ${[['Buffer', T.secBuf, '4 – 9', '6 frames averaged', 14, 32],
          ['Signal', T.secSig, '10 – 20', '11 frames averaged', 38, 62]].map(([n, c, r, sub, a, b]) => `
       <div style="margin-top:14px">
         <div style="display:flex;align-items:center;gap:7px;margin-bottom:9px">
           <span style="width:10px;height:10px;border-radius:2px;background:${c}"></span>
           <span class="lbl" style="font-size:9.5px">${n} region</span>
           <span style="flex-grow:1"></span>
           <span class="mono" style="font-size:11px;color:${T.ink900};font-weight:500">${r}</span>
         </div>
         <div style="position:relative;height:4px;background:${T.line};border-radius:2px;margin:0 11px">
           <div style="position:absolute;left:${a}%;right:${100 - b}%;top:0;bottom:0;background:${c};border-radius:2px"></div>
           <div style="position:absolute;left:${a}%;top:-9px;width:22px;height:22px;margin-left:-11px;border-radius:6px;background:${T.surface};border:2px solid ${c};box-shadow:0 1px 3px rgba(22,38,46,.2)"></div>
           <div style="position:absolute;left:${b}%;top:-9px;width:22px;height:22px;margin-left:-11px;border-radius:6px;background:${T.surface};border:2px solid ${c};box-shadow:0 1px 3px rgba(22,38,46,.2)"></div>
         </div>
         <div style="margin-top:12px;font-size:11.5px;color:${T.ink500}">${sub}</div>
       </div>`).join('')}`)}
  </main>
`);

/* ── MobileEmpty: first run ────────────────────────────────────────── */
phone('MobileEmpty.dc.html', `
  ${topbar(null, false)}
  <main style="flex-grow:1;min-height:0;padding:20px 14px;display:flex;flex-direction:column;gap:20px;overflow:hidden">
    <div style="text-align:center">
      <h1 style="margin:0 0 7px;font-size:21px;font-weight:600;letter-spacing:-0.02em;color:${T.ink900};text-wrap:pretty">Load a scattering dataset</h1>
      <p style="margin:0;font-size:13px;line-height:1.55;color:${T.ink500};text-wrap:pretty">Reads <span class="mono" style="font-size:12px">.dat</span> frames from the beamline, ATSAS or RAW — all computed on your device.</p>
    </div>
    <div style="border:2px dashed ${T.lineStrong};background:${T.surface};border-radius:12px;padding:26px 16px;display:flex;flex-direction:column;align-items:center;gap:11px">
      <span style="display:flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:13px;background:${T.accentSoft};color:${T.accent}">${I.upload}</span>
      <div style="text-align:center">
        <div style="font-size:14.5px;font-weight:600;color:${T.ink900}">Drop frame files here</div>
        <div style="font-size:12px;color:${T.ink450};margin-top:3px">A single curve, or a whole SEC run</div>
      </div>
      <span style="display:inline-flex;align-items:center;min-height:44px;padding:0 18px;border:1px solid ${T.line};background:${T.surface};border-radius:8px;font-size:13px;font-weight:500;color:${T.ink700}">Browse files</span>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <span style="flex-grow:1;height:1px;background:${T.line}"></span>
      <span class="lbl">or start from</span>
      <span style="flex-grow:1;height:1px;background:${T.line}"></span>
    </div>
    <button style="display:flex;align-items:center;gap:12px;text-align:left;padding:14px;min-height:64px;border:1px solid #c4dee2;background:${T.accentSoft};border-radius:8px;font:inherit;cursor:pointer">
      <span style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;flex-shrink:0;background:{{accent}};color:#fff">${I.flask}</span>
      <span style="flex-grow:1;min-width:0">
        <span style="display:block;font-size:13.5px;font-weight:600;color:${T.ink900}">Load the sample SEC run</span>
        <span style="display:block;font-size:11.5px;color:${T.ink500};margin-top:2px">See the whole workflow in one tap</span>
      </span>
      <span style="color:${T.ink450};display:flex">${I.chevR}</span>
    </button>
  </main>
`);

/* ── MobileSession: the drawer ─────────────────────────────────────── */
phone('MobileSession.dc.html', `
  <div style="position:relative;flex-grow:1;display:flex;min-height:0">
    <div style="position:absolute;inset:0;background:${T.canvas};opacity:.55"></div>
    <aside style="position:relative;width:296px;background:${T.surface};border-right:1px solid ${T.line};display:flex;flex-direction:column;gap:16px;padding:16px 14px;box-shadow:0 0 40px rgba(22,38,46,.24)">
      <section>
        <div style="padding-bottom:9px"><span class="lbl">Dataset</span></div>
        <div style="border:1px solid ${T.line};border-radius:7px;padding:11px;display:flex;flex-direction:column;gap:7px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="color:${T.accent};display:flex">${I.layers}</span>
            <span class="mono" style="font-size:12.5px;font-weight:500;color:${T.ink900}">lysozyme_sec_01</span>
          </div>
          <div style="font-size:11px;color:${T.ink500}">240 frames · SEC-SAXS</div>
          <button style="align-self:flex-start;min-height:44px;padding:0;border:none;background:none;font:inherit;font-size:12px;font-weight:500;color:${T.accent};text-decoration:underline">Replace files</button>
        </div>
      </section>
      <section>
        <div style="padding-bottom:9px"><span class="lbl">Frame selection</span></div>
        ${[['Buffer', T.secBuf, '12 – 38', '27'], ['Signal', T.secSig, '116 – 142', '27']].map(([n, c, r, k]) => `
        <div style="display:flex;align-items:center;gap:9px;padding:9px 10px;border:1px solid ${T.line};border-radius:6px;margin-bottom:6px">
          <span style="width:3px;height:26px;border-radius:2px;background:${c}"></span>
          <div style="flex-grow:1">
            <div style="font-size:11px;font-weight:600;color:${T.ink500}">${n}</div>
            <div class="mono" style="font-size:13px;font-weight:500;color:${T.ink900};margin-top:1px">${r}</div>
          </div>
          <span class="mono" style="font-size:10.5px;color:${T.ink450}">${k} frames</span>
        </div>`).join('')}
      </section>
      <div style="height:1px;background:${T.line}"></div>
      <section style="flex-grow:1;min-height:0">
        <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:9px">
          <span class="lbl">Snapshots</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;padding:0 0 6px 2px">
          <span style="color:${T.accent};display:flex;transform:scale(.8);transform-origin:left">${I.cloud}</span>
          <span style="font-size:10.5px;font-weight:500;color:${T.ink500}">Saved to account</span>
        </div>
        ${[['Monomer peak, tight fit', '2 Sep · Rg 24.8 Å', true], ['Wider q range test', '2 Sep · Rg 25.6 Å', false]].map(([n, m, active]) => `
        <div style="display:flex;align-items:center;gap:9px;min-height:44px;padding:8px 9px;border-radius:6px;background:${active ? T.accentSoft : 'transparent'};border:1px solid ${active ? '#c4dee2' : 'transparent'}">
          <span style="color:${T.accent};display:flex">${I.cloud}</span>
          <div style="flex-grow:1;min-width:0">
            <div style="font-size:12.5px;font-weight:${active ? 600 : 500};color:${T.ink900};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n}</div>
            <div class="mono" style="font-size:10.5px;color:${T.ink450}">${m}</div>
          </div>
        </div>`).join('')}
      </section>
      <div style="border-top:1px solid ${T.line};padding-top:11px;display:flex;align-items:center;gap:8px;min-height:44px">
        <span style="color:${T.ink450};display:flex">${I.trash}</span>
        <span style="font-size:12.5px;color:${T.ink450}">Clear session</span>
      </div>
    </aside>
  </div>
`);
