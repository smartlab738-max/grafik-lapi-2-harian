# Struktur pengembangan dan rollback

Ekstensi ditambahkan pada aplikasi Lapi sebelumnya, mempertahankan fungsi lama `drawChart`, `calculate`, `renderIntraday`, `renderContinuous`, `saveGitHub`, pembaca Excel dan tabel 25 jam. Source ekstensi ditemukan pada `dev/engineering_enhancements_source.js` dan tampilan pada `dev/engineering_sections_source.html` serta CSS pada `dev/engineering_styles_source.css`. Kode untuk deployment telah **digabung dalam `index.html`** sehingga tidak perlu langkah build tambahan.

Backup HTML sebelum pengembangan ada di `dev/index_sebelum_engineering.html`. Jika rollback dibutuhkan, cadangkan database live, upload file cadangan tersebut sebagai `index.html` bersama `excel-reader.js` yang cocok, dan jangan memodifikasi JSON tanpa verifikasi.

`bms-hormon/index.html` dan `bms-hormon/bms-data/` merupakan sumber independen dari ZIP `Hormon-Oktober-main.zip`. Tidak ada migrasi otomatis BMS ke format JSON Lapi.
