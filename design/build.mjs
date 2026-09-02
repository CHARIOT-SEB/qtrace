/**
 * Builds the QTrace redesign artboards (.dc.html) from the plot geometry in
 * plots.json. Run:  node design/build.mjs
 *
 * Values are lifted from the live app (src/theme.ts, src/index.css,
 * src/chartTheme.ts and the component .styles.ts files) except where the
 * redesign deliberately changes them - those are marked CHANGED.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const P = JSON.parse(readFileSync(join(here, 'plots.json'), 'utf8'));

/* ── Tokens ─────────────────────────────────────────────────────────────
   Ink spine keeps the app's charcoal-blue family. CHANGED: a darker
   heading ink and a desaturated hairline, because the old c4 #b8dbd9
   border was too saturated to read as a rule; and a real saturated accent,
   because the old palette failed the chroma floor (everything read gray).
   The SEC ramp and the status trio are validated sets.                  */
const T = {
  ink900: '#16262e',   // CHANGED - headings (was c1 #2f4550)
  ink700: '#2f4550',   // c1, unchanged - body strong
  ink500: '#55707c',   // ~c2 #586f7c - secondary text
  ink400: '#7d949e',   // ~c3 #8aaab5 - muted labels
  line: '#dde6e8',     // CHANGED - hairline (was c4 #b8dbd9)
  lineStrong: '#c3d4d8',
  surface: '#ffffff',
  canvas: '#f1f4f5',   // ~c5 #f4f4f9, cooled
  accent: '#0f5b68',   // CHANGED - new saturated accent
  accentSoft: '#e4eff1',
  // Validated ordinal ramp for the chromatogram (excluded -> buffer -> signal)
  secOut: '#93b7bf', secBuf: '#4a8f9d', secSig: '#0f5b68',
  // Validated status trio (lightness-split so it survives deuteranopia)
  good: '#4fb37e', goodInk: '#1d6b45', goodBg: '#eaf6f0',
  warn: '#d08c00', warnInk: '#8a5a00', warnBg: '#fbf3e3',
  bad: '#9e2436', badInk: '#8a1f2f', badBg: '#fbecee',
  violet: '#6b5ca8',   // CHANGED - residuals (was #C5A4FF, too pale to read)
  gridLine: '#e8eef0',
};

const FONT = `'IBM Plex Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif`;
const MONO = `'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace`;

const fontsLink =
  `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap">`;

/* ── Icons (16px stroke grid) ───────────────────────────────────────── */
const ico = (d, size = 16, sw = 1.6) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">${d}</svg>`;

const I = {
  download: ico('<path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/>'),
  bookmark: ico('<path d="M6 3h12v18l-6-4.5L6 21z"/>'),
  cloud: ico('<path d="M7 19h10a4 4 0 0 0 .6-7.96A6 6 0 0 0 6 10.5 4.25 4.25 0 0 0 7 19z"/>'),
  trash: ico('<path d="M4 6h16"/><path d="M9 6V4h6v2"/><path d="M6 6l1 14h10l1-14"/>'),
  wand: ico('<path d="M4 20l10-10"/><path d="M15 4v4"/><path d="M13 6h4"/><path d="M18 11v3"/><path d="M16.5 12.5h3"/><path d="M13 9l2 2"/>'),
  chev: ico('<path d="M6 9l6 6 6-6"/>', 14),
  chevR: ico('<path d="M9 6l6 6-6 6"/>', 14),
  file: ico('<path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z"/><path d="M14 3v4h4"/>'),
  layers: ico('<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>'),
  info: ico('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>'),
  alert: ico('<path d="M12 4l9 16H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/>'),
  check: ico('<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>'),
  upload: ico('<path d="M12 20V8"/><path d="M7 12l5-5 5 5"/><path d="M4 4h16"/>', 22),
  plus: ico('<path d="M12 5v14"/><path d="M5 12h14"/>', 14),
  lock: ico('<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', 13),
  flask: ico('<path d="M10 3v6.5L4.8 18A2 2 0 0 0 6.5 21h11a2 2 0 0 0 1.7-3L14 9.5V3"/><path d="M9 3h6"/><path d="M7.5 15h9"/>'),
};

