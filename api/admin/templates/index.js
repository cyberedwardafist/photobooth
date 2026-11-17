const getDb = require('../../_lib/db');
const { requireAdmin, hex, snapshot, fail } = require('../../_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan' });
  if (!requireAdmin(req, res)) return;
  const { name, bg, ink } = req.body || {};
  if (!name || String(name).length > 30 || !hex(bg) || !hex(ink))
    return res.status(400).json({ error: 'Nama (maks 30 huruf) dan dua warna heks wajib diisi' });
  try {
    const { error } = await getDb().from('templates').insert({ name: String(name).trim(), bg, ink });
    if (error) throw error;
    res.json(await snapshot());
  } catch (e) { fail(res, e); }
};
