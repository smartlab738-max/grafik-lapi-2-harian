# Hasil Pengujian — 26 November 2026

## Yang benar-benar diuji

1. Validasi sintaks JavaScript (`node --check`) — **lulus**.
2. Browser Chromium headless dengan HTML asli serta database historis, **Cloudflare API dimock/diisolasi**, bukan menulis langsung ke GitHub — **lulus** untuk memuat dashboard, tab Analisis, dan 3 level navigasi klik.
3. Grafik bulanan menampilkan bulan yang ada, klik bulan menampilkan hari, klik hari menampilkan 24 baris interval — **lulus**.
4. Kustomisasi judul grafik, pembaruan SVG, ekspor SVG yang memuat judul — **lulus**.
5. Ekspor grafik PNG/PDF dan sumber data XLSX lewat browser — **lulus**, file diverifikasi terbentuk dan berukuran nonnol.
6. Editor pembacaan jam 24:00: satu pembacaan dinaikkan +10 kWh → total hari yang teramati berubah dari 895,96 menjadi 905,96 kWh; riwayat koreksi tercatat — **lulus**, dalam draf pengujian, bukan data asli.
7. Import file `Rekap Laporan Mingguan Listrik (2)(2).xlsx` yang sama dengan sumber rekap: tidak ditemukan operasi impor baru untuk mode aman (**0 perubahan**) — **lulus**. Hal ini menunjukkan tidak terjadi duplikasi pada dataset pengujian.
8. Uji rumus sintetik terpisah dengan 7 pemeriksaan (durasi tepat 1 jam, jeda lebih dari 1 jam tidak dibagi, pembacaan 24:00/00:00 duplikat ditangani, meter turun ditandai, agregasi hari/bulan, override manual, konversi MWh ke kWh) — **lulus**.
9. JavaScript browser tidak memunculkan error console `pageerror` pada skenario pengujian utama — **lulus**.

## Audit data sumber

- File Excel unggahan terakhir memiliki **17 sheet** dan SHA-256 yang sama dengan salinan Excel historis di paket.
- Database hasil rekap paket berisi **15 panel**, **333 tanggal** yang mempunyai pembacaan, dan **72.366 nilai angka per jam**.
- Sekitar **380 sel** mempunyai nilai berbeda antara Excel dan database historis sebelumnya; daftar audit masih tersedia, tidak ditimpa otomatis.
- Total konsumsi pada grafik bisa sangat besar bila sumber memiliki kesalahan angka. Lonjakan yang mencurigakan diberi penanda dan harus dikoreksi setelah verifikasi; nilai historis tidak dihapus otomatis.

## Yang belum diverifikasi / batasan

- **Belum** melakukan write sungguhan ke repository GitHub live; Cloudflare Worker dan Secret belum diverifikasi terhadap akun pengguna pada pengujian ini. Auto Save harus diuji setelah deployment dengan login dan commit baru.
- Belum ada pengujian terotomasi menyeluruh untuk seluruh kombinasi browser/tablet/smartphone dan data sumber tahun mendatang; lakukan pemeriksaan lapangan sebelum dipakai untuk pelaporan biaya resmi.
- Jika terjadi rollover/reset meter, pemakaian tidak dapat direkonstruksi otomatis tanpa nilai rollover atau dokumentasi penggantian meter.
- Angka yang salah baca dari Excel tetap memerlukan audit manual; tidak ada algoritme yang dapat menggantikan sumber ukur sebenarnya.
