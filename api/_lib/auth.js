const crypto = require('crypto');
const getDb = require('./db');

const sha = v => crypto.createHash('sha256').update(v).digest();
const same = (a, b) => crypto.timingSafeEqual(sha(String(a)), sha(String(b)));
const configured = () => !!process.env.ADMIN_PASS && (process.env.SESSION_SECRET || '').length >= 16;
const sig = p => crypto.createHmac('sha256', process.env.SESSION_SECRET).update(p).digest('base64url');

// Token tanpa status di server (Vercel Functions tidak berbagi memori): kedaluwarsa + tanda tangan HMAC.
const makeToken = () => {
  const p = Buffer.from(String(Date.now() + 8 * 3600e3)).toString('base64url');
  return p + '.' + sig(p);
};
const fromCookie = req => ((req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('pb_admin=')) || '').slice(9);
const valid = tok => {
  const [p, s] = String(tok).split('.');
  if (!p || !s) return false;
  const e = sig(p);
  if (s.length !== e.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(e))) return false;
  return Number(Buffer.from(p, 'base64url').toString()) > Date.now();
};

function requireAdmin(req, res) {
  if (!configured()) { res.status(500).json({ error: 'Server belum dikonfigurasi (ADMIN_PASS, SESSION_SECRET)' }); return false; }
  if (!valid(fromCookie(req))) { res.status(401).json({ error: 'Belum masuk' }); return false; }
  return true;
}

const hex = v => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
const uuid = v => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);

async function snapshot() {
  const db = getDb();
  const [t, s] = await Promise.all([
    db.from('templates').select('*').order('created_at', { ascending: true }),
    db.from('app_stats').select('value').eq('key', 'downloads').maybeSingle()
  ]);
  if (t.error) throw t.error;
  if (s.error) throw s.error;
  return { downloads: Number((s.data && s.data.value) || 0), templates: t.data };
}

const fail = (res, e) => { console.error(e); res.status(500).json({ error: 'Gagal terhubung ke database' }); };

module.exports = { same, configured, makeToken, requireAdmin, hex, uuid, snapshot, fail };
