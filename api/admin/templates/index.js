const getDb = require('../../_lib/db');
const { requireAdmin, hex, snapshot, fail } = require('../../_lib/auth');
const FrameSpec = require('../../../public/framespec.js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan' });
  if (!requireAdmin(req, res)) return;
  const body = req.body || {};
  let rows;
  if (Array.isArray(body.frames)) {
    // Unggah frame buatan AI (berkas JSON). Divalidasi ulang di server.
    try {
      rows = FrameSpec.clean(body.frames).map(spec => ({ name: spec.name, bg: Array.isArray(spec.bg) ? spec.bg[0] : spec.bg, ink: spec.ink, spec }));
    } catch (e) { return res.status(400).json({ error: e.message }); }
  } else {
    const { name, bg, ink } = body;
    if (!name || String(name).length > 30 || !hex(bg) || !hex(ink))
      return res.status(400).json({ error: 'Nama (maks 30 huruf) dan dua warna heks wajib diisi' });
    rows = [{ name: String(name).trim(), bg, ink }];
  }
  try {
    const { error } = await getDb().from('templates').insert(rows);
    if (error) {
      if (/spec/i.test(error.message || '')) return res.status(400).json({ error: 'Kolom frame kustom belum ada. Jalankan npm run migrate dulu.' });
      throw error;
    }
    res.json(await snapshot(req));
  } catch (e) { fail(res, e); }
};