/* The logo mark: a decaying scattering curve inside a rounded tile. */
const logoMark = (size = 26, bg = T.ink900, fg = '#8fd3d8') => `
<svg viewBox="0 0 28 28" width="${size}" height="${size}" style="display:block;flex-shrink:0">
  <rect width="28" height="28" rx="7" fill="${bg}"/>
  <path d="M6 8.5c3.6 0 3.2 11 6.2 11S16 12 22 12" fill="none" stroke="${fg}" stroke-width="2.1" stroke-linecap="round"/>
  <circle cx="6" cy="8.5" r="1.9" fill="#fff"/>
</svg>`;

/* ── Shared CSS ─────────────────────────────────────────────────────── */
const baseCss = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: ${FONT}; color: ${T.ink700}; background: ${T.canvas};
         -webkit-font-smoothing: antialiased; }
  a { color: ${T.accent}; text-decoration: none; }
  a:hover { color: ${T.ink900}; }
  .mono { font-family: ${MONO}; font-variant-numeric: tabular-nums; }
  .lbl { font-size: 10px; font-weight: 600; letter-spacing: 0.11em; text-transform: uppercase;
         color: ${T.ink400}; }
  .card { background: ${T.surface}; border: 1px solid ${T.line}; border-radius: 8px; }
`;

/* Plot mark styling - dataviz rules: thin recessive grid, 2px lines,
   >=8px-equivalent markers on the primary series, selective labels. */
const plotCss = `
  .grid { stroke: ${T.gridLine}; stroke-width: 1; }
  .axis { stroke: ${T.lineStrong}; stroke-width: 1; }
  .tick { font-family: ${MONO}; font-size: 9.5px; fill: ${T.ink400}; }
  .axname { font-family: ${FONT}; font-size: 10px; font-weight: 500; fill: ${T.ink500}; }
  .sec-o { fill: ${T.secOut}; opacity: .5; }
  .sec-b { fill: ${T.secBuf}; }
  .sec-s { fill: ${T.secSig}; }
  .g-out { fill: ${T.ink400}; opacity: .38; }
  .g-in  { fill: ${T.accent}; }
  .fitline { stroke: ${T.ink900}; stroke-width: 2; }
  .res-stem { stroke: ${T.violet}; stroke-width: 1.4; opacity: .34; }
  .res-dot { fill: ${T.violet}; }
  .c-out { fill: ${T.ink400}; opacity: .45; }
  .c-in  { fill: ${T.accent}; }
`;

/* ── Plot builders ──────────────────────────────────────────────────── */

function secPlot() {
  const s = P.sec;
  return `
<svg viewBox="0 0 ${s.W} ${s.H}" style="display:block;width:100%;height:auto" role="img" aria-label="SEC chromatogram, 240 frames, with buffer and signal regions selected">
  <rect x="${s.bufX[0]}" y="0" width="${s.bufX[1] - s.bufX[0]}" height="${s.H}" fill="${T.secBuf}" opacity=".09"/>
  <rect x="${s.sigX[0]}" y="0" width="${s.sigX[1] - s.sigX[0]}" height="${s.H}" fill="${T.secSig}" opacity=".09"/>
  ${s.bars}
  <line x1="0" y1="${s.H - 0.5}" x2="${s.W}" y2="${s.H - 0.5}" class="axis"/>
  ${[s.bufX, s.sigX].map(([a, b], i) => `
    <g>
      <line x1="${a}" y1="0" x2="${a}" y2="${s.H}" stroke="${i ? T.secSig : T.secBuf}" stroke-width="1.5"/>
      <line x1="${b}" y1="0" x2="${b}" y2="${s.H}" stroke="${i ? T.secSig : T.secBuf}" stroke-width="1.5"/>
      <rect x="${a - 3}" y="${s.H / 2 - 11}" width="6" height="22" rx="3" fill="${i ? T.secSig : T.secBuf}"/>
      <rect x="${b - 3}" y="${s.H / 2 - 11}" width="6" height="22" rx="3" fill="${i ? T.secSig : T.secBuf}"/>
    </g>`).join('')}
