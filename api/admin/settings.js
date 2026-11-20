const getDb = require('../_lib/db');
const { requireAdmin, snapshot, fail } = require('../_lib/auth');
const { sanitize } = require('../_lib/settings');

module.exports = async (req, res) => {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Metode tidak diizinkan' });
  if (!requireAdmin(req, res)) return;
  try {
    const value = sanitize(req.body);
    const { error } = await getDb().from('app_settings').upsert({ key: 'site', value, updated_at: new Date().toISOString() });
    if (error) return res.status(500).json({ error: 'Tabel pengaturan belum ada. Jalankan npm run migrate atau tempel supabase/schema.sql di SQL Editor.' });
    res.json(await snapshot(req));
  } catch (e) { fail(res, e); }
};
