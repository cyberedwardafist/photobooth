const getDb = require('../../_lib/db');
const { requireAdmin, uuid, snapshot, fail } = require('../../_lib/auth');

module.exports = async (req, res) => {
  if (!['PATCH', 'DELETE'].includes(req.method)) return res.status(405).json({ error: 'Metode tidak diizinkan' });
  if (!requireAdmin(req, res)) return;
  const id = req.query.id;
  if (!uuid(id)) return res.status(400).json({ error: 'ID template tidak valid' });
  try {
    const db = getDb();
    const r = req.method === 'PATCH'
      ? await db.from('templates').update({ active: !!(req.body || {}).active }).eq('id', id)
      : await db.from('templates').delete().eq('id', id);
    if (r.error) throw r.error;
    res.json(await snapshot());
  } catch (e) { fail(res, e); }
};
