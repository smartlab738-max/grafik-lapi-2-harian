# Grafik Lapi 2 — Grafik + Raw Data

Paket ini adalah revisi dashboard Grafik-Lapi-2 dengan **Import Otomatis Excel (.xlsx)** dan **Matriks Semua Pembacaan per Jam yang Bisa Diedit**. Kode website terdiri dari `index.html` dan `excel-reader.js`. Database JSON tetap menggunakan struktur sebelumnya.

## Isi paket

- `index.html` — dashboard terbaru, dengan tab **Grafik**, **Semua Data per Jam**, **Pengaturan Data**, dan tombol **Import Excel**.
- `excel-reader.js` — pembaca XLSX lokal tanpa pustaka eksternal; membaca format laporan mingguan LAPI.
- `rekap-data/rekap-listrik.json` — SALINAN DATABASE AWAL contoh hasil ekstraksi Excel untuk instalasi yang BELUM mempunyai data di repository.
- `preview-bulanan-raw.png` dan `preview-harian-raw.png` — pratinjau tampilan.

## Perubahan pada tab Grafik

- Tata letak lebih rapi dengan sumbu X/Y berlabel, skala dari nol, garis rata-rata (untuk nilai tersedia), warna panel yang bisa dipilih, grafik garis/batang, dan tooltip pada data.
- Raw data langsung di bawah grafik (tidak perlu pindah ke tab Pengaturan Data). Grafik **Harian** memperlihatkan tanggal, stand awal/akhir, pembacaan per jam, hasil kWh, dan status. Grafik **Bulanan** memperlihatkan total, jumlah hari valid/lengkap, dan status setiap bulan; tombol **Lihat harian** berpindah ke rincian bulan yang dipilih.
- **PNG + Data** mengunduh gambar berisi grafik dan tabel, bukan hanya gambar grafik.
- **CSV / CSV Raw Data** mengunduh angka sesuai periode dan panel, termasuk rincian per jam untuk harian.
- Kartu total berubah sesuai grafik: subtotal bulanan di grafik harian, subtotal tahunan pada grafik bulanan. Status *sementara, parsial, kosong,* dan *periksa* tetap dipertahankan.

## Cara memasang di GitHub

1. Buka repository `https://github.com/smartlab738-max/Grafik-Lapi-2`.
2. Ganti `index.html` dan **tambahkan file `excel-reader.js`** di root repository. Klik **Commit changes**.
3. **Jangan menimpa `rekap-data/rekap-listrik.json` yang sudah ada di GitHub**, agar hasil edit/input terbaru tidak hilang. Gunakan file JSON dari paket ini **hanya jika file database belum ada di repository**.
4. Buka `https://smartlab738-max.github.io/Grafik-Lapi-2/` dan refresh paksa (Ctrl + Shift + R) jika masih melihat tampilan lama.

## Menyimpan perubahan data

Tab Pengaturan Data → edit angka/tambah data → Simpan ke GitHub. Dashboard menggunakan API GitHub untuk memperbarui file `rekap-data/rekap-listrik.json` dan perlu fine-grained PAT berizin Contents: Read and write untuk repository `Grafik-Lapi-2` (dimasukkan dalam sesi halaman). Jangan masukkan token ke HTML atau JSON publik.

**Batasan penting:** angka anomali tidak otomatis diperbaiki. Status sementara bukan total final dan hari tanpa nilai tidak dianggap 0. Perubahan data di dalam draf browser tidak akan tersimpan secara online sebelum tombol Simpan ke GitHub berhasil.


## Import otomatis Excel — fitur baru

