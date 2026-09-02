// Generates SVG fragments for the QTrace mockup plots.
// Deterministic PRNG so re-runs are stable.
let s = 20260902;
const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const gauss = () => {
  let u = 0, v = 0;
  while (u === 0) u = rnd();
  while (v === 0) v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const f = (n, d = 1) => Number(n.toFixed(d));

const out = {};

/* ─── 1. SEC chromatogram ────────────────────────────────────────────
   240 frames, total integrated intensity per frame. Flat buffer
   baseline, a void peak, then the main elution peak with a shoulder
   (aggregate) on the leading edge - the realistic SEC-SAXS shape. */
{
  const W = 788, H = 88, N = 240;
  const peak = (x, mu, sig, amp) => amp * Math.exp(-((x - mu) ** 2) / (2 * sig * sig));
  const vals = [];
  for (let i = 0; i < N; i++) {
    let y = 0.04                       // buffer baseline
      + peak(i, 62, 7, 0.16)           // void peak
      + peak(i, 104, 9, 0.34)          // aggregate shoulder
      + peak(i, 128, 13, 1.0)          // main monomer peak
      + peak(i, 176, 16, 0.10);        // trailing small-species
    y += gauss() * 0.006;
    vals.push(Math.max(0.012, y));
  }
  const max = Math.max(...vals);
  const bw = W / N;
  const bars = vals.map((v, i) => {
    const h = (v / max) * (H - 6);
    // 12-38 buffer, 116-142 signal
    const zone = i >= 12 && i <= 38 ? 'b' : i >= 116 && i <= 142 ? 's' : 'o';
    return `<rect x="${f(i * bw, 2)}" y="${f(H - h, 2)}" width="${f(bw * 0.82, 2)}" height="${f(h, 2)}" class="sec-${zone}"/>`;
  }).join('');
  out.sec = { W, H, bars, bufX: [f(12 * bw, 1), f(39 * bw, 1)], sigX: [f(116 * bw, 1), f(143 * bw, 1)] };
}

/* ─── 2. Guinier plot: ln I(q) vs q² ─────────────────────────────────
   Linear region with a downturn at very low q (a touch of
   interparticle repulsion) and rising noise at high q. */
{
  const W = 788, H = 270, PL = 58, PR = 16, PT = 16, PB = 34;
  const iw = W - PL - PR, ih = H - PT - PB;
  const Rg = 24.8, lnI0 = 4.62;
  const q2min = 0, q2max = 0.0042;
  const pts = [];
  const N = 62;
  for (let i = 0; i < N; i++) {
    const q2 = q2min + (i / (N - 1)) * q2max;
    let lnI = lnI0 - (Rg * Rg / 3) * q2;
    if (q2 < 0.00035) lnI -= (0.00035 - q2) * 260;   // low-q downturn
    const noise = 0.008 + q2 * 6;
    lnI += gauss() * noise;
    pts.push({ q2, lnI });
  }
  const yvals = pts.map(p => p.lnI);
  const ymin = Math.min(...yvals) - 0.05, ymax = Math.max(...yvals) + 0.05;
  const X = q2 => PL + (q2 - q2min) / (q2max - q2min) * iw;
  const Y = v => PT + (ymax - v) / (ymax - ymin) * ih;
  // fit range: indices 9..44
  const lo = 9, hi = 44;
  const inFit = i => i >= lo && i <= hi;
  const dots = pts.map((p, i) =>
    `<circle cx="${f(X(p.q2), 1)}" cy="${f(Y(p.lnI), 1)}" r="${inFit(i) ? 3.1 : 2.4}" class="${inFit(i) ? 'g-in' : 'g-out'}"/>`
  ).join('');
  const fitLine = `<line x1="${f(X(pts[lo].q2) - 26, 1)}" y1="${f(Y(lnI0 - (Rg * Rg / 3) * (pts[lo].q2 - 26 / iw * q2max)), 1)}" x2="${f(X(pts[hi].q2) + 30, 1)}" y2="${f(Y(lnI0 - (Rg * Rg / 3) * (pts[hi].q2 + 30 / iw * q2max)), 1)}" class="fitline"/>`;
  out.guinier = {
    W, H, PL, PR, PT, PB, dots, fitLine,
    bandX: f(X(pts[lo].q2), 1), bandW: f(X(pts[hi].q2) - X(pts[lo].q2), 1),
    yTicks: [4.6, 4.4, 4.2, 4.0].map(v => ({ v: v.toFixed(1), y: f(Y(v), 1) })).filter(t => +t.y > PT && +t.y < PT + ih),
    xTicks: [0, 0.001, 0.002, 0.003, 0.004].map(v => ({ v: v === 0 ? '0' : v.toFixed(3), x: f(X(v), 1) })),
    // qRg validity band under the axis: OK to qRg 1.3, WARN to 1.5, BAD after
    qrgOk: f(X(0.00275), 1), qrgWarn: f(X(0.00366), 1),
  };
}

/* ─── 3. Residuals (normalised, vs q²) ───────────────────────────────*/
{
  const W = 788, H = 80, PL = 58, PR = 16, PT = 10, PB = 20;
  const iw = W - PL - PR, ih = H - PT - PB;
  const N = 36;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const x = PL + (i / (N - 1)) * iw;
    // mild systematic curve at the ends, random in the middle
    const t = i / (N - 1);
    const sys = 0.55 * Math.cos(t * Math.PI * 1.15) * (t < 0.18 || t > 0.86 ? 1 : 0.12);
    pts.push({ x, r: sys + gauss() * 0.72 });
  }
  const rmax = 2.6;
  const Y = r => PT + (rmax - r) / (2 * rmax) * ih;
  const stems = pts.map(p =>
    `<line x1="${f(p.x, 1)}" y1="${f(Y(0), 1)}" x2="${f(p.x, 1)}" y2="${f(Y(p.r), 1)}" class="res-stem"/>`
  ).join('');
  const dots = pts.map(p => `<circle cx="${f(p.x, 1)}" cy="${f(Y(p.r), 1)}" r="2.6" class="res-dot"/>`).join('');
  out.residuals = { W, H, PL, PR, PT, PB, stems, dots, zeroY: f(Y(0), 1), bandTop: f(Y(2), 1), bandBot: f(Y(-2), 1) };
}

