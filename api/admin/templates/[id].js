const getDb = require('../../_lib/db');
const { requireAdmin, uuid, hex, snapshot, fail } = require('../../_lib/auth');

module.exports = async (req, res) => {
  if (!['PATCH', 'DELETE'].includes(req.method)) return res.status(405).json({ error: 'Metode tidak diizinkan' });
  if (!requireAdmin(req, res)) return;
  const id = req.query.id;
  if (!uuid(id)) return res.status(400).json({ error: 'ID template tidak valid' });
  try {
    const db = getDb();
    let r;
    if (req.method === 'PATCH') {
      const b = req.body || {}, patch = {};
      if ('active' in b) patch.active = !!b.active;
      if ('name' in b) {
        const n = String(b.name).trim();
        if (!n || n.length > 30) return res.status(400).json({ error: 'Nama wajib diisi, maksimal 30 huruf' });
        patch.name = n;
      }
      for (const k of ['bg', 'ink']) if (k in b) {
        if (!hex(b[k])) return res.status(400).json({ error: 'Warna harus berformat #RRGGBB' });
        patch[k] = b[k];
      }
      if (!Object.keys(patch).length) return res.status(400).json({ error: 'Tidak ada yang diubah' });
      r = await db.from('templates').update(patch).eq('id', id);
    } else r = await db.from('templates').delete().eq('id', id);
    if (r.error) throw r.error;
    res.json(await snapshot(req));
  } catch (e) { fail(res, e); }
};