1. Buka dashboard dan pilih tombol **↑ Import Excel** di bagian atas atau buka **Pengaturan Data → Import Otomatis dari Excel**.
2. Pilih file **`Rekap Laporan Mingguan Listrik (2).xlsx`** (atau versi terbaru dengan susunan sheet yang sama). Tidak perlu copy-paste nilai ke tabel.
3. Dashboard otomatis membaca sheet laporan, mencocokkan nama panel, tanggal, pembacaan **jam 00:00–24:00**, dan arsip mingguan Juli–Oktober 2025. Untuk data per jam, angka di sel nonnumerik akan diabaikan dan ditampilkan sebagai catatan saat pratinjau; tidak dipaksa menjadi nol.
4. Periksa ringkasan pratinjau dan pilih aturan import:
   - **Isi pembacaan yang masih kosong (default)** — menambahkan jam yang belum ada; nilai jam yang sudah terisi tidak diubah meskipun nilainya berbeda.
   - **Hanya tanggal-panel yang belum ada** — hanya memasukkan data untuk kombinasi tanggal + panel tanpa pembacaan yang tersimpan.
   - **Timpa pembacaan dari tanggal-panel yang sama** — memerlukan konfirmasi; mengganti stand meter pada tanggal-panel yang sama dengan yang ada pada Excel, tetapi mempertahankan koreksi kWh manual (`overrides`).
5. Buka bagian **Periksa perbedaan nilai JAM antara Excel dan website** di pratinjau jika ada konflik, lalu unduh CSV jika perlu. Pilih **✓ Terapkan ke Draf Dashboard**. Setelah impor, website otomatis membuka tab **Semua Data per Jam** untuk pemeriksaan.
6. Setelah memeriksa data, aktifkan token GitHub dan pilih **☁ Simpan ke GitHub** untuk memublikasikan perubahan dalam `rekap-data/rekap-listrik.json`. Sampai tombol simpan berhasil, perubahan hanya berupa draf lokal.

### Hal-hal penting

- **Pemilihan file harus dilakukan oleh pengguna.** Browser tidak diperbolehkan membaca file lokal yang berubah di komputer tanpa izin, sehingga sinkronisasi otomatis terus-menerus perlu sumber online (misalnya Google Sheets/Drive + backend/otomasi yang diberi izin). Fitur ini otomatis mengimpor **isi file setelah Anda memilih file**.
- File hanya dibaca di browser. Tidak ada server pemroses Excel, tidak memakai CDN, dan tidak mengunggah Excel ke pihak ketiga. Proses simpan JSON tetap memakai GitHub API dengan token sesi.
- Pembacaan laporan **2025 Nov–2026 Nov** diimpor sebagai angka meter per jam; **Juli–Oktober 2025** dibaca sebagai arsip mingguan. Tabel harian Oktober 2025 yang hanya memiliki satu angka per tanggal tidak ditafsirkan menjadi 24 jam pemakaian.
- Label tanggal kosong atau salah bulan/tahun di sumber dilewati, bukan ditebak. Nama panel yang tidak bisa dicocokkan juga dilewati. Mode impor menunjukkan ringkasan catatan dan ketidakcocokan satuan.
- Pada contoh Excel, **PUTR 3 Utility Warehouse Level 10.000** tertulis `MWH` pada sejumlah sheet, sedangkan database dashboard menetapkan `GWH`; pembacaan dengan ketidaksesuaian satuan ini **tidak diimpor** sampai Anda memverifikasi satuannya. Ini mencegah kesalahan faktor konversi 1.000x.
- Excel dapat berisi nilai tidak numerik, penurunan meter, dan lonjakan. Semua harus ditinjau sebelum menjadikan grafik sebagai angka laporan resmi.
- Jangan menimpa file database JSON yang saat ini digunakan GitHub! Gunakan hanya **dua file kode** (`index.html` dan `excel-reader.js`) untuk pembaruan aplikasi.


## BARU — Matriks semua pembacaan jam (00:00–24:00)

Buka tab **▦ Semua Data per Jam** di samping tab Grafik. Ini **bukan** tabel meter awal–akhir; satu baris berisi semua 25 kolom jam dari satu tanggal dan satu panel, termasuk kolom tanggal, nama panel, satuan, jumlah pembacaan, total kWh, kondisi dan asal sheet.

