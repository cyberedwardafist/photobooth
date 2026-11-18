// Menjalankan supabase/schema.sql ke database Supabase. Aman dijalankan berulang (skema idempoten).
const fs = require('fs');
const path = require('path');
let Client;
try {
  ({ Client } = require('pg'));
} catch {
  console.error('Paket "pg" belum terpasang. Jalankan: npm install');
  process.exit(1);
}

for (const f of ['.env.local', '.env']) {
  const p = path.join(__dirname, '..', f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL belum diisi. Ambil dari Supabase: Project Settings > Database > Connection string, lalu taruh di .env.local');
  process.exit(1);
}

const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'schema.sql'), 'utf8');

(async () => {
  const db = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await db.connect();
    await db.query(sql); // satu transaksi: gagal berarti tidak ada yang berubah
    const t = await db.query('select count(*)::int as n from public.templates');
    const s = await db.query("select value from public.app_stats where key = 'downloads'");
    console.log(`Migrasi selesai. Template: ${t.rows[0].n}, unduhan tercatat: ${s.rows[0] ? s.rows[0].value : 0}`);
  } catch (e) {
    console.error('Migrasi gagal:', e.message);
    process.exitCode = 1;
  } finally {
    await db.end().catch(() => {});
  }
})();
