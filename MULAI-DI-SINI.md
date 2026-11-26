# PERBAIKAN REPOSITORY — GRAFIK LAPI 2 (26 November 2026)

**Repo yang benar:** `smartlab738-max/grafik-lapi-2-harian`  
**Branch:** `main`  
**File database:** `rekap-data/rekap-listrik.json`

Paket ini merupakan kode Lapi Engineering dari versi sebelumnya, bukan aplikasi BMS Hormon. Folder `bms-hormon/` merupakan referensi proyek independen yang tidak boleh disinkronkan dengan database Lapi.

## Mengganti Cloudflare Worker yang sudah dibuat
1. Buka Cloudflare → Workers & Pages → Worker lama Anda (namanya boleh tetap `hormon-oktober`).
2. Klik Edit Code dan **ganti seluruh kode lama** dengan isi `worker/worker.js` dari paket ini. Deploy. Jangan hanya mengganti Secret: kode lama masih mengarah ke repository Hormon.
3. Pada Settings → Variables and Secrets, pertahankan `EDITOR_PASSWORD` dan `SESSION_SECRET` bila sebelumnya sudah dibuat. Buat/revisi `GITHUB_TOKEN` menggunakan token **baru** yang hanya diberi izin Contents: Read and write untuk repo `grafik-lapi-2-harian` (jangan kirim ke chat). Pastikan semua disetel sebagai Secret.
4. Buka `https://URL-WORKER-ANDA/api/health`; seharusnya mengembalikan `repo=smartlab738-max/grafik-lapi-2-harian`, `path=rekap-data/rekap-listrik.json`, dan `configured=true`. Jika tidak cocok, Worker yang berjalan masih memakai kode lama.
5. Ubah `storage-config.js`: `window.SAFE_STORAGE_API_URL = 'https://URL-WORKER-ANDA';` (tanpa `/api/health`). Hanya URL publik Worker yang ditaruh di sini. JANGAN isi token atau password. Alternatif: masukkan alamat Worker sekali melalui pengaturan website (disimpan di browser tersebut).
6. Untuk memperbarui website yang sudah live, unggah **hanya** `index.html`, `excel-reader.js`, `storage-config.js` dari paket ini ke root repository yang benar. Backup database terlebih dulu. Jangan menimpa database GitHub aktif dengan salinan `rekap-data/rekap-listrik.json` di ZIP tanpa membandingkan perubahan terbaru.
7. Buka halaman website `https://smartlab738-max.github.io/grafik-lapi-2-harian/`, login dengan `EDITOR_PASSWORD` lalu edit nilai kecil dan pastikan indikator tersimpan serta commit GitHub bertambah.

## Isi paket
- `index.html`: dashboard Lapi Engineering lengkap, dengan autosave setelah editor login.
- `excel-reader.js`: pembaca Excel.
- `storage-config.js`: URL Worker saja (tidak berisi token).
- `worker/worker.js`: Worker Cloudflare khusus repository Lapi.
- `rekap-data/rekap-listrik.json`: data historis dari paket sebelumnya (salinan, bukan live).
- `docs/`: dokumentasi dan audit dari paket engineering sebelumnya.

## Batas verifikasi
Konfigurasi repo dan jalur diuji secara lokal. Kode Worker diuji tanpa mengakses token asli. **Kami belum mengubah atau menguji Worker/website di akun Cloudflare atau GitHub Anda**, sehingga autosave online masih memerlukan deployment pengguna.
