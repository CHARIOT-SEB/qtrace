/**
 * Style tile + the two low-fi alternate directions.
 * Run:  node design/emit2.mjs
 */
import {
  T, FONT, MONO, I, logoMark, plotCss, dc, accentScript, here, writeFileSync, join,
} from './build.mjs';

const write = (name, html) => {
  writeFileSync(join(here, name), html);
  console.log(`wrote ${name}  ${(html.length / 1024).toFixed(1)} KB`);
};

/* ══ Styles.dc.html ═══════════════════════════════════════════════════ */
{
  const SW = 900, SH = 1420;

  const sect = (n, title, note, body) => `
<section style="display:flex;flex-direction:column;gap:14px">
  <div style="display:flex;align-items:baseline;gap:10px;border-bottom:1px solid ${T.line};padding-bottom:9px">
    <span class="mono" style="font-size:11px;font-weight:500;color:${T.accent}">${n}</span>
    <h2 style="margin:0;font-size:15px;font-weight:600;color:${T.ink900};letter-spacing:-0.01em">${title}</h2>
    <span style="flex-grow:1"></span>
    <span style="font-size:11px;color:${T.ink400};text-align:right;max-width:400px;text-wrap:pretty">${note}</span>
  </div>
  ${body}
</section>`;

  const swatch = (hex, role, name, dark) => `
<div style="display:flex;flex-direction:column;gap:6px;min-width:0">
  <div style="height:52px;border-radius:6px;background:${hex};border:1px solid ${dark ? 'transparent' : T.line}"></div>
  <div style="min-width:0">
    <div style="font-size:11px;font-weight:600;color:${T.ink900}">${name}</div>
    <div class="mono" style="font-size:10.5px;color:${T.ink400};margin-top:1px">${hex}</div>
    <div style="font-size:10px;color:${T.ink500};margin-top:2px;line-height:1.4;text-wrap:pretty">${role}</div>
  </div>
</div>`;

  const typeRow = (label, spec, style, sample) => `
<div style="display:flex;align-items:baseline;gap:18px;padding:9px 0;border-bottom:1px solid ${T.line}">
  <div style="width:104px;flex-shrink:0">
    <div class="lbl" style="font-size:9.5px">${label}</div>
    <div class="mono" style="font-size:10px;color:${T.ink400};margin-top:2px">${spec}</div>
  </div>
  <div style="flex-grow:1;min-width:0;${style}">${sample}</div>
</div>`;

  const btn = (label, kind) => {
    const s = {
      primary: `background:{{accent}};color:#fff;border:none;box-shadow:0 1px 2px rgba(22,38,46,.16)`,
      secondary: `background:${T.surface};color:${T.ink700};border:1px solid ${T.line}`,
      quiet: `background:${T.accentSoft};color:${T.accent};border:1px solid #c4dee2`,
      danger: `background:${T.surface};color:${T.badInk};border:1px solid #eec6cb`,
    }[kind];
    return `<button style="height:32px;padding:0 14px;border-radius:6px;font:inherit;font-size:12.5px;font-weight:500;cursor:pointer;${s}">${label}</button>`;
  };

  const statusTag = (kind) => {
    const m = { OK: [T.goodInk, T.goodBg, '#bfe3d0'], WARN: [T.warnInk, T.warnBg, '#eddcb4'], BAD: [T.badInk, T.badBg, '#eec6cb'] }[kind];
    return `<span style="padding:3px 9px;border-radius:4px;background:${m[1]};border:1px solid ${m[2]};color:${m[0]};font-size:10px;font-weight:600;letter-spacing:0.06em">${kind}</span>`;
  };

  write('Styles.dc.html', dc({
    css: plotCss + `
      body { width: ${SW}px; height: ${SH}px; overflow: hidden; background: ${T.canvas}; }
      .g4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
      .g5 { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px; }
      .g3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
    `,
    body: `
<div style="width:${SW}px;height:${SH}px;padding:36px 40px;display:flex;flex-direction:column;gap:30px;background:${T.canvas}">

  <header style="display:flex;align-items:flex-start;gap:14px">
    ${logoMark(38)}
    <div style="flex-grow:1">
      <h1 style="margin:0;font-size:22px;font-weight:600;letter-spacing:-0.02em;color:${T.ink900}">QTrace design system</h1>
      <p style="margin:5px 0 0;font-size:13px;line-height:1.55;color:${T.ink500};max-width:600px;text-wrap:pretty">Keeps the charcoal-blue spine the app already uses. What changes: a real saturated accent, hairlines that read as rules, and chart colours picked so the fit-selection encoding and the fit-quality encoding stop competing.</p>
    </div>
  </header>

  ${sect('01', 'Typography', 'IBM Plex Sans + IBM Plex Mono. Every measured value is set in mono with tabular figures, so digits stay aligned as a fit updates.', `
    <div>
      ${typeRow('Display', 'Sans 25 / 600 / -0.02em', `font-size:25px;font-weight:600;letter-spacing:-0.02em;color:${T.ink900}`, 'Load a scattering dataset')}
      ${typeRow('Section', 'Sans 15 / 600', `font-size:15px;font-weight:600;color:${T.ink900}`, 'Guinier fit')}
      ${typeRow('Card title', 'Sans 12.5 / 600', `font-size:12.5px;font-weight:600;color:${T.ink900}`, 'SEC chromatogram')}
      ${typeRow('Body', 'Sans 13 / 400 / 1.55', `font-size:13px;line-height:1.55;color:${T.ink700}`, 'A downturn at very low q usually means interparticle repulsion.')}
      ${typeRow('Label', 'Sans 10 / 600 / 0.11em caps', `font-size:10px;font-weight:600;letter-spacing:0.11em;text-transform:uppercase;color:${T.ink400}`, 'Frame selection')}
      ${typeRow('Readout', 'Mono 34 / 500 / tabular', `font-family:${MONO};font-variant-numeric:tabular-nums;font-size:34px;font-weight:500;letter-spacing:-0.02em;color:{{accent}}`, '24.82')}
      ${typeRow('Data', 'Mono 12.5 / 500 / tabular', `font-family:${MONO};font-variant-numeric:tabular-nums;font-size:12.5px;font-weight:500;color:${T.ink900}`, '0.0170 → 0.0525 Å⁻¹   ·   q·Rg 1.27')}
    </div>`)}

  ${sect('02', 'Ink and surface', 'The app\'s c1–c5 tokens, with a darker heading ink and a desaturated hairline. The old #b8dbd9 border was too saturated to recede.', `
    <div class="g5">
      ${swatch(T.ink900, 'Headings, fit line', 'ink-900', true)}
      ${swatch(T.ink700, 'Body — the app\'s c1', 'ink-700', true)}
      ${swatch(T.ink500, 'Secondary text, axis names', 'ink-500', true)}
      ${swatch(T.ink400, 'Muted labels, excluded marks', 'ink-400')}
      ${swatch(T.line, 'Hairlines, card borders', 'line')}
    </div>
    <div class="g5">
      ${swatch(T.surface, 'Cards, rails', 'surface')}
      ${swatch(T.canvas, 'App background', 'canvas')}
      ${swatch(T.accent, 'Primary action, active state', 'accent', true)}
      ${swatch(T.accentSoft, 'Accent fill, selected row', 'accent-soft')}
      ${swatch(T.violet, 'Residual marks', 'violet', true)}
    </div>`)}

  ${sect('03', 'Chart encodings', 'Two separate jobs, two separate scales. Selection (which frames, which points) rides an ordinal teal ramp; quality (is this fit trustworthy) rides the status trio.', `
    <div style="display:grid;grid-template-columns:1.15fr 1fr;gap:22px">
      <div style="display:flex;flex-direction:column;gap:9px">
        <span class="lbl">Selection — ordinal, one hue</span>
        <div style="display:flex;gap:8px">
          ${[[T.secOut, 'Excluded'], [T.secBuf, 'Buffer'], [T.secSig, 'Signal / in fit']].map(([c, n]) => `
          <div style="flex-grow:1;min-width:0">
            <div style="height:34px;border-radius:5px;background:${c}"></div>
            <div style="font-size:10.5px;font-weight:600;color:${T.ink900};margin-top:5px">${n}</div>
            <div class="mono" style="font-size:10px;color:${T.ink400}">${c}</div>
          </div>`).join('')}
        </div>
        <p style="margin:2px 0 0;font-size:10.5px;line-height:1.5;color:${T.ink500};text-wrap:pretty">Monotone lightness, single hue, light end clears the surface at 2.15:1 — passes the ordinal check.</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:9px">
        <span class="lbl">Quality — status, never colour alone</span>
        <div style="display:flex;gap:8px">
          ${[[T.good, 'OK', 'qRg ≤ 1.3'], [T.warn, 'WARN', '≤ 1.5'], [T.bad, 'BAD', '> 1.5']].map(([c, n, s]) => `
          <div style="flex-grow:1;min-width:0">
            <div style="height:34px;border-radius:5px;background:${c}"></div>
            <div style="font-size:10.5px;font-weight:600;color:${T.ink900};margin-top:5px">${n}</div>
            <div class="mono" style="font-size:10px;color:${T.ink400}">${s}</div>
          </div>`).join('')}
        </div>
        <p style="margin:2px 0 0;font-size:10.5px;line-height:1.5;color:${T.ink500};text-wrap:pretty">Split by lightness, not hue alone, so red and green stay 10.5 ΔE apart under deuteranopia. Always shipped with the word.</p>
      </div>
    </div>

    <div style="background:${T.surface};border:1px solid ${T.line};border-radius:8px;padding:14px 16px;display:flex;align-items:center;gap:26px;flex-wrap:wrap">
      <span class="lbl">Marks</span>
      ${[
        [`<svg width="34" height="14"><circle cx="8" cy="7" r="3.1" fill="${T.accent}"/><circle cx="20" cy="7" r="3.1" fill="${T.accent}"/></svg>`, 'In fit'],
        [`<svg width="34" height="14"><circle cx="8" cy="7" r="2.4" fill="${T.ink400}" opacity=".38"/><circle cx="20" cy="7" r="2.4" fill="${T.ink400}" opacity=".38"/></svg>`, 'Excluded'],
        [`<svg width="34" height="14"><line x1="3" y1="11" x2="31" y2="3" stroke="${T.ink900}" stroke-width="2" stroke-linecap="round"/></svg>`, 'Fitted line, 2px'],
        [`<svg width="34" height="14"><line x1="10" y1="7" x2="10" y2="2" stroke="${T.violet}" stroke-width="1.4" opacity=".34"/><circle cx="10" cy="2" r="2.6" fill="${T.violet}"/><line x1="24" y1="7" x2="24" y2="11" stroke="${T.violet}" stroke-width="1.4" opacity=".34"/><circle cx="24" cy="11" r="2.6" fill="${T.violet}"/></svg>`, 'Residual'],
        [`<svg width="34" height="14"><line x1="2" y1="7" x2="32" y2="7" stroke="${T.gridLine}" stroke-width="1"/></svg>`, 'Grid, recessive'],
      ].map(([g, n]) => `<span style="display:inline-flex;align-items:center;gap:8px">${g}<span style="font-size:11px;color:${T.ink500}">${n}</span></span>`).join('')}
    </div>`)}

  ${sect('04', 'Components', 'One primary action per surface. Controls sit inside the card they act on, not in a separate toolbar.', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:22px">
      <div style="display:flex;flex-direction:column;gap:11px">
        <span class="lbl">Buttons</span>
        <div style="display:flex;gap:9px;flex-wrap:wrap">
          ${btn('Snapshot', 'primary')}${btn('Export', 'secondary')}${btn('Auto-find range', 'quiet')}${btn('Clear', 'danger')}
        </div>
        <span class="lbl" style="margin-top:6px">Status tags</span>
        <div style="display:flex;gap:9px">${statusTag('OK')}${statusTag('WARN')}${statusTag('BAD')}</div>
        <span class="lbl" style="margin-top:6px">Fit range control</span>
        <div style="display:flex;align-items:center;gap:12px;padding:10px 13px;background:${T.surface};border:1px solid ${T.line};border-radius:7px">
          <div style="flex-grow:1;position:relative;height:4px;background:${T.line};border-radius:2px">
            <div style="position:absolute;left:14%;right:31%;top:0;bottom:0;background:{{accent}};border-radius:2px"></div>
            <div style="position:absolute;left:14%;top:-6px;width:14px;height:16px;margin-left:-7px;border-radius:4px;background:${T.surface};border:2px solid {{accent}}"></div>
            <div style="position:absolute;left:69%;top:-6px;width:14px;height:16px;margin-left:-7px;border-radius:4px;background:${T.surface};border:2px solid {{accent}}"></div>
          </div>
          <span class="mono" style="font-size:12px;font-weight:500;color:${T.ink900}">36 pts</span>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:11px">
        <span class="lbl">Result tile</span>
        <div style="background:${T.surface};border:1px solid ${T.line};border-radius:8px;padding:13px 14px">
          <span class="lbl" style="font-size:10px">Radius of gyration</span>
          <div style="display:flex;align-items:baseline;gap:5px;margin-top:3px">
            <span class="mono" style="font-size:34px;font-weight:500;line-height:1.05;letter-spacing:-0.02em;color:{{accent}}">24.82</span>
            <span class="mono" style="font-size:13px;color:${T.ink400}">Å</span>
          </div>
          <span class="mono" style="font-size:11.5px;color:${T.ink500}">± 0.31 Å  (95% CI)</span>
        </div>
        <span class="lbl" style="margin-top:6px">Insight callout</span>
        <div style="border:1px solid #eddcb4;background:${T.warnBg};border-radius:7px;padding:10px 11px;display:flex;flex-direction:column;gap:7px">
          <div style="display:flex;gap:8px;align-items:flex-start">
            <span style="color:${T.warnInk};display:flex;margin-top:1px;transform:scale(.85);transform-origin:top left">${I.alert}</span>
            <span style="flex-grow:1;font-size:12.5px;line-height:1.45;color:${T.ink900}">The lowest four points sit below the fitted line.</span>
          </div>
          <p style="margin:0 0 0 22px;font-size:11.5px;line-height:1.6;color:${T.ink500};border-left:2px solid #eddcb4;padding-left:9px">Interparticle repulsion biases Rg low. Try a more dilute frame range.</p>
        </div>
      </div>
    </div>`)}

</div>`,
    script: accentScript(SW, SH),
  }));
}

/* ══ Low-fi alternate directions ══════════════════════════════════════ */
const DW = 900, DH = 640;

const sketchCss = `
  body { width: ${DW}px; height: ${DH}px; overflow: hidden; }
  .box { border: 1.5px solid #9aa5aa; border-radius: 4px; background: #fff; }
  .fill { background: repeating-linear-gradient(135deg, #eceff0 0 6px, #f6f8f8 6px 12px); }
  .cap { font-size: 11px; font-weight: 600; color: #55707c; letter-spacing: .02em; }
  .hand { font-family: 'Caveat', 'Bradley Hand', cursive; font-size: 17px; color: ${T.accent}; }
  .tiny { font-size: 9.5px; color: #8a969b; }
`;
const handFont = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&display=swap">`;

const sketchHeader = (letter, title, thesis) => `
<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:16px">
  <span style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:6px;background:${T.ink900};color:#fff;font-size:12px;font-weight:600;flex-shrink:0">${letter}</span>
  <div>
    <h1 style="margin:0;font-size:16px;font-weight:600;color:${T.ink900};letter-spacing:-0.01em">${title}</h1>
    <p style="margin:3px 0 0;font-size:12px;line-height:1.5;color:${T.ink500};max-width:660px;text-wrap:pretty">${thesis}</p>
  </div>
</div>`;

const tradeoff = (good, bad) => `
<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px;padding-top:12px;border-top:1.5px dashed #c3cdd1">
  <div><div class="cap" style="color:${T.goodInk}">Wins</div><p style="margin:4px 0 0;font-size:11.5px;line-height:1.5;color:${T.ink500};text-wrap:pretty">${good}</p></div>
  <div><div class="cap" style="color:${T.badInk}">Costs</div><p style="margin:4px 0 0;font-size:11.5px;line-height:1.5;color:${T.ink500};text-wrap:pretty">${bad}</p></div>
</div>`;

/* ── Direction B: stepped pipeline ─────────────────────────────────── */
{
  const step = (n, label, active) => `
<div style="display:flex;align-items:center;gap:9px;padding:8px 9px;border-radius:5px;background:${active ? T.accentSoft : 'transparent'};border:1.5px solid ${active ? T.accent : 'transparent'}">
  <span style="display:flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;flex-shrink:0;font-size:10px;font-weight:600;background:${active ? T.accent : '#e3e8ea'};color:${active ? '#fff' : '#7d8b91'}">${n}</span>
  <span style="font-size:11.5px;font-weight:${active ? 600 : 500};color:${active ? T.ink900 : '#7d8b91'}">${label}</span>
</div>`;

  write('DirectionB.dc.html', dc({
    css: sketchCss,
    body: `${handFont}
<div style="width:${DW}px;height:${DH}px;padding:26px 30px;background:#f7f9f9;display:flex;flex-direction:column">
  ${sketchHeader('B', 'Stepped pipeline', 'One decision per screen. The app walks you load → select frames → fit → report, and only ever asks for the one thing that step needs. The result bar stays pinned along the bottom the whole way.')}

  <div style="flex-grow:1;display:flex;gap:12px;min-height:0">
    <div class="box" style="width:150px;flex-shrink:0;padding:10px 8px;display:flex;flex-direction:column;gap:4px">
      <div class="cap" style="padding:0 6px 6px">Workflow</div>
      ${step(1, 'Load frames', false)}
      ${step(2, 'Select regions', false)}
      ${step(3, 'Fit Guinier', true)}
      ${step(4, 'Review &amp; export', false)}
      <div style="flex-grow:1"></div>
      <div class="hand" style="padding:0 6px;line-height:1.25">one step<br>at a time</div>
    </div>

    <div style="flex-grow:1;display:flex;flex-direction:column;gap:12px;min-width:0">
      <div class="box fill" style="flex-grow:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px">
        <div class="cap" style="font-size:13px">Guinier plot — full width</div>
        <div class="tiny">the only plot on screen for this step</div>
      </div>
      <div class="box" style="height:52px;display:flex;align-items:center;padding:0 14px;gap:14px">
        <span class="cap">Fit range</span>
        <div style="flex-grow:1;height:4px;background:#e3e8ea;border-radius:2px;position:relative">
          <div style="position:absolute;left:16%;right:30%;top:0;bottom:0;background:${T.accent};border-radius:2px"></div>
        </div>
        <span class="tiny">drag, or auto-find</span>
      </div>
      <div class="box" style="height:66px;display:flex;align-items:center;padding:0 14px;gap:20px;background:${T.ink900};border-color:${T.ink900}">
        <div><div class="tiny" style="color:#8fa5ad">Rg</div><div class="mono" style="font-size:19px;font-weight:500;color:#fff">24.82 Å</div></div>
        <div><div class="tiny" style="color:#8fa5ad">I(0)</div><div class="mono" style="font-size:19px;font-weight:500;color:#fff">101.4</div></div>
        <div><div class="tiny" style="color:#8fa5ad">q·Rg</div><div class="mono" style="font-size:19px;font-weight:500;color:#8fd3d8">1.27</div></div>
        <div style="flex-grow:1"></div>
        <span class="hand" style="color:#8fd3d8">result bar follows you</span>
      </div>
    </div>
  </div>

  ${tradeoff(
      'A first-time user cannot get lost, and every step can carry its own teaching copy. Reads as a product, not a lab script.',
      'An expert iterating on a fit pays for the structure — they want the chromatogram and the fit on screen together, and this hides one to show the other.')}
</div>`,
  }));
}

/* ── Direction C: dark instrument console ──────────────────────────── */
{
  const panel = (label, note, span) => `
<div style="grid-column:span ${span || 1};border:1.5px solid #3a4c55;border-radius:4px;background:#1b2b33;padding:8px 10px;display:flex;flex-direction:column;gap:4px;min-height:0">
  <div style="display:flex;justify-content:space-between;align-items:baseline">
    <span style="font-size:10px;font-weight:600;color:#cfe0e4;letter-spacing:.03em">${label}</span>
    <span style="font-size:9px;color:#6f8992">${note}</span>
  </div>
  <div style="flex-grow:1;border-radius:3px;background:repeating-linear-gradient(135deg,#22343d 0 6px,#1e303a 6px 12px)"></div>
</div>`;

  write('DirectionC.dc.html', dc({
    css: sketchCss,
    body: `${handFont}
<div style="width:${DW}px;height:${DH}px;padding:26px 30px;background:#f7f9f9;display:flex;flex-direction:column">
  ${sketchHeader('C', 'Dark instrument console', 'Everything visible at once on a dark ground, the way beamline control software looks. No rails, no scrolling — a fixed grid of panels plus a command bar, driven by keyboard as much as mouse.')}

  <div style="flex-grow:1;border-radius:6px;background:#16242b;padding:10px;display:flex;flex-direction:column;gap:9px;min-height:0">
    <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
      <span style="font-size:11px;font-weight:600;color:#8fd3d8">QTRACE</span>
      <div style="flex-grow:1;height:26px;border-radius:4px;background:#1b2b33;border:1.5px solid #3a4c55;display:flex;align-items:center;padding:0 10px">
        <span class="mono" style="font-size:10px;color:#6f8992">⌘K  ·  fit 0.017 0.0525  ·  export csv</span>
      </div>
      <span class="mono" style="font-size:10px;color:#cfe0e4">Rg 24.82 ± 0.31</span>
      <span style="padding:2px 7px;border-radius:3px;background:#1d4a38;color:#7fd6a6;font-size:9px;font-weight:600">OK</span>
    </div>

    <div style="flex-grow:1;display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));grid-template-rows:repeat(2, minmax(0, 1fr));gap:9px;min-height:0">
      ${panel('CHROMATOGRAM', '240 frames', 3)}
      ${panel('GUINIER', '36 pts')}
      ${panel('RESIDUALS', '±2σ')}
      ${panel('KRATKY', 'globular')}
    </div>
  </div>

  <div class="hand" style="margin-top:8px">dense, keyboard-first — every number on one screen</div>

  ${tradeoff(
      'Instantly credible to anyone who has sat at a beamline. Nothing is ever more than one glance away, and it photographs well for a pitch.',
      'Dark UI is hard to read in a bright lab, figures exported from it need re-theming for a paper, and it signals "expert tool" — the opposite of commercial reach.')}
</div>`,
  }));
}