/* Sphere form factor - gives a correct Guinier region at low q, the
   q^-4 Porod tail at high q, and the right Kratky bell in between.
   R chosen so Rg = R*sqrt(3/5) = 24.8 A. */
const R_SPHERE = 24.8 * Math.sqrt(5 / 3);
const sphereI = (q, I0 = 101, bg = 0.06) => {
  const x = q * R_SPHERE;
  const P = x < 1e-6 ? 1 : Math.pow(3 * (Math.sin(x) - x * Math.cos(x)) / (x * x * x), 2);
  return I0 * P + bg;
};

/* ─── 4. Full scattering curve, log I vs q ───────────────────────────*/
{
  const W = 375, H = 186, PL = 46, PR = 12, PT = 14, PB = 28;
  const iw = W - PL - PR, ih = H - PT - PB;
  const N = 150;
  const qmin = 0.008, qmax = 0.42;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const q = qmin * Math.pow(qmax / qmin, i / (N - 1));   // log-spaced q
    let I = sphereI(q);
    const rel = 0.012 + Math.pow(q, 1.7) * 1.1;
    I *= 1 + gauss() * rel;
    pts.push({ q, I: Math.max(I, 0.02) });
  }
  const X = q => PL + (Math.log10(q) - Math.log10(qmin)) / (Math.log10(qmax) - Math.log10(qmin)) * iw;
  const lI = pts.map(p => Math.log10(p.I));
  const ymin = Math.min(...lI) - 0.12, ymax = Math.max(...lI) + 0.12;
  const Y = I => PT + (ymax - Math.log10(I)) / (ymax - ymin) * ih;
  const dots = pts.map((p, i) =>
    `<circle cx="${f(X(p.q), 1)}" cy="${f(Y(p.I), 1)}" r="1.7" class="${i <= 46 ? 'c-in' : 'c-out'}"/>`
  ).join('');
  out.curve = {
    W, H, PL, PR, PT, PB, dots,
    guinierX: f(X(qmin), 1), guinierW: f(X(pts[46].q) - X(qmin), 1),
    xTicks: [0.01, 0.1].map(v => ({ v: String(v), x: f(X(v), 1) })),
  };
}

/* ─── 5. Kratky plot: q²·I(q) vs q ───────────────────────────────────*/
{
  const W = 375, H = 186, PL = 46, PR = 12, PT = 14, PB = 28;
  const iw = W - PL - PR, ih = H - PT - PB;
  const N = 130;
  const qmin = 0.005, qmax = 0.34;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const q = qmin + (i / (N - 1)) * (qmax - qmin);
    let y = q * q * sphereI(q);
    y *= 1 + gauss() * (0.012 + q * 0.10);
    pts.push({ q, y });
  }
  const ymax = Math.max(...pts.map(p => p.y)) * 1.14;
  const X = q => PL + (q - qmin) / (qmax - qmin) * iw;
  const Y = y => PT + (ymax - y) / ymax * ih;
  const line = 'M ' + pts.map(p => `${f(X(p.q), 1)} ${f(Y(p.y), 1)}`).join(' L ');
  const area = line + ` L ${f(X(qmax), 1)} ${f(PT + ih, 1)} L ${f(X(qmin), 1)} ${f(PT + ih, 1)} Z`;
  // guide lines at the globular-peak position qRg = sqrt(3)
  const peak = pts.reduce((a, b) => (b.y > a.y ? b : a));
  out.kratky = {
    W, H, PL, PR, PT, PB, line, area,
    peakX: f(X(peak.q), 1), peakY: f(Y(peak.y), 1),
    xTicks: [0.05, 0.15, 0.25].map(v => ({ v: v.toFixed(2), x: f(X(v), 1) })),
  };
}

console.log(JSON.stringify(out, null, 0));
