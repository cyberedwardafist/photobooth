const getDb = require('./_lib/db');
const { fail } = require('./_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak diizinkan' });
  try {
    const { error } = await getDb().rpc('increment_downloads');
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) { fail(res, e); }
};
