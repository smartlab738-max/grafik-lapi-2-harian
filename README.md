# Grafik Lapi 2 — Grafik Kontinu + Tren Per Jam 1 Hari + Rekap Excel
Tanggal rilis: 25 November 2026
Repository tujuan: smartlab738-max/grafik-lapi-2-harian

## Isi dan tujuan
- `index.html`: website dashboard, mencakup tab Grafik, **Grafik Kontinu**, **Tren Per Jam (1 Hari)**, Semua Data per Jam, dan Pengaturan Data.
- `excel-reader.js`: pembaca XLSX lokal 17 sheet; ikut membaca angka yang tersimpan sebagai teks numerik; menyimpan `unit` per tanggal-panel dari Excel.
- `rekap-data/rekap-listrik.json`: hasil **gabungan aman** Excel terbaru dengan database awal yang tersedia di percakapan, BUKAN data yang sudah otomatis disinkronkan dari repository GitHub yang aktif.
- `AUDIT-380-SEL-BERBEDA.csv`: perbedaan angka per jam Excel dan database lama yang perlu diperiksa (nilai database lama dipertahankan).
- `audit-perbedaan-excel.json`: catatan teknis dan ringkasan perbedaan.
- `REKAP-SEMUA-JAM.csv`: rekap lengkap yang dapat dibuka di Excel; 25 kolom jam untuk setiap tanggal-panel.
- `worker/`: kode Cloudflare Worker untuk penyimpanan GitHub tanpa input PAT di browser (perlu konfigurasi sendiri). Jangan simpan PAT di file website atau repository.

## Hasil rekap
- 17 sheet, 15 panel listrik cocok
- 4.316 tanggal-panel dari Excel (termasuk tanggal-panel PUTR 3 yang semula dilewati karena beda label unit)
- 4.298 tambahan pembacaan jam; total gabungan 72.366 nilai pada 4.600 tanggal-panel
- 380 nilai per jam berbeda: tetap memakai database lama, rincian ada di CSV audit
- 220 titik arsip mingguan; tidak dibuat menjadi 25 jam palsu
- Terdapat 86 blok tanggal yang tidak jelas/invalid, dan sisa catatan nonnumerik tidak dikonversi jadi nol.

## Grafik Kontinu
1. Pada menu utama pilih **Grafik Kontinu**.
2. Pilih **panel** dan **tahun/bulan** pada filter umum.
3. Pilih rentang bulan/tahun/semua dan tampilan **semua jam** atau **titik terakhir per hari**.
4. Edit **Judul grafik**, **Label sumbu X**, **Label sumbu Y**, dan warna. Tekan Tab/klik keluar dari kolom untuk menerapkan.
5. Pilih **PNG Grafik + Judul**. Teks judul dan label sumbu memang bagian dari gambar, bukan hanya teks di atas grafik.
6. **CSV Seluruh Titik** berisi waktu, stand meter asli, satuan asli Excel, serta satuan/angka yang dipakai grafik.
7. Jeda lebih dari 48 jam (jam) atau 7 hari (modus harian), serta meter turun, ditampilkan sebagai garis terputus; bukan nol.

Catatan: grafik menunjukkan **nilai register/stand meter** kumulatif lintas hari, bukan grafik pemakaian kWh sehari. Unit asli meter tiap baris dipertahankan. Bila titik antarperiode memiliki unit berbeda, angka hanya dinormalisasi **untuk skala grafik** menggunakan kWh/MWh/GWh, sedangkan JSON dan CSV menyimpan nilai asli.

## Penting: cara pemasangan yang tidak menghapus data GitHub terbaru
**Jangan upload `rekap-data/rekap-listrik.json` langsung menimpa versi GitHub tanpa mencadangkan dan membandingkan data live terlebih dahulu.** Database gabungan dibuat dari salinan yang tersedia dalam file yang diunggah, bukan salinan GitHub saat ini. Jika sudah ada koreksi baru di GitHub, menimpa file tersebut bisa menghilangkannya.