</svg>`;
}

function guinierPlot() {
  const g = P.guinier;
  const R = g.W - g.PR, B = g.H - g.PB;
  return `
<svg viewBox="0 0 ${g.W} ${g.H}" style="display:block;width:100%;height:auto" role="img" aria-label="Guinier plot, natural log of intensity against q squared, with the fitted range highlighted">
  ${g.yTicks.map(t => `<line x1="${g.PL}" y1="${t.y}" x2="${R}" y2="${t.y}" class="grid"/>`).join('')}
  <rect x="${g.bandX}" y="${g.PT}" width="${g.bandW}" height="${B - g.PT}" fill="#0f5b68" opacity=".055"/>
  <line x1="${g.bandX}" y1="${g.PT}" x2="${g.bandX}" y2="${B}" stroke="#0f5b68" stroke-width="1.5" stroke-dasharray="3 3" opacity=".55"/>
  <line x1="${g.bandX + g.bandW}" y1="${g.PT}" x2="${g.bandX + g.bandW}" y2="${B}" stroke="#0f5b68" stroke-width="1.5" stroke-dasharray="3 3" opacity=".55"/>
  ${g.dots}
  ${g.fitLine}
  <line x1="${g.PL}" y1="${B}" x2="${R}" y2="${B}" class="axis"/>
  <line x1="${g.PL}" y1="${g.PT}" x2="${g.PL}" y2="${B}" class="axis"/>
  ${g.yTicks.map(t => `<text x="${g.PL - 8}" y="${t.y + 3.4}" text-anchor="end" class="tick">${t.v}</text>`).join('')}
  ${g.xTicks.map(t => `<text x="${t.x}" y="${B + 14}" text-anchor="middle" class="tick">${t.v}</text>`).join('')}
  <text x="${g.PL - 42}" y="${(g.PT + B) / 2}" class="axname" text-anchor="middle" transform="rotate(-90 ${g.PL - 42} ${(g.PT + B) / 2})">ln I(q)</text>
  <text x="${(g.PL + R) / 2}" y="${g.H - 4}" class="axname" text-anchor="middle">q²  (Å⁻²)</text>

  <!-- qRg validity band: separates "is this point in the fit" (accent) from
       "is this q still in the Guinier regime" (status). -->
  <g>
    <rect x="${g.PL}" y="${B + 20}" width="${g.qrgOk - g.PL}" height="5" rx="2.5" fill="${T.good}"/>
    <rect x="${g.qrgOk + 2}" y="${B + 20}" width="${g.qrgWarn - g.qrgOk - 2}" height="5" rx="2.5" fill="${T.warn}"/>
    <rect x="${g.qrgWarn + 2}" y="${B + 20}" width="${R - g.qrgWarn - 2}" height="5" rx="2.5" fill="${T.bad}"/>
    <text x="${g.qrgOk}" y="${B + 16}" text-anchor="middle" class="tick" fill="${T.goodInk}">qRg 1.3</text>
    <text x="${g.qrgWarn}" y="${B + 16}" text-anchor="middle" class="tick" fill="${T.warnInk}">1.5</text>
  </g>
</svg>`;
}

function residualsPlot() {
  const r = P.residuals;
  const R = r.W - r.PR, B = r.H - r.PB;
  return `
