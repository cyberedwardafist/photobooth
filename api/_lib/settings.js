// Pengaturan situs: satu sumber kebenaran untuk Vercel (api/) dan server lokal (server.js). Tanpa dependensi.
const LAYOUTS = ['1x1', '1x2', '1x3', '1x4', '2x2', '2x3', '3x3'];

const DEFAULTS = Object.freeze({
  open: true,
  closedMessage: 'Photobooth sedang istirahat. Coba lagi nanti ya.',
  banner: { on: false, text: '', tone: 'info' },
  layouts: LAYOUTS,
  countdown: 3,
  instant: true,
  upload: true,
  live: true,
  video: true,
  connect: true,
  hiddenFrames: [],
  groups: {}
});

const str = (v, max, fb) => (typeof v === 'string' ? v.trim().slice(0, max) : fb);
const bool = (v, fb) => (typeof v === 'boolean' ? v : fb);

// Menerima input apa pun, mengembalikan pengaturan yang valid (kunci asing dibuang, nilai buruk jadi bawaan).
function sanitize(input, base = DEFAULTS) {
  const i = input && typeof input === 'object' ? input : {};
  const b = i.banner && typeof i.banner === 'object' ? i.banner : {};
  const layouts = Array.isArray(i.layouts) ? LAYOUTS.filter(k => i.layouts.includes(k)) : base.layouts;
  const cd = Number.isInteger(i.countdown) ? Math.min(10, Math.max(1, i.countdown)) : base.countdown;
  const hidden = Array.isArray(i.hiddenFrames)
    ? [...new Set(i.hiddenFrames.filter(x => typeof x === 'string' && /^[a-z0-9_-]{1,40}$/i.test(x)))].slice(0, 200)
    : base.hiddenFrames;
  const groups = {};
  if (i.groups && typeof i.groups === 'object' && !Array.isArray(i.groups)) {
    for (const [k, v] of Object.entries(i.groups).slice(0, 300)) {
      const n = typeof v === 'string' ? v.trim().slice(0, 24) : '';
      if (/^[a-z0-9_-]{1,60}$/i.test(k) && n && n !== '__new__') groups[k] = n;
    }
  } else if (i.groups === undefined) Object.assign(groups, base.groups);
  return {
    open: bool(i.open, base.open),
    closedMessage: str(i.closedMessage, 200, base.closedMessage) || DEFAULTS.closedMessage,
    banner: {
      on: bool(b.on, base.banner.on),
      text: str(b.text, 160, base.banner.text),
      tone: ['info', 'warn'].includes(b.tone) ? b.tone : base.banner.tone
    },
    layouts: layouts.length ? layouts : [...base.layouts],
    countdown: cd,
    instant: bool(i.instant, base.instant),
    upload: bool(i.upload, base.upload),
    live: bool(i.live, base.live),
    video: bool(i.video, base.video),
    connect: bool(i.connect, base.connect),
    hiddenFrames: hidden,
    groups
  };
}

const WIB = 7 * 3600e3; // statistik harian dihitung dalam WIB
const dayKey = t => new Date(t + WIB).toISOString().slice(0, 10);

// rows: [{at, frame, layout, files}] -> ringkasan untuk dasbor
function aggregate(rows, now = Date.now()) {
  const days = [];
  for (let k = 29; k >= 0; k--) days.push({ d: dayKey(now - k * 86400e3), n: 0, files: 0 });
  const idx = new Map(days.map((x, i) => [x.d, i]));
  const frames = new Map(), layouts = new Map();
  let today = days[29].d, week = 0, month = 0, todayN = 0;
  for (const r of rows) {
    const t = Date.parse(r.at);
    if (!Number.isFinite(t)) continue;
    const k = idx.get(dayKey(t));
    if (k === undefined) continue;
    days[k].n++; days[k].files += Number(r.files) || 0;
    month++; if (k >= 23) week++; if (days[k].d === today) todayN++;
    if (r.frame) frames.set(r.frame, (frames.get(r.frame) || 0) + 1);
    if (r.layout) layouts.set(r.layout, (layouts.get(r.layout) || 0) + 1);
  }
  const top = m => [...m].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, n]) => ({ name, n }));
  return {
    days, today: todayN, week, month, frames: top(frames), layouts: top(layouts),
    recent: [...rows].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 12)
  };
}

const cleanLog = b => {
  b = b && typeof b === 'object' ? b : {};
  const frame = typeof b.frame === 'string' ? b.frame.trim().slice(0, 40) : null;
  const layout = LAYOUTS.includes(b.layout) ? b.layout : null;
  const files = Number.isInteger(b.files) ? Math.min(100, Math.max(0, b.files)) : 1;
  return { frame: frame || null, layout, files };
};

// Bagian pengaturan yang aman dibaca publik (semuanya memang dipakai halaman pengunjung).
const publicView = s => sanitize(s);

module.exports = { LAYOUTS, DEFAULTS, sanitize, aggregate, cleanLog, publicView, dayKey };
