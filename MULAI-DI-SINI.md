# GRAFIK LAPI 2 · ANALISIS ENERGI BERTINGKAT

## Buka dari awal

Website: https://smartlab738-max.github.io/grafik-lapi-2-harian/
Repository: https://github.com/smartlab738-max/grafik-lapi-2-harian
Backend yang sudah Anda buat: https://hormon-oktober.smartlab738.workers.dev

**Fitur terbaru**: tab pertama "Analisis Bulan → Hari → Jam". Gunakan filter panel dan tahun di atas, klik bulan (grafik atau tombol Lihat rincian), lalu klik tanggal. Grafik ke-3 memperlihatkan pemakaian *tiap interval 1 jam*, bukan stand meter kumulatif.

**Koreksi**: klik Edit Meter pada rincian jam → Database Listrik menampilkan nilai meter untuk tanggal/jam itu. Edit angkanya; grafik dan rekap diperbarui seketika. Jam belum tercatat dapat dipilih lewat tombol Isi Jam untuk memasukkan nilai *stand meter* asli.

**Impor**: klik Import Excel. Pilih file XLSX dan cek pratinjau. Gunakan "Isi pembacaan yang masih kosong" untuk menghindari penimpaan koreksi. Upload file yang sama lagi tidak membuat baris ganda.

**Ekspor**: pilih PNG, JPG, SVG, PDF, CSV, atau Excel pada tab analisis. Judul, subjudul, sumbu X/Y menjadi bagian SVG yang diekspor, sehingga ikut pada gambar dan PDF.

## Upload yang aman

JANGAN menimpa database GitHub jika Anda sudah punya koreksi terbaru! Backup `rekap-data/rekap-listrik.json` dari repository live lebih dahulu.

1. Untuk repository yang sudah aktif, gunakan paket `UPDATE-KODE` dan upload **hanya** `index.html`, `excel-reader.js`, `storage-config.js` ke folder utama repository.
2. Klik Commit changes. Tunggu GitHub Pages selesai memperbarui situs, lalu reload paksa (Ctrl+F5).
3. Pastikan Cloudflare Worker versi LAPI sudah dipasang, bukan versi Hormon-Oktober lama. Endpoint `/api/health` harus menunjukkan repository `smartlab738-max/grafik-lapi-2-harian` dan path `rekap-data/rekap-listrik.json`.
4. Pastikan `GITHUB_TOKEN`, `EDITOR_PASSWORD`, `SESSION_SECRET` merupakan Cloudflare Secret. Token GitHub harus baru, dengan Contents read/write hanya pada repository Lapi. **Jangan menaruh token di file sumber.**
5. Login editor dalam website, buat perubahan kecil, periksa indikator Simpan dan commit GitHub sebelum menganggap Auto Save online telah berfungsi.

## Kenapa paket FULL memiliki database?

Paket FULL menyertakan database awal historis lengkap untuk instalasi baru/backup. Data di dalamnya bukan replika realtime dari commit GitHub Anda, sehingga jangan otomatis menggantikan JSON live.

Baca `docs/ANALISIS_BERTINGKAT_DAN_RUMUS.md` dan `docs/HASIL_UJI_ANALISIS_2026-11-26.md` sebelum menggunakan subtotal untuk pelaporan resmi.