Opsi A — Aman untuk website saat ini:
1. Upload hanya `index.html` dan `excel-reader.js` dari paket `UPDATE-KODE`.
2. Buka website yang sudah memuat data GitHub terbaru.
3. Gunakan **Import Excel** untuk memilih Excel (2)(1).xlsx, kebijakan **Isi pembacaan yang masih kosong**.
4. Tinjau daftar konflik sebelum menerapkan; jika benar klik **Terapkan ke Draf**.
5. Setelah memeriksa semua jam, simpan melalui Cloudflare Worker yang sebelumnya dikonfigurasi. Tanpa Worker, unduh backup JSON lokal untuk digunakan secara manual.

Opsi B — Jika ingin memakai file hasil rekap siap pakai:
1. Download file JSON gabungan dari paket FULL; bandingkan lebih dulu dengan file database live.
2. Cadangkan file live dari GitHub sebelum mengunggah JSON gabungan pada path sama.
3. Upload `index.html`, `excel-reader.js`, dan `rekap-data/rekap-listrik.json` ke path yang sesuai. Jangan mengubah `worker/` di GitHub kecuali Anda memang menggunakannya sebagai proyek Cloudflare.

## Keamanan penyimpanan
Backend yang aman belum diterapkan otomatis ke akun Anda. Untuk penyimpanan tanpa PAT berulang kali, deploy Cloudflare Worker dan set `GITHUB_TOKEN` baru, `EDITOR_PASSWORD`, `SESSION_SECRET` di secret server. PAT yang sebelumnya diposting di chat harus dicabut/dirotasi. File website dan semua ZIP ini **tidak memuat token**.

## Unit
PUTR 3: data harian menggunakan MWH sesuai Excel terbaru, bukan GWH seperti label lama. PUTR 2: satuan arsip awal MWH, sedangkan pembacaan 2026 GWH; metadata satuan tersimpan per catatan. Untuk panel SDP Probiotik OLD/SAG, sebagian sumber tidak memiliki satuan yang valid, sehingga grafik mengabaikan titik yang tidak dapat dipastikan satuannya daripada menebak.


## Tambahan: Tren Per Jam (1 Hari) — 25 November 2026
- Buka menu **Tren Per Jam (1 Hari)**, pilih tanggal (dalam bulan dari filter utama) dan panel listrik.
- Mode **Stand Meter** menampilkan 25 nilai asli jam 00:00–24:00 dari Excel dengan satuan pada catatan tanggal-panel tersebut (KWH/MWH/GWH). Nilai tidak diubah secara permanen.
- Mode **Pemakaian Antarjam** menampilkan `(stand jam H - stand jam H-1) × faktor satuan` dalam kWh, **hanya** jika kedua jam berturutan memiliki nilai numerik. Meter turun ditandai, bukan dipaksa menjadi pemakaian negatif atau nol.
- Grafik hanya menghubungkan jam bersebelahan yang memiliki data. Warna merah pada mode stand meter mengindikasikan nilai turun; lonjakan diperingatkan di tabel dan tooltip.
- Bisa mengubah judul, label sumbu X, label sumbu Y, dan warna; judul, tanggal, label sumbu, dan satuan tercetak langsung di PNG.
- PNG dan CSV hanya memuat panel dan tanggal terpilih. CSV menyertakan seluruh 25 jam, termasuk jam kosong untuk audit.
- Klik **Edit** pada baris jam atau **Edit Jam Hari Ini** untuk membuka editor stand meter jam tersebut pada tab Pengaturan Data. Perubahan masuk draf dan tetap perlu disimpan melalui backend Worker (bukan GitHub PAT di browser).
- Tidak ada perubahan pada database rekap: seluruh 72.366 angka per jam dan audit 380 perbedaan dari paket sebelumnya tetap dipertahankan.