- **Semua tahun / semua bulan / semua panel**: tersedia pilihan independen dari periode grafik. Semua catatan yang sudah tersimpan dalam JSON dapat dicari lintas tahun dan panel.
- **Pencarian**: berdasarkan tanggal, nama panel, atau nama sheet asal.
- **Deteksi anomali**: nilai stand meter yang menurun dibanding jam sebelumnya diwarnai merah; lonjakan relatif terhadap laju positif tipikal hari yang sama diwarnai jingga. Hasil penandaan adalah heuristik untuk diperiksa, **bukan koreksi otomatis atau kepastian kesalahan**.
- **Edit semua jam**: klik tombol Edit Semua Jam, kemudian perbaiki angka langsung di kolom 00:00–24:00. Sel kosong bermakna tidak ada angka pembacaan (bukan nol); mengosongkan angka dalam mode edit berarti menghapus pembacaan tersebut. Perubahan terpantau di pratinjau, total kWh diperbarui saat rendering berikutnya.
- **Aman**: semua koreksi disimpan sebagai draf lokal sampai tombol Simpan ke GitHub berhasil; tidak ada nilai Excel yang secara otomatis memaksa nilai existing saat mode impor aman.
- **Ekspor CSV Semua Jam**: mengekspor seluruh data yang cocok dengan filter, bukan hanya 40 baris pada halaman aktif.
- **Arsip mingguan**: pembacaan 2025 yang hanya ada pada hari tertentu tetap ditampilkan sebagai tabel terpisah, dan juga bisa diedit bila mode edit aktif. Sistem **tidak mengisi jam yang tidak ada di sumber**.
- **Pembanding Excel vs website**: pratinjau impor menampilkan perbedaan angka pada tanggal + panel + jam yang sama dan menyediakan unduhan CSV semua perbedaan. Mode aman tidak menimpa nilai yang berbeda; opsi Timpa akan mengganti nilai untuk tanggal-panel terkait dan membutuhkan persetujuan Anda.

### Hasil pengujian dengan file yang Anda lampirkan

- Database pada ZIP awal: **4.322 kombinasi tanggal-panel**, **68.068 nilai meter per jam**, dan **220 entri arsip mingguan**.
- File XLSX: 17 sheet terdeteksi, 15 panel cocok, 3.998 kombinasi tanggal-panel dari sumber dan 178 entri mingguan yang dikenali pembaca.
- Bila menggunakan mode impor aman pada salinan database di ZIP: **392 operasi penambahan**, termasuk **3.907 nilai jam tambahan**. Hasil draf: **4.576 kombinasi tanggal-panel** dan **71.975 nilai jam**.
- Pembanding impor menemukan **358 nilai per jam yang berbeda** dari database existing. Dalam mode aman, nilai yang sudah ada **dipertahankan** sampai Anda memutuskan menggantinya.
- Terdapat 829 sel teks/nonnumerik, 88 blok tanggal tidak valid, dan 13 peringatan ketidakcocokan satuan. Nilai-nilai bermasalah tidak ditebak menjadi angka; periksa terlebih dahulu.

**PENTING: Angka hasil pengujian berlaku pada SALINAN database yang ada di ZIP dan file Excel yang dilampirkan, bukan bukti bahwa GitHub live saat ini memiliki angka tersebut. Paket pembaruan TIDAK mengubah database GitHub secara otomatis.**

### File yang harus diunggah ke GitHub

Cukup unggah `index.html` dan `excel-reader.js` dari paket **UPDATE** ke root repository, kemudian buka website, pilih file Excel, cek perbedaan, terapkan ke draf, koreksi angka per jam, dan simpan ke GitHub menggunakan token **baru** yang disimpan aman saat sesi login. Jangan pernah mengunggah token ke repository. **Jangan menimpa database JSON live menggunakan salinan ZIP** karena draf terbaru mungkin sudah berubah.
