# Panduan Engineering — Analisis Konsumsi Bulanan, Harian, dan per Jam

## 1. Alur investigasi

1. Buka tab **Analisis Bulan → Hari → Jam**. Pilih tahun dan panel.
2. Pada grafik **Bulanan**, perhatikan perubahan jumlah energi dan **jumlah jam tercatat**. Jangan membandingkan secara mutlak bulan dengan cakupan data jauh berbeda.
3. Klik bulan: grafik **Harian** menampilkan total dari interval satu-jam yang berhasil diukur, dan tanda parsial/anomali.
4. Klik hari: grafik **Jam** berisi paling banyak 24 interval (00:00–01:00 sampai 23:00–24:00) yang mempunyai pasangan pembacaan valid.
5. Untuk memeriksa suatu lonjakan, klik batang / **Edit Meter** dan perbaiki **angka stand meter asli** pada editor; rekap di level atas akan dihitung ulang.

## 2. Struktur database dan sumber data

- `rekap-data/rekap-listrik.json` menyimpan `panels`, `readings[YYYY-MM-DD][panelId].r` dalam pasangan `[jam, angka_meter]`, `unit`, `src`, data arsip mingguan, dan koreksi manual.
- Jam `24:00` dianggap penutup hari dan setara dengan `00:00` hari sesudahnya **untuk penempatan timestamp**, tanpa menciptakan pembacaan tambahan.
- Jika terdapat dua nilai berbeda untuk timestamp yang sama, interval yang menyentuh waktu tersebut ditandai bermasalah.
- Input dan impor lama tetap dipertahankan. Audit pembacaan menggunakan `editHistory`, dan pengaturan baru berada pada `drillChartSettings` per panel dan level.

## 3. Rumus konsumsi berdasarkan stand meter kumulatif

Jika kedua pembacaan adalah **meter energi aktif kumulatif** yang sama, memiliki satuan teridentifikasi, dan berjeda tepat 1 jam:

    E_jam(kWh) = M_akhir(kWh) - M_awal(kWh)

Untuk satuan awal lain, normalisasi kedua pembacaan dahulu:

    M_kWh = M_asli × F(satuan)

    F(kWh)=1, F(MWh)=1.000, F(GWh)=1.000.000

    E_interval = M_kWh(t+1 jam) - M_kWh(t)

Jika E interval negatif, meter mungkin reset, rollover, atau salah ketik. Sistem **menandai dan tidak menambahkan selisih negatif** ke konsumsi sampai diselesaikan Engineering. Interval dengan jeda lebih dari satu jam tidak dibagi secara otomatis menjadi konsumsi per jam yang tidak pernah dicatat.

    E_hari_teramati = SUM(E_interval_valid pada tanggal itu)
    E_bulan_teramati = SUM(E_hari_teramati pada bulan itu)
    E_tahun_teramati = SUM(E_bulan_teramati)

Perhatikan: data **parsial** tidak sama dengan konsumsi total aktual dalam satu hari/bulan; ia merupakan subtotal terukur. Lonjakan sangat besar ditandai untuk audit tetapi angka sumber **tetap dipertahankan** dan masuk subtotal teramati sebelum koreksi, sehingga angka belum final sampai anomali diverifikasi.

## 4. Perbandingan kenaikan

    ΔE = E_periode_saat_ini − E_periode_sebelumnya
    % Perubahan = 100 × ΔE / E_periode_sebelumnya

Persentase hanya bermakna ketika periode sebelumnya memiliki nilai positif dan **cakupan pengukuran dapat dibandingkan**. Sebagai indikator tambahan, rata-rata pemakaian per interval teramati:

    E_rata_rata_per_jam_tercatat = SUM(E_interval_valid) / N_interval_valid

Pada interval tepat 1 jam, besaran E_interval (kWh) numeriknya sama dengan **daya aktif rata-rata interval (kW)**, bukan puncak daya sesaat.

Contoh hipotetis: pukul 08:00 meter 12.500 kWh dan 09:00 meter 12.575 kWh → 75 kWh selama interval 08–09 → daya rata-rata 75 kW.

## 5. Kaidah sumbu Kartesius

- X: sumbu horizontal, rentang waktu kategorikal (bulan/tanggal/interval jam), berurutan kronologis.
- Y: sumbu vertikal, konsumsi energi kWh, angka dalam skala linear mulai nol untuk diagram batang.
- Label Y tidak boleh "kW" untuk energi kWh. kW hanya bisa diterapkan pada daya rata-rata yang dihitung dari kWh/selang waktu (jam).
- Judul/subjudul/sumbu diubah di panel atas grafik. Pengaturan disimpan dalam draf dan ditulis ke JSON GitHub setelah autentikasi/Auto Save berhasil.
- Unduhan PNG/JPG/PDF dibuat dari SVG grafik yang sudah memuat judul, subjudul, label dan satuan, bukan mengambil teks terpisah di HTML.

## 6. Audit dan pengamanan

- Dataset gabungan memuat laporan historis, tetapi ada perbedaan nilai antara Excel dan salinan database yang belum diputuskan otomatis.
- Ekspor laporan tidak menggantikan verifikasi meter lapangan. Jangan menyimpulkan kenaikan tidak normal hanya dari subtotal bulan yang cakupan intervalnya sangat berbeda.
- Jangan menaruh PAT di frontend. Gunakan Cloudflare Secret dan hak akses GitHub minimum.
- Selalu backup data sebelum mengganti database live.
