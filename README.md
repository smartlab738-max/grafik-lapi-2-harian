# Grafik Lapi 2 — Monitoring Engineering dan Analisis Bertingkat

Silakan baca [MULAI-DI-SINI.md](MULAI-DI-SINI.md) untuk instalasi aman.

Fitur baru: Analisis Bulan → Hari → Jam, ekspor laporan sumber, edit pembacaan langsung ke Database Listrik, judul/sumbu editable dan disertakan ke ekspor grafik. Semua fitur sebelumnya tetap ada.

Perhitungan, risiko data parsial, dan status pengujian dijelaskan di [docs/ANALISIS_BERTINGKAT_DAN_RUMUS.md](docs/ANALISIS_BERTINGKAT_DAN_RUMUS.md) dan [docs/HASIL_UJI_ANALISIS_2026-11-26.md](docs/HASIL_UJI_ANALISIS_2026-11-26.md).

**Penting:** Paket FULL berisi database historis, bukan salinan live terbaru. Simpan backup dan jangan menimpa database repository GitHub yang sudah aktif. Token GitHub tidak disertakan di paket.

---

## Dokumentasi versi sebelumnya

# Grafik Lapi 2 — Engineering Energy Monitoring (25 November 2026)

## Isi paket

- `index.html` — dashboard utama **pengembangan tambahan dari source Lapi yang sudah ada**, bukan prototype baru.
- `excel-reader.js` — pembaca XLSX dari browser, 17 sheet dan pencocokan panel.
- `rekap-data/rekap-listrik.json` — database gabungan dengan 72.366 pembacaan dan 220 arsip mingguan; **SALINAN, bukan database GitHub live.**
- `sources/Rekap_Laporan_Mingguan_Listrik_asli.xlsx` — Excel sumber asli untuk audit.
- `AUDIT-380-SEL-BERBEDA.csv`, `audit-perbedaan-excel.json`, `REKAP-SEMUA-JAM.csv` — audit dan salinan rekap.
- `bms-hormon/` — dashboard BMS Hormon-Oktober beserta tiga JSON bulanan yang terdapat dalam ZIP terbaru. Ini dataset **BERBEDA** dari meter Lapi; tidak digabung ke penghitungan kWh Lapi.
- `worker/worker.js`, `worker/wrangler.toml` — backend Cloudflare Worker dengan PAT disimpan sebagai server secret, bukan pada website.
- `docs/` — dokumentasi pengguna, skema, keamanan, pengujian dan deploy.
- `dev/` — kode patch dan salinan HTML Lapi sebelum perubahan, untuk audit/rollback.

## Mulai secara lokal

1. Ekstrak ZIP. Jalankan `python -m http.server 8000` di folder hasil ekstraksi.
2. Buka `http://localhost:8000`. File HTML tidak dapat membaca JSON dengan baik lewat `file://`.
3. Pilih Dashboard Overview, Database Listrik, Hourly Trend Analysis, Continuous Electrical Trend atau menu lainnya.
4. Semua pembacaan lokal dapat dilihat, difilter, dan diekspor tanpa login. Edit disimpan ke draf browser.
5. Agar menyimpan permanen online, konfigurasikan Cloudflare Worker dan login editor satu kali seperti panduan `docs/DEPLOY_DAN_PENYIMPANAN.md`.

## Keselamatan database aktif

**JANGAN** menimpa `rekap-data/rekap-listrik.json` di GitHub dengan salinan ZIP tanpa membandingkannya. Kode baru dapat diunggah tanpa database JSON. Kemudian impor Excel ke database live menggunakan mode `Isi pembacaan yang masih kosong`, periksa konflik, lalu simpan memakai backend aman. Backup JSON live dahulu.

## Status pengujian

UI dan impor Excel diuji pada headless Chromium melalui halaman terisolasi; editor perubahan, tab analisis, ekspor CSV/XLSX/SVG/JPG/PNG/PDF diuji. Worker diuji dengan permintaan GitHub yang **di-mock**, bukan kredensial atau repository sungguhan. Tidak ada deployment ke GitHub/Cloudflare yang dilakukan. Baca `docs/HASIL_PENGUJIAN.md` untuk batasan spesifik.
