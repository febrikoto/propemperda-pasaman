# PROPemperda Kabupaten Pasaman
**Portal Program Pembentukan Peraturan Daerah & Sistem Autentikasi Berbasis Peran (RBAC)**  
*Bagian Hukum Sekretariat Daerah Kabupaten Pasaman, Sumatera Barat*

---

## 🌟 Tentang Aplikasi
**PROPemperda Kabupaten Pasaman** adalah aplikasi web berbasis modern yang dirancang untuk mempercepat, memonitor, dan mengelola usulan pembentukan regulasi daerah (**Peraturan Daerah / Perda** dan **Peraturan Bupati / Perkada**) dari seluruh Perangkat Daerah (OPD) di lingkungan Pemerintah Kabupaten Pasaman secara transparan dan akuntabel.

Aplikasi ini mengadopsi arsitektur **Role-Based Access Control (RBAC)** di mana setiap pengguna memiliki hak akses yang disesuaikan dengan peran dan fungsionalitas kerjanya dalam alur legislasi regulasi daerah.

---

## 🚀 Fitur Unggulan
1. **Autentikasi Berbasis Peran (RBAC) 4 Level:**
   - **Super Admin (`admin`)**: Kontrol penuh atas seluruh fitur, konfigurasi master OPD, manajemen pengguna, dan audit log sistem.
   - **Admin Bagian Hukum (`hukum_admin`)**: Memverifikasi berkas usulan, mengupdate tahapan legislasi (1 hingga 8), memberikan instruksi revisi, serta mencetak laporan rekapitulasi.
   - **Operator OPD (`dinkes_op`, `pupr_op`, dll)**: Mendaftarkan usulan rancangan regulasi, mengunggah naskah akademik/kajian teknis, memperbaiki catatan revisi, serta memonitor progres regulasi instansinya.
   - **Pimpinan / Bupati / Sekda (`pimpinan`)**: Akses *read-only* eksekutif untuk memantau dasbor statistik, kurva perkembangan legislasi, dan laporan rekapitulasi.

2. **Dasbor Statistik & Visualisasi Interaktif (ApexCharts):**
   - Proporsi usulan berdasarkan jenis regulasi (Perda vs Perkada).
   - Diagram batang perkembangan tahapan legislasi (Draft hingga Selesai).
   - Grafik distribusi rancangan per Perangkat Daerah pemrakarsa.

3. **Monitoring Alur 8 Tahapan Legislasi (Progressive Stepper):**
   - **Tahap 1:** Draft Diajukan
   - **Tahap 2:** Diverifikasi Bagian Hukum
   - **Tahap 3:** Perlu Perbaikan (Revisi Dokumen)
   - **Tahap 4:** Harmonisasi (Kanwil Kemenkumham Sumbar)
   - **Tahap 5:** Pembahasan Bersama (Pansus DPRD / Tim Pakar)
   - **Tahap 6:** Persetujuan Bersama & Evaluasi Gubernur
   - **Tahap 7:** Penetapan & Pengundangan (Tanda Tangan Bupati)
   - **Tahap 8:** Selesai Disahkan (Berita Daerah / Lembaran Daerah)

4. **Laporan Rekapitulasi & Ekspor Dokumen:**
   - Pencetakan laporan siap pakai (*Print-Ready Style*) dengan kop surat resmi Pemerintah Kabupaten Pasaman.
   - Ekspor tabel data rekap ke format **CSV / Excel** dalam sekali klik.

5. **Dukungan Hybrid & Serverless Backend (Google Apps Script):**
   - **Modus Lokal (Demo Storage):** Beroperasi langsung dari browser tanpa perlu instalasi server rumit menggunakan `localStorage` dengan *seed data* realis Kabupaten Pasaman.
   - **Modus Cloud (Google Apps Script + Google Drive):** Dilengkapi dengan skrip backend (`Code.gs`) yang siap disebarkan sebagai API *serverless* terhubung ke Google Sheets & Google Drive.

---

## 🔐 Akun Demo (Untuk Pengujian)
Semua akun demo di bawah ini menggunakan kata sandi (password) yang sama: **`admin123`**

| Username | Nama Lengkap / Jabatan | Peran (Role) | Hak Akses |
| :--- | :--- | :--- | :--- |
| **`admin`** | Administrator Utama | Super Admin | Akses penuh (Create, Read, Update, Delete, Master Data, Audit Log) |
| **`hukum_admin`** | Hendra Syahputra, S.H. | Bagian Hukum | Verifikasi usulan, update status tahapan 1-8, master data, laporan |
| **`dinkes_op`** | drq. Rini Wulandari | Operator OPD | Mendaftarkan usulan Dinkes, edit berkas, monitor progres |
| **`pimpinan`** | H. Sabar AS, S.Ag., M.Si. | Pimpinan / Sekda | Melihat dasbor, memantau alur progres, cetak laporan rekap |

---

## 🛠️ Cara Menjalankan Aplikasi Secara Lokal
Karena aplikasi dibangun menggunakan standar web murni (HTML5, Vanilla CSS, JS ES6, Bootstrap 5.3), Anda dapat menjalankannya dengan sangat mudah:
1. Buka folder `e:\40. Web\appsekda`.
2. Klik ganda pada file **`index.html`** untuk membukanya di peramban (Google Chrome, Firefox, atau Microsoft Edge).
3. Anda juga dapat menggunakan ekstensi **Live Server** di VS Code untuk pengalaman pembaruan waktu nyata.

---

## ☁️ Panduan Integrasi Google Apps Script (GAS)
Untuk menghubungkan aplikasi ini dengan Google Sheets sebagai database online:
1. Buka **Google Drive**, lalu buat Spreadsheet baru dengan nama **`DB_PROPemperda_Pasaman`**.
2. Pilih menu **Ekstensi > Apps Script**.
3. Buka file **`Code.gs`** di folder proyek ini, salin seluruh isinya, dan tempelkan ke editor Google Apps Script.
4. Klik tombol **Terapkan (Deploy) > Deployment baru**.
5. Pilih jenis deployment: **Aplikasi Web (Web App)**.
6. Pada kolom *Siapa yang memiliki akses (Who has access)*, pilih **Siapa saja (Anyone)**.
7. Klik **Deploy** dan salin **URL Web App** yang dihasilkan.
8. Masuk ke aplikasi PROPemperda > Buka menu **Developer Hub (GAS)** > Tempelkan URL tersebut untuk melakukan pengujian ping server.

---

## 📁 Struktur Berkas Proyek
```text
e:\40. Web\appsekda\
├── index.html     # Struktur UI lengkap (8 Halaman Navigasi, Modal RBAC, Dropzone, Toast)
├── style.css      # Desain premium, Glassmorphism Auth, Dark Mode, Stepper, Print Styles
├── app.js         # Logika RBAC, CRUD DataTables, ApexCharts, Stepper Engine, Ekspor CSV
├── Code.gs        # Backend Google Apps Script (doGet, doPost, Drive Upload, Audit Trail)
└── README.md      # Dokumentasi sistem & panduan penggunaan
```

---
*Dikembangkan oleh Tim Digitalisasi Bagian Hukum Sekretariat Daerah Kabupaten Pasaman &copy; 2026*
