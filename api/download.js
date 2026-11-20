const getDb = require('./_lib/db');
const { fail } = require('./_lib/auth');
const { cleanLog } = require('./_lib/settings');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan' });
  try {
    const { frame, layout, files } = cleanLog(req.body);
    let r = await getDb().rpc('log_download', { p_frame: frame, p_layout: layout, p_files: files });
    if (r.error) r = await getDb().rpc('increment_downloads'); // belum migrasi: tetap hitung total
    if (r.error) throw r.error;
    res.json({ ok: true });
  } catch (e) { fail(res, e); }
};
