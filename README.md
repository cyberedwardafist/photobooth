# photobooth

Situs statis di `public/`, API di `api/` (Vercel Functions), data di Supabase.

## 1. Supabase
1. Buat project di supabase.com.
2. Dari terminal: salin `.env.example` ke `.env.local`, isi `DATABASE_URL` (Project Settings, Database, Connection string URI), lalu jalankan `npm install` dan `npm run migrate`. Ini membuat tabel `templates` dan `app_stats`, mengunci RLS, dan mengisi 5 template awal. Aman dijalankan berulang. Alternatif tanpa terminal: tempel isi `supabase/schema.sql` di SQL Editor lalu Run.
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

## Alur halaman
1. `foto.html` ambil atau unggah foto.
2. `adjust.html` atur tiap foto sendiri-sendiri: filter, kecerahan, kontras, saturasi (tanpa frame). Ada tombol "Terapkan ke semua foto".
3. `edit.html` pilih frame: template dan warna latar.
4. `unduh.html` galeri semua hasil: frame diam (PNG), frame video, foto satuan (PNG), animasi foto (video), live foto (video). Klik satu hasil untuk memilih apa saja yang diunduh; tiap pilihan jadi file terpisah (tanpa zip).

Pengaturan per foto disimpan di `sessionStorage` (`adj`), dan otomatis di-reset kalau fotonya diambil ulang.

## Live foto
Saat memotret lewat kamera, `foto.js` merekam klip ±2 detik (320x240, 12 fps) per slot dan menyimpannya di IndexedDB (database `pb`). Foto yang diunggah tidak punya klip, jadi tidak ada live foto/frame video untuknya. Video dibuat di peramban dengan MediaRecorder (MP4 bila didukung, kalau tidak WebM), direkam real-time sehingga tab harus tetap terbuka.