<svg viewBox="0 0 ${r.W} ${r.H}" style="display:block;width:100%;height:auto" role="img" aria-label="Normalised fit residuals, scattered about zero within plus or minus two sigma">
  <rect x="${r.PL}" y="${r.bandTop}" width="${R - r.PL}" height="${r.bandBot - r.bandTop}" fill="${T.violet}" opacity=".055"/>
  <line x1="${r.PL}" y1="${r.bandTop}" x2="${R}" y2="${r.bandTop}" stroke="${T.violet}" stroke-width="1" stroke-dasharray="3 3" opacity=".4"/>
  <line x1="${r.PL}" y1="${r.bandBot}" x2="${R}" y2="${r.bandBot}" stroke="${T.violet}" stroke-width="1" stroke-dasharray="3 3" opacity=".4"/>
  ${r.stems}
  <line x1="${r.PL}" y1="${r.zeroY}" x2="${R}" y2="${r.zeroY}" stroke="${T.lineStrong}" stroke-width="1.2"/>
  ${r.dots}
  <text x="${r.PL - 8}" y="${r.bandTop + 3.4}" text-anchor="end" class="tick">+2σ</text>
  <text x="${r.PL - 8}" y="${r.zeroY + 3.4}" text-anchor="end" class="tick">0</text>
  <text x="${r.PL - 8}" y="${r.bandBot + 3.4}" text-anchor="end" class="tick">−2σ</text>
</svg>`;
}

function curvePlot() {
  const c = P.curve;
  const R = c.W - c.PR, B = c.H - c.PB;
  return `
<svg viewBox="0 0 ${c.W} ${c.H}" style="display:block;width:100%;height:auto" role="img" aria-label="Buffer-subtracted scattering curve, log intensity against q, with the Guinier region marked">
  <rect x="${c.guinierX}" y="${c.PT}" width="${c.guinierW}" height="${B - c.PT}" fill="${T.accent}" opacity=".05"/>
  ${c.dots}
  <line x1="${c.PL}" y1="${B}" x2="${R}" y2="${B}" class="axis"/>
  <line x1="${c.PL}" y1="${c.PT}" x2="${c.PL}" y2="${B}" class="axis"/>
  ${c.xTicks.map(t => `<text x="${t.x}" y="${B + 14}" text-anchor="middle" class="tick">${t.v}</text>`).join('')}
  <text x="${(c.PL + R) / 2}" y="${c.H - 3}" class="axname" text-anchor="middle">q (Å⁻¹, log)</text>
  <text x="${c.PL - 32}" y="${(c.PT + B) / 2}" class="axname" text-anchor="middle" transform="rotate(-90 ${c.PL - 32} ${(c.PT + B) / 2})">log I(q)</text>
  <g transform="translate(${c.guinierX + 6}, ${c.PT + 12})">
    <text class="tick" fill="${T.accent}" font-weight="600">Guinier region</text>
  </g>
</svg>`;
}

function kratkyPlot() {
  const k = P.kratky;
  const R = k.W - k.PR, B = k.H - k.PB;
  return `
<svg viewBox="0 0 ${k.W} ${k.H}" style="display:block;width:100%;height:auto" role="img" aria-label="Kratky plot showing a single bell-shaped peak, consistent with a folded globular particle">
  <path d="${k.area}" fill="${T.accent}" opacity=".07"/>
  <path d="${k.line}" fill="none" stroke="${T.accent}" stroke-width="2" stroke-linejoin="round"/>
  <line x1="${k.peakX}" y1="${k.peakY}" x2="${k.peakX}" y2="${B}" stroke="${T.ink400}" stroke-width="1" stroke-dasharray="3 3"/>
  <circle cx="${k.peakX}" cy="${k.peakY}" r="3.4" fill="${T.surface}" stroke="${T.accent}" stroke-width="2"/>
  <text x="${k.peakX + 8}" y="${k.peakY + 1}" class="tick" fill="${T.ink500}" font-weight="600">peak qRg 1.74</text>
  <line x1="${k.PL}" y1="${B}" x2="${R}" y2="${B}" class="axis"/>
  <line x1="${k.PL}" y1="${k.PT}" x2="${k.PL}" y2="${B}" class="axis"/>
  ${k.xTicks.map(t => `<text x="${t.x}" y="${B + 14}" text-anchor="middle" class="tick">${t.v}</text>`).join('')}
  <text x="${(k.PL + R) / 2}" y="${k.H - 3}" class="axname" text-anchor="middle">q (Å⁻¹)</text>
  <text x="${k.PL - 32}" y="${(k.PT + B) / 2}" class="axname" text-anchor="middle" transform="rotate(-90 ${k.PL - 32} ${(k.PT + B) / 2})">q²·I(q)</text>
