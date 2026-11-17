const { same, configured, makeToken } = require('../_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan' });
  if (!configured()) return res.status(500).json({ error: 'Server belum dikonfigurasi (ADMIN_PASS, SESSION_SECRET)' });
  const { user = '', pass = '' } = req.body || {};
  const okUser = same(user, process.env.ADMIN_USER || 'admin');
  const okPass = same(pass, process.env.ADMIN_PASS);
  if (okUser && okPass) {
    res.setHeader('Set-Cookie', `pb_admin=${makeToken()}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`);
    return res.json({ ok: true });
  }
  await new Promise(r => setTimeout(r, 800)); // jeda tetap untuk memperlambat tebak sandi
  res.status(401).json({ error: 'Nama pengguna atau kata sandi salah' });
};
