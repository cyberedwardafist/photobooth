const { requireAdmin, snapshot, fail } = require('../_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Metode tidak diizinkan' });
  if (!requireAdmin(req, res)) return;
  try { res.json(await snapshot()); } catch (e) { fail(res, e); }
};