</svg>`;
}

/* ── Shell pieces shared by Main + Empty ────────────────────────────── */

const topbar = ({ dataset, actionsEnabled }) => `
<header style="display:flex;align-items:center;gap:16px;height:56px;padding:0 18px;background:${T.surface};border-bottom:1px solid ${T.line};flex-shrink:0">
  <div style="display:flex;align-items:center;gap:9px">
    ${logoMark(26)}
    <span style="font-size:15px;font-weight:600;letter-spacing:-0.01em;color:${T.ink900}">QTrace</span>
  </div>
  <div style="width:1px;height:22px;background:${T.line}"></div>
  ${dataset}
  <div style="flex-grow:1"></div>
  <div style="display:flex;align-items:center;gap:8px">
    <button style="display:inline-flex;align-items:center;gap:7px;height:32px;padding:0 12px;border:1px solid ${T.line};background:${T.surface};border-radius:6px;font:inherit;font-size:12.5px;font-weight:500;color:${actionsEnabled ? T.ink700 : T.ink400};cursor:pointer;opacity:${actionsEnabled ? 1 : .5}">${I.download}Export</button>
    <button style="display:inline-flex;align-items:center;gap:7px;height:32px;padding:0 13px;border:none;background:{{accent}};border-radius:6px;font:inherit;font-size:12.5px;font-weight:500;color:#fff;cursor:pointer;box-shadow:0 1px 2px rgba(22,38,46,.16);opacity:${actionsEnabled ? 1 : .45}">${I.bookmark}Snapshot</button>
    <div style="width:1px;height:22px;background:${T.line};margin:0 2px"></div>
    <div style="width:28px;height:28px;border-radius:50%;background:${T.accentSoft};border:1px solid ${T.line};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:${T.accent}">SB</div>
  </div>
</header>`;

const datasetChip = `
<div style="display:flex;align-items:center;gap:10px;height:32px;padding:0 11px;background:${T.canvas};border:1px solid ${T.line};border-radius:6px">
  <span style="color:${T.ink400};display:flex">${I.file}</span>
  <span class="mono" style="font-size:12.5px;color:${T.ink900};font-weight:500">lysozyme_sec_01</span>
  <span style="font-size:11px;color:${T.ink400}">240 frames · 2.4 MB</span>
</div>`;

const railHead = (text, right = '') => `
<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 0 9px">
  <span class="lbl">${text}</span>${right}
</div>`;

const snapshotRow = ({ name, meta, cloud, active }) => `
<div style="display:flex;align-items:center;gap:9px;padding:8px 9px;border-radius:6px;background:${active ? T.accentSoft : 'transparent'};border:1px solid ${active ? '#c4dee2' : 'transparent'};cursor:pointer">
  <span style="color:${cloud ? T.accent : T.ink400};display:flex">${cloud ? I.cloud : I.bookmark}</span>
  <div style="flex-grow:1;min-width:0">
    <div style="font-size:12.5px;font-weight:${active ? 600 : 500};color:${T.ink900};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</div>
    <div class="mono" style="font-size:10.5px;color:${T.ink400};margin-top:1px">${meta}</div>
  </div>
