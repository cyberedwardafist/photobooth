# photobooth

Situs statis di `public/`, API di `api/` (Vercel Functions), data di Supabase.

## 1. Supabase
1. Buat project di supabase.com.
2. Dari terminal: salin `.env.example` ke `.env.local`, isi `DATABASE_URL` (Project Settings, Database, Connection string URI), lalu jalankan `npm install` dan `npm run migrate`. Ini membuat tabel `templates`, `app_stats`, `app_settings` (pengaturan situs), dan `download_log` (statistik unduhan), mengunci RLS, dan mengisi 5 template awal. Jalankan lagi setelah memperbarui kode supaya tabel baru ikut dibuat; sebelum itu panel admin tetap jalan tetapi pengaturan dan statistik belum bisa disimpan. Aman dijalankan berulang. Alternatif tanpa terminal: tempel isi `supabase/schema.sql` di SQL Editor lalu Run.
3. Project Settings, API: salin **Project URL** dan kunci **service_role**. Kunci ini rahasia, jangan dimasukkan ke file di `public/`.

## 2. Vercel
1. Unggah folder ini ke repo GitHub (`.env` dan `node_modules` sudah diabaikan lewat `.gitignore`).
2. Vercel, Add New Project, pilih repo itu. Framework: Other. Kosongkan Build Command dan Output Directory.
3. Isi Environment Variables (lihat `.env.example`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_USER`, `ADMIN_PASS`, `SESSION_SECRET` (minimal 32 karakter acak).
4. Deploy. Halaman admin ada di `/admin`.

## Panel admin
Dasbor satu halaman dengan lima menu (`#ringkasan`, `#template`, `#alur`, `#statistik`, `#sistem`):
- **Ringkasan**: tombol buka/tutup situs, alur empat langkah pengunjung dengan pengaturannya saat ini, angka unduhan, grafik 14 hari, dan daftar yang perlu perhatian.
- **Template dan frame**: tambah, ubah, sembunyikan, dan hapus template warna (dengan pratinjau dan cek kontras). Frame bawaan (`frames.js`) bisa disembunyikan dari pengunjung.
- **Alur dan pengaturan**: mode tutup + pesannya, pengumuman, tata letak yang tersedia, lama hitung mundur, tombol Langsung, unggah foto, live foto, unduhan video, dan Connect. Disimpan sekali lewat bilah "Simpan perubahan".
- **Statistik**: unduhan per hari (WIB), frame dan tata letak terpopuler, unduhan terbaru. Dicatat di `download_log` setiap kali pengunjung menekan Unduh.
- **Sistem**: pemeriksaan database dan environment, sisa waktu sesi, pintasan halaman, dan unduh cadangan JSON.

Pengaturan dibaca halaman pengunjung lewat `GET /api/settings` (`public/common.js`). Kalau gagal dimuat, situs memakai pengaturan bawaan. Perlu diingat: mode tutup dan sembunyikan frame dijalankan di sisi peramban, jadi ini pengatur alur, bukan pengaman akses.

## Uji lokal
`npm install`, salin `.env.example` ke `.env.local` dan isi, lalu `npx vercel dev`.
Tanpa Supabase: `ADMIN_PASS=sandi npm start` menjalankan `server.js` (data di `data.json`, termasuk pengaturan dan log unduhan).

## Catatan
- Sesi admin berupa cookie bertanda tangan (8 jam), tanpa penyimpanan di server.
- Login gagal diberi jeda 0,8 detik. Untuk pembatasan percobaan yang lebih ketat, pasang rate limit di Vercel (Firewall).
- Foto tidak pernah dikirim ke server. Yang dikirim hanya hitungan unduhan.

## Alur halaman
1. `foto` ambil atau unggah foto.
2. `adjust` atur tiap foto sendiri-sendiri: filter, kecerahan, kontras, saturasi (tanpa frame). Ada tombol "Terapkan ke semua foto".
3. `edit` pilih frame: template dan warna latar.
4. `unduh` galeri semua hasil: frame diam (PNG), frame video, foto satuan (PNG), animasi foto (video), live foto (video). Klik satu hasil untuk memilih apa saja yang diunduh; tiap pilihan jadi file terpisah (tanpa zip).

Pengaturan per foto disimpan di `sessionStorage` (`adj`), dan otomatis di-reset kalau fotonya diambil ulang.

## Live foto
Saat memotret lewat kamera, `foto.js` merekam klip ±2 detik (320x240, 12 fps) per slot dan menyimpannya di IndexedDB (database `pb`). Foto yang diunggah tidak punya klip, jadi tidak ada live foto/frame video untuknya. Video dibuat di peramban dengan MediaRecorder (MP4 bila didukung, kalau tidak WebM), direkam real-time sehingga tab harus tetap terbuka.

## Penjaga keluar
Kalau sudah ada foto, menekan tautan keluar dari alur (Home, logo, Masuk admin) menampilkan konfirmasi; memilih "Ya, keluar" menghapus foto dan klip live (mulai dari awal). Pindah antar langkah (foto, atur foto, frame, unduh) tidak diganggu. Halaman Template (etalase frame) setara dengan Home, jadi pindah ke sana dari tengah alur juga dianggap keluar. Menutup tab, memuat ulang, atau tombol back peramban memakai peringatan bawaan peramban (`beforeunload`), yang teksnya tidak bisa diubah. Logikanya ada di akhir `public/common.js`.

## Library template
`template` adalah etalase: semua frame tampil dengan foto contoh. Klik satu frame -> pilihan disimpan (`state.frame`) lalu langsung ke `foto`; di langkah Pilih frame, frame itu sudah terpilih dan bisa diganti. Tombol "Mulai memotret" di Home dan tombol "tanpa memilih frame" menghapus pilihan itu, jadi alur langsung tidak membawa frame lama.

## Logo
`public/logo-mark.svg` (bilik saja, dipakai di navigasi dan sebagai favicon) dan `public/logo.svg` (ilustrasi penuh) berasal dari desain "Ilustrasi Photobooth". Animasinya (lampu berkedip, strip melayang) ikut di dalam SVG dan berhenti otomatis kalau pengguna memilih `prefers-reduced-motion`.

## Beranda
`index` + `home.js`: hero dengan ilustrasi bilik, deretan frame berjalan (digambar dari `FRAMES` dengan foto contoh, jadi frame baru otomatis ikut tampil), cara kerja, fitur, dan ajakan penutup. Jumlah frame di ringkasan hero juga otomatis dari `FRAMES.length`. Animasi mati bila pengguna memilih kurangi gerakan.

## Connect
`connect` adalah cangkang ruang: buat ruang (kode acak 6 digit, tidak bisa kembar) atau gabung dengan kode itu. Koneksi WebRTC (PeerJS, server sinyal publik via CDN) dibuat sekali di halaman ini dan tidak putus selama alur, karena halaman foto, atur foto, frame, dan unduh dimuat di dalam `<iframe id="app">`. Halaman di dalam iframe memakai `PBR` (di `common.js`) untuk bicara ke ruang: `pbSync(patch)` menyinkronkan state (`pb_state`) dan `pbEv(nama,data)` mengirim kejadian sesaat (hitung mundur, pilihan latar).
- Foto: host yang mengatur (tata letak, ambil foto, ulang, kosongkan, latar). Foto hasil host dikirim ke tamu. Kamera semua peserta digabung dalam satu frame (orang dipotong dengan MediaPipe selfie segmenter, dari CDN). Tamu tidak punya live foto (klip video hanya direkam di perangkat host).
- Atur foto dan Frame: host dan tamu sama-sama bisa mengubah, perubahan muncul di kedua sisi. Hanya host yang bisa lanjut/kembali, tamu otomatis ikut pindah halaman. Di dua langkah ini kamera semua peserta tampil berdampingan di atas halaman.
- Unduh: sendiri-sendiri.


## Grup frame dan frame buatan AI

- **Grup**: di admin > Frame, tiap kartu punya pilihan Grup (frame bawaan, template warna, dan frame kustom semuanya bisa). Grup jadi filter di halaman frame pengunjung. "Ubah nama grup" memindahkan semua anggotanya sekaligus. Perubahan disimpan lewat tombol Simpan (disimpan di pengaturan situs, kunci `groups`).
- **Unggah frame**: admin > Unggah. Salin perintah untuk AI, minta frame yang kamu mau, simpan jawabannya sebagai `.json`, lalu unggah. Format dan batasnya ada di `public/framespec.js` (satu sumber untuk peramban dan server; server memeriksa ulang). Frame kustom disimpan di tabel `templates` kolom `spec`.
- **Migrasi**: jalankan `npm run migrate` sekali agar kolom `spec` ada (idempoten). Mode lokal (`data.json`) tidak perlu migrasi.
