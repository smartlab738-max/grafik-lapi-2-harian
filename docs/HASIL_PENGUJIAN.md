# Hasil pengujian aktual · 25 November 2026

## Audit Excel dan database
- File XLSX asli dibaca langsung oleh pembaca yang tersedia pada website menggunakan Chromium. **17 sheet dan 15 panel** dikenali; 4.316 kombinasi tanggal-panel pada hasil parsing, dengan 178 entri snapshot mingguan pada parse terbaru.
- Semua angka Excel yang dikenali dicocokkan ke database JSON: **66.053 sel numerik sama**, **0 sel numerik Excel yang belum ada di database**, **380 sel numerik berbeda**. Nilai lama sengaja dipertahankan dan daftar 380 konflik tersedia pada `AUDIT-380-SEL-BERBEDA.csv`.
- Parser melaporkan **778 entri nonnumerik**, **86 blok tanggal tidak dikenali**, dan 0 duplikat internal yang bertabrakan saat penguraian. Angka nonnumerik/sel tanggal ambigu tidak diubah menjadi nol atau angka fiktif. Perlu tinjauan Engineering atas sumber asli.
- Database gabungan yang dikemas mencakup **72.366 pembacaan per jam**, **4.600 tanggal-panel**, **333 tanggal dengan data**, **220 titik arsip mingguan** dan 15 panel. Database berasal dari snapshot percakapan, bukan hasil sinkronisasi live terkini.

## UI dan editor
- Pada Chromium headless melalui DOM HTML terisolasi, dashboard memuat data JSON dan menampilkan 8 kartu ringkasan.
- Tab Database Listrik menampilkan 110 baris per halaman, 72.366 data cocok tanpa filter, pengeditan sebuah angka menghasilkan histori 1 perubahan dan pesan penyimpanan draf.
- Navigasi serta grafik Hourly Trend, Continuous, Weekly, Comparison, Import/Export dan Chart Settings berjalan tanpa uncaught JavaScript error pada skenario yang diuji.
- Fitur backup/restore, deteksi setiap ragam anomali, dark mode pada semua browser, dan beban multi-user BELUM diuji menyeluruh.

## Ekspor grafik dan Excel
- Grafik diekspor sebagai SVG, PNG, JPG dan PDF; signature file dan ukuran dibaca; PDF valid versi 1.4 dan 1 halaman setelah verifikasi menggunakan pdfinfo dan renderer PDF.
- Excel (.xlsx) hasil ekspor full database lolos pemeriksaan struktur ZIP (`testzip() == None`) dan XML berisi 72.367 baris termasuk header. File ekspor memiliki ZIP tanpa kompresi sehingga sekitar 35 MB.
- Header, sumbu, label dan konten diekspor sebagai satu dokumen, bukan hanya label HTML. Pengujian lintas Windows Excel/LibreOffice dan printer fisik belum dilakukan.

## Backend
- Worker diuji dalam lingkungan Node dengan MOCK GitHub API: health HTTP 200; login salah 401; login benar 200; load database 200; simpan 200; konflik SHA 409; origin yang dilarang 403.
- **Tidak diuji:** deploy Cloudflare, pengiriman data ke GitHub live, autentikasi token asli, simultaneous editing antarperangkat. Tidak ada pengubahan repository pengguna.

## Modul BMS Hormon
- Tiga JSON bulan September–November 2026 serta source `index.html` BMS dari ZIP terlampir disalin tanpa mengubah algoritma BMS awal. Struktur sumber dilihat: 13 panel dan enam parameter per timestamp.
- Operasi impor PDF, penyimpanan GitHub BMS dan kompatibilitas data lapangan secara lengkap belum diuji dalam paket gabungan ini.

## Keterbatasan transparan
- Chart Settings didukung pada grafik Lapi; modul BMS masih memakai kontrol asalnya.
- Beberapa toolbar lama dan halaman lama tetap beroperasi dengan aturan ekspor/konfigurasi masing-masing. Pengaturan lanjutan paling konsisten melalui Chart Settings.
- Pemakaian mingguan dan Overview bertanda *teramati*, bukan konsumsi penuh yang ditaksir dari jam hilang.
- Kewajiban pemeriksaan reset meter, rollover dan anomali tetap pada pengguna; aplikasi tidak boleh memperbaiki pembacaan otomatis.