</div>`;

const statTile = (label, value, unit, sub, big) => `
<div class="card" style="padding:${big ? '13px 14px 12px' : '10px 11px'};display:flex;flex-direction:column;gap:${big ? '3px' : '2px'}">
  <span class="lbl" style="font-size:${big ? 10 : 9.5}px">${label}</span>
  <div style="display:flex;align-items:baseline;gap:4px">
    <span class="mono" style="font-size:${big ? 34 : 19}px;font-weight:500;line-height:1.05;color:${big ? '{{accent}}' : T.ink900};letter-spacing:-0.02em">${value}</span>
    ${unit ? `<span class="mono" style="font-size:${big ? 13 : 10.5}px;color:${T.ink400}">${unit}</span>` : ''}
  </div>
  ${sub ? `<span class="mono" style="font-size:${big ? 11.5 : 10}px;color:${T.ink500}">${sub}</span>` : ''}
</div>`;

const tag = (kind) => {
  const m = { OK: [T.goodInk, T.goodBg, '#bfe3d0', I.check], WARN: [T.warnInk, T.warnBg, '#eddcb4', I.alert], BAD: [T.badInk, T.badBg, '#eec6cb', I.alert] }[kind];
  return `<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 7px 2px 5px;border-radius:4px;background:${m[1]};border:1px solid ${m[2]};color:${m[0]};font-size:9.5px;font-weight:600;letter-spacing:0.06em"><span style="display:flex;transform:scale(.72);transform-origin:center">${m[3]}</span>${kind}</span>`;
};

const insight = ({ kind, msg, why }) => {
  const m = { warn: [T.warnInk, T.warnBg, '#eddcb4', I.alert], info: [T.accent, T.accentSoft, '#c4dee2', I.info], bad: [T.badInk, T.badBg, '#eec6cb', I.alert] }[kind];
  return `
<div style="border:1px solid ${m[2]};background:${m[1]};border-radius:7px;padding:10px 11px;display:flex;flex-direction:column;gap:7px">
  <div style="display:flex;gap:8px;align-items:flex-start">
    <span style="color:${m[0]};display:flex;margin-top:1px;transform:scale(.85);transform-origin:top left">${m[3]}</span>
    <span style="flex-grow:1;font-size:12.5px;line-height:1.45;color:${T.ink900}">${msg}</span>
  </div>
  ${why
      ? `<p style="margin:0 0 0 22px;font-size:11.5px;line-height:1.6;color:${T.ink500};border-left:2px solid ${m[2]};padding-left:9px">${why}</p>`
      : `<button style="align-self:flex-start;margin-left:22px;padding:0;border:none;background:none;font:inherit;font-size:11.5px;font-weight:500;color:${m[0]};cursor:pointer;text-decoration:underline;text-underline-offset:2px">Why?</button>`}
</div>`;
};

/* ── The .dc.html wrapper ───────────────────────────────────────────── */
function dc({ css, body, script }) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  ${fontsLink}
  <style>${baseCss}${css || ''}</style>
</helmet>
${body}
</x-dc>
${script || ''}
</body>
</html>
`;
}

const accentScript = (w, h) => `<script data-dc-script data-props='{"accent":{"editor":"color","default":"${T.accent}","options":["${T.accent}","#1c6ea8","#7a3d8f","#16262e"],"section":"Theme"},"$preview":{"width":${w},"height":${h}}}'>
class Component extends DCLogic {
  renderVals() {
    return { accent: this.props.accent ?? '${T.accent}' };
  }
}
</script>`;

export { T, FONT, MONO, I, ico, logoMark, baseCss, plotCss, secPlot, guinierPlot, residualsPlot, curvePlot, kratkyPlot, topbar, datasetChip, railHead, snapshotRow, statTile, tag, insight, dc, accentScript, here, writeFileSync, join };
