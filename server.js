const express = require('express'), crypto = require('crypto'), fs = require('fs'), path = require('path');
const { sanitize, aggregate, cleanLog, DEFAULTS } = require('./api/_lib/settings');
const app = express(), DB = path.join(__dirname, 'data.json'), PORT = process.env.PORT || 3000;
const USER = process.env.ADMIN_USER || 'admin';
const PASS = process.env.ADMIN_PASS || crypto.randomBytes(6).toString('hex');
if (!process.env.ADMIN_PASS) console.log(`Kata sandi admin sementara: ${PASS} (atur ADMIN_PASS agar tetap)`);

const DEFAULTS_T = [
  { id: 't1', name: 'Langit Pagi', bg: '#DBE2F8', ink: '#1E2D5A', active: true },
  { id: 't2', name: 'Krem Stasiun', bg: '#F5E6D5', ink: '#1E2D5A', active: true },
  { id: 't3', name: 'Sakura', bg: '#E6A5C3', ink: '#3B1630', active: true },
  { id: 't4', name: 'Laut Biru', bg: '#83C2F8', ink: '#10285A', active: true },
  { id: 't5', name: 'Gerbong Teal', bg: '#57A9B4', ink: '#0B2F35', active: true }
];
const load = () => { let d; try { d = JSON.parse(fs.readFileSync(DB, 'utf8')); } catch { d = { downloads: 0, templates: DEFAULTS_T }; } d.settings = sanitize(d.settings); d.log = d.log || []; return d; };
const save = d => fs.writeFileSync(DB, JSON.stringify(d, null, 2));
const hex = v => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
const same = (a, b) => { const x = crypto.createHash('sha256').update(a).digest(), y = crypto.createHash('sha256').update(b).digest(); return crypto.timingSafeEqual(x, y); };

const view = (req, d) => ({
  downloads: d.downloads, templates: d.templates, settings: d.settings,
  stats: aggregate(d.log), migrated: { settings: true, log: true },
  session: { expires: sessions.get(cookie(req)) + 8 * 3600e3 },
  env: { supabase: false, adminPass: !!process.env.ADMIN_PASS, secretLen: 0, runtime: 'Lokal (data.json)' }
});
const sessions = new Map(), fails = new Map();
const cookie = req => (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('pb_admin='))?.slice(9);
const auth = (req, res, next) => sessions.has(cookie(req)) ? next() : res.status(401).json({ error: 'Belum masuk' });

app.use(express.json({ limit: '10kb' }));

app.get('/api/templates', (req, res) => res.json(load().templates.filter(t => t.active)));
app.get('/api/settings', (req, res) => { res.setHeader('Cache-Control', 'no-store'); res.json(load().settings); });
app.post('/api/download', (req, res) => {
  const d = load(), l = cleanLog(req.body); d.downloads++;
  d.log.push({ at: new Date().toISOString(), ...l }); d.log = d.log.slice(-5000); save(d); res.json({ ok: true });
});

app.post('/api/admin/login', (req, res) => {
  const ip = req.ip, f = fails.get(ip) || { n: 0, t: 0 };
  if (f.n >= 5 && Date.now() - f.t < 60000) return res.status(429).json({ error: 'Terlalu banyak percobaan. Coba lagi satu menit lagi.' });
  const { user = '', pass = '' } = req.body || {};
  if (same(String(user), USER) && same(String(pass), PASS)) {
    fails.delete(ip);
    const token = crypto.randomBytes(24).toString('hex'); sessions.set(token, Date.now());
    res.setHeader('Set-Cookie', `pb_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`);
    return res.json({ ok: true });
  }
  fails.set(ip, { n: f.n + 1, t: Date.now() });
  res.status(401).json({ error: 'Nama pengguna atau kata sandi salah' });
});
app.post('/api/admin/logout', (req, res) => { sessions.delete(cookie(req)); res.setHeader('Set-Cookie', 'pb_admin=; Max-Age=0; Path=/'); res.json({ ok: true }); });
app.get('/api/admin/data', auth, (req, res) => res.json(view(req, load())));
app.put('/api/admin/settings', auth, (req, res) => { const d = load(); d.settings = sanitize(req.body); save(d); res.json(view(req, d)); });
app.post('/api/admin/templates', auth, (req, res) => {
  const { name, bg, ink } = req.body || {};
  if (!name || String(name).length > 30 || !hex(bg) || !hex(ink)) return res.status(400).json({ error: 'Nama (maks 30 huruf) dan dua warna heks wajib diisi' });
  const d = load(); d.templates.push({ id: 't' + Date.now(), name: String(name), bg, ink, active: true }); save(d); res.json(view(req, d));
});
app.patch('/api/admin/templates/:id', auth, (req, res) => {
  const d = load(), t = d.templates.find(x => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'Template tidak ditemukan' });
  const b = req.body || {};
  if ('active' in b) t.active = !!b.active;
  if ('name' in b) { const n = String(b.name).trim(); if (!n || n.length > 30) return res.status(400).json({ error: 'Nama wajib diisi, maksimal 30 huruf' }); t.name = n; }
  for (const k of ['bg', 'ink']) if (k in b) { if (!hex(b[k])) return res.status(400).json({ error: 'Warna harus berformat #RRGGBB' }); t[k] = b[k]; }
  save(d); res.json(view(req, d));
});
app.delete('/api/admin/templates/:id', auth, (req, res) => {
  const d = load(); d.templates = d.templates.filter(x => x.id !== req.params.id); save(d); res.json(view(req, d));
});

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.listen(PORT, () => console.log(`photobooth berjalan di http://localhost:${PORT}`));
