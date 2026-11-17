# photobooth

Situs statis di `public/`, API di `api/` (Vercel Functions), data di Supabase.

## 1. Supabase
1. Buat project di supabase.com.
2. SQL Editor, New query, tempel isi `supabase/schema.sql`, lalu Run. Ini membuat tabel `templates` dan `app_stats`, mengunci RLS, dan mengisi 5 template awal.
3. Project Settings, API: salin **Project URL** dan kunci **service_role**. Kunci ini rahasia, jangan dimasukkan ke file di `public/`.

## 2. Vercel
1. Unggah folder ini ke repo GitHub (`.env` dan `node_modules` sudah diabaikan lewat `.gitignore`).
2. Vercel, Add New Project, pilih repo itu. Framework: Other. Kosongkan Build Command dan Output Directory.
3. Isi Environment Variables (lihat `.env.example`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_USER`, `ADMIN_PASS`, `SESSION_SECRET` (minimal 32 karakter acak).
4. Deploy. Halaman admin ada di `/admin.html`.

## Uji lokal
`npm install`, salin `.env.example` ke `.env.local` dan isi, lalu `npx vercel dev`.

## Catatan
- Sesi admin berupa cookie bertanda tangan (8 jam), tanpa penyimpanan di server.
- Login gagal diberi jeda 0,8 detik. Untuk pembatasan percobaan yang lebih ketat, pasang rate limit di Vercel (Firewall).
- Foto tidak pernah dikirim ke server. Yang dikirim hanya hitungan unduhan.
# photobooth
