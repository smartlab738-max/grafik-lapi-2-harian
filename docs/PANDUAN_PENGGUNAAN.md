# Panduan penggunaan dashboard

### Filter panel dan periode
Atur Tahun, Bulan, dan Panel pada bagian atas. Tab Daily/Monthly menggunakan filter ini. Data setiap jam tersimpan pada objek `readings` dan memiliki sumber Excel serta satuan asli per tanggal-panel.

### Tab utama
1. **Dashboard Overview**: ringkasan stand meter terakhir, subtotal konsumsi *teramati* (kWh), kelengkapan dan indikator anomali. Jangan gunakan subtotal parsial sebagai konsumsi resmi tanpa verifikasi.
2. **Database Listrik**: semua pembacaan per jam sebagai baris independen; filter tanggal, panel, jam, teks, status; urutkan tanggal/nilai; ubah sel nilai lalu klik di luar sel; tambah data lewat tombol; hapus disertai konfirmasi. Riwayat koreksi mencatat tindakan dari editor ini.
3. **Daily Consumption**: grafik konsumsi harian lama (dipertahankan), dengan mode batang/garis dan koreksi harian.
4. **Hourly Trend Analysis**: dua mode stand meter asli dan selisih kWh antarjam. Jam 24:00 adalah titik penutup menurut Excel dan kronologis berarti awal hari berikutnya. Bandingkan sampai lima tanggal.
5. **Continuous Electrical Trend**: meter kumulatif lintas hari; pilih bulan/tahun/semua, jangan samakan dengan konsumsi harian. **Arsip mingguan tanpa jam tidak dibuat menjadi titik jam palsu**.
6. **Weekly Analysis**: agregasi dari selisih meter harian nonnegatif yang teramati; minggu parsial diberi tanda.
7. **Monthly Analysis**: grafik bulanan lama dari `monthly()`, dilengkapi status cakupan.
8. **Data Comparison**: perbandingan dua panel dan rentang waktu; satuan energi dinormalisasi ke kWh **hanya untuk grafik** bila faktor sumber diketahui.
9. **Import & Export Data**: buka pembaca Excel, backup JSON, restore JSON menjadi draf, unduh CSV/XLSX penuh.
10. **Chart Settings**: atur judul, subtitle, label, legenda, warna, dimensi, skala, grid, titik, watermark; preview langsung; klik Terapkan untuk menyimpan draf, lalu sinkronisasi melalui Worker.
11. **Tabel Semua Jam (Lama)** dan **Pengaturan Data (Lama)**: fitur per 25 kolom dan editing asal **tetap tersedia**.
12. **BMS Hormon**: membuka halaman BMS asli (berbeda dataset).

### Editing dan audit
Nilai hasil impor tidak boleh dianggap nol jika kosong. Data anomali tidak dibuang otomatis. Menghapus pembacaan perlu konfirmasi. Histori `editHistory` mencatat editor Database Listrik (hingga 5.000 perubahan terakhir); perubahan yang dibuat melalui editor lama tidak otomatis membuat rekaman detail yang sama. Backup sebelum koreksi besar.

### Penyimpanan
Draf lokal tersimpan sementara di browser. Jika Worker terhubung, sesi editor aktif, dan tidak ada konflik basis data, draf dijadwalkan disimpan otomatis **15 detik sesudah perubahan terakhir**; tombol Simpan dapat dipakai kapan saja. Bila offline/gagal, draf dipertahankan dan status kegagalan ditampilkan. Jangan anggap perubahan permanen online sampai status sukses muncul.

### Unduhan
Buka Chart Settings → pilih grafik dan format PNG (3×), JPG (3×), SVG, PDF berbasis gambar, CSV, atau Excel XLSX. Judul, subtitle, label sumbu, periode, legenda dan watermark dikomposisikan menjadi bagian file. Download XLSX database penuh dapat berukuran besar (sekitar 35 MB sebelum kompresi karena generator ZIP tanpa kompresi); CSV lebih ringan.

### Light/dark
Dapat diubah di Chart Settings dan pilihan disimpan pada browser yang sama. Karena dasar dashboard lama berwarna terang, tema gelap pada sebagian komponen lama belum sepenuhnya konsisten.
