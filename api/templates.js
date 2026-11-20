const getDb = require('./_lib/db');
const { fail } = require('./_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Metode tidak diizinkan' });
  try {
    const { data, error } = await getDb().from('templates').select('id,name,bg,ink,active,spec').eq('active', true).order('created_at', { ascending: true });
    if (error) throw error;
    res.setHeader('Cache-Control', 'no-store');
    res.json(data);
  } catch (e) { fail(res, e); }
};
