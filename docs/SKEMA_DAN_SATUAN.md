# Struktur dan satuan data

## Lapi: `rekap-data/rekap-listrik.json`

- `schema`, `source`, `notes`, `updatedAt`: metadata.
- `panels`: array `{id,name,unit,sourceSheets}`; satuan default panel hanya fallback.
- `readings[YYYY-MM-DD][panelId]`: `{r:[[jam,nilai],...], unit:"KWH|MWH|GWH", src, unreadable}`. Jam 0 sampai 24 mengikuti header asli Excel; jam 24 adalah titik penutup hari, *bukan* pembacaan fiktif.
- `snapshots[YYYY-MM][panelId]`: daftar arsip mingguan dengan tanggal tetapi tanpa jam yang dapat dipercaya. Tidak dimasukkan sebagai pembacaan jam.
- `overrides[date][panelId]`: koreksi kWh manual dari sistem lama.
- `editHistory`: array tindakan tambahan dari editor baru, `{at,date,panelId,h,before,after,action}`.
- `chartSettings`: konfigurasi grafik judul/sumbu dari versi lama.
- `engineeringChartSettings[panelId][view]`: pengaturan grafik lanjutan.

**Satuan:** nilai mentah disimpan apa adanya sesuai `rec.unit`. Saat konsumsi perlu kWh, gunakan selisih stand meter × faktor: KWH=1, MWH=1.000, GWH=1.000.000. Jangan menjumlah nilai meter kumulatif. Negatif/reset/rollover tidak boleh otomatis dianggap konsumsi; data ditandai untuk audit. Perubahan satuan antarperiode hanya dinormalisasi secara visual bila faktor benar-benar diketahui; data JSON asli tidak dimodifikasi.

**Kelengkapan:** blank ≠ nol. Tidak ada faktor untuk `UNKNOWN`. Meter turun/kemungkinan reset tidak otomatis dihapus. Statistik dashboard baru menyajikan *subtotal teramati* dan tidak mengisi periode kosong.

## BMS Hormon: `bms-hormon/bms-data/YYYY-MM.json`

- `schema`, `month`, `updatedAt`.
- `panels[panelCode][YYYY-MM-DD HH:MM:SS] = [Vavg, Iavg, Ptot, Edel, Freq, PF]`.
- Parameter dari ZIP BMS: Vavg (V), Iavg (A), Ptot (daya; periksa unit sumber sebelum menggunakan), Edel (energi; periksa unit sumber), Freq (Hz), PF (tanpa satuan).
- 13 panel BMS berbeda dari 15 panel Lapi. Jangan mengasumsikan `Edel` setara persis dengan stand meter Lapi atau menggabungkannya tanpa pemetaan dan validasi sensor.
- Halaman BMS asli mempertahankan workflow impor PDF dan penyimpanan GitHub ke repository Hormon-Oktober yang berbeda. Konfigurasi Worker Lapi TIDAK otomatis mengamankan penulisan BMS.

## Pseudocode validasi konsumsi

```
value_a = pembacaan pada t1
value_b = pembacaan pada t2
jika t1/t2 valid, satuan diketahui, nilai_b >= nilai_a dan tidak terindikasi reset:
    konsumsi_teramati_kWh = (nilai_b - nilai_a) * faktor_satuan
lainnya:
    status = perlu_verifikasi; konsumsi = null
```
