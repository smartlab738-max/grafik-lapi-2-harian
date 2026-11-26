# Deployment, GitHub, dan penyimpanan aman

Target website Lapi: `smartlab738-max/grafik-lapi-2-harian` · database: `rekap-data/rekap-listrik.json` · branch: `main`.

## Sebelum upload
1. Buka repository GitHub target dan backup file `index.html`, `excel-reader.js`, `rekap-data/rekap-listrik.json` **dari versi live saat ini**.
2. Bandingkan salinan JSON ZIP dengan database live (termasuk koreksi yang dibuat sesudah tanggal ZIP). Jangan overwrite bila ada perbedaan.
3. Upload `index.html`, `excel-reader.js`, dan folder `bms-hormon/` jika ingin mengakses modul BMS terpisah. Upload database JSON **hanya bila Anda telah menilai hasil merge dengan live**.
4. GitHub Pages: gunakan branch `main`, folder root, kemudian hard-refresh halaman setelah deployment.

## Backend Cloudflare Worker (konfigurasi satu kali)
1. Revoke semua GitHub PAT yang pernah dibagikan di chat / tersimpan di perangkat yang tidak tepercaya.
2. Buat fine-grained PAT baru yang hanya mengizinkan repository `grafik-lapi-2-harian`, permission Contents: Read and write.
3. Buat Cloudflare Worker baru dari `worker/worker.js` (`wrangler.toml` tersedia), lalu jalankan/deploy sesuai petunjuk Cloudflare. `worker.js` bukan bagian yang harus dimuat dari browser.
4. Di Settings → Variables and Secrets Worker, tambahkan tiga SECRET: `GITHUB_TOKEN` (PAT baru), `EDITOR_PASSWORD` (kata sandi kuat), dan `SESSION_SECRET` (string acak panjang). **Jangan tulis nilainya ke ZIP/repository/HTML.**
5. Periksa `GET https://WORKER_URL/api/health` menghasilkan `ok:true`, repository dan path yang tepat, serta `configured:true`.
6. Di dashboard → Pengaturan Data (Lama) → Koneksi Simpan Aman, isi URL dasar Worker **sekali** dan klik Hubungkan. Kemudian login editor dengan kata sandi (bukan PAT). Sesi di browser berlaku maks. 30 hari.
7. Tekan Simpan ke GitHub atau gunakan simpan otomatis (jeda 15 detik setelah edit). Indikator status akan menyatakan sukses/gagal. Jika server menolak konflik 409, backup JSON draf dan jangan memaksa overwrite.

## Keamanan produksi
- Worker hanya menerima Origin `https://smartlab738-max.github.io` dan memverifikasi token sesi; simpan rahasia sebagai Cloudflare Secrets, jangan pada kode frontend.
- Validasi SHA GitHub menghindari overwrite saat database live sudah berubah, tetapi tidak melakukan merge otomatis.
- Worker contoh belum dilengkapi pembatasan percobaan login (`rate limiting`) dan Cloudflare Access/WAF; konfigurasi keamanan tambahan dianjurkan sebelum akses publik banyak pengguna.
- Hormon BMS adalah modul independen dengan sistem penyimpanan lama yang meminta PAT pada sesi browser. Jangan gunakan PAT Lapi untuk modul BMS dan jangan letakkan token pada HTML. Untuk penyimpanan BMS otomatis tanpa PAT perlu backend khusus repository `Hormon-Oktober`, belum termasuk paket ini.

## Bila tidak berhasil online
Gunakan backup JSON dari dashboard. Draf di browser tidak boleh dihapus hingga ada bukti penyimpanan. Periksa URL Worker, secret, permission GitHub dan branch. GitHub Pages adalah static hosting, tidak bisa menyimpan ke repo sendiri tanpa autentikasi backend.
