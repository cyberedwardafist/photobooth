const getDb = require('./_lib/db');
const { sanitize, publicView, DEFAULTS } = require('./_lib/settings');

// Publik. Kalau tabel belum ada atau database gagal, situs tetap jalan dengan pengaturan bawaan.
module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Metode tidak diizinkan' });
  res.setHeader('Cache-Control', 'no-store');
  try {
    const { data, error } = await getDb().from('app_settings').select('value').eq('key', 'site').maybeSingle();
    if (error) throw error;
    res.json(publicView(sanitize(data && data.value)));
  } catch (e) { res.json({ ...DEFAULTS }); }
};
