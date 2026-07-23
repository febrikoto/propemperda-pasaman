# PANDUAN PEMBARUAN APLIKASI SIPROPER (Versi Terbaru)

Berikut adalah panduan dan rincian fitur-fitur terbaru yang telah ditambahkan ke dalam aplikasi PROPemperda. Panduan ini dapat digunakan sebagai referensi bagi pengguna (OPD, Admin Hukum, maupun Super Admin) untuk memahami penyesuaian fungsionalitas yang ada.

---

## 1. Untuk Pengguna OPD (Pemrakarsa)

### A. Tampilan Form "Tambah Usulan" Lebih Ringkas
- **Perubahan:** Ketika Anda mengisi form "Tambah Usulan" dan memilih Sifat Regulasi **"Baru"**, maka kolom yang menanyakan tentang *Nomor dan Judul Peraturan Lama* akan **disembunyikan secara otomatis**.
- **Panduan:** Kolom tersebut hanya akan muncul jika Anda memilih sifat regulasi "Perubahan" atau "Pencabutan". Ini dibuat agar form lebih ringkas dan tidak membingungkan.
- **Tombol Submit:** Tombol simpan kini telah diubah namanya menjadi **"Submit Usulan"** dengan logo pesawat kertas *(send)* agar lebih menegaskan bahwa data dikirim ke Bagian Hukum.

### B. Dasbor Statistik yang Lebih Informatif
- Dasbor pada halaman utama sekarang tidak hanya menampilkan jumlah draft, namun sudah mencakup 5 indikator proses yang lebih komprehensif, yaitu:
  1. **Usulan OPD:** Total seluruh dokumen Anda.
  2. **Diproses:** Jumlah usulan yang saat ini sedang dalam tahapan legislasi (mulai dari verifikasi hingga penetapan).
  3. **Disetujui:** Usulan yang telah selesai disahkan menjadi Perda/Perkada.
  4. **Perlu Perbaikan:** Usulan yang dikembalikan oleh Bagian Hukum dan membutuhkan revisi Anda.
  5. **Ditolak:** Usulan yang tidak dapat dilanjutkan prosesnya.

---

## 2. Untuk Admin Bagian Hukum (Verifikator)

### A. Penambahan Status "Ditolak"
- **Perubahan:** Saat memperbarui tahapan progres regulasi (tombol Update Status), Admin Hukum kini memiliki opsi untuk memilih **"Usulan Ditolak"** di bagian akhir.
- **Panduan:** Jika suatu usulan dinilai tidak memenuhi syarat dan tidak dapat dilanjutkan meskipun sudah direvisi, Anda bisa memilih status ini. Riwayat usulan tersebut akan ditandai dengan warna merah (ditolak).

### B. Fitur Kirim Notifikasi WhatsApp Otomatis
- **Perubahan:** Setelah Anda selesai memperbarui status tahapan suatu usulan, layar notifikasi (*Berhasil*) akan memunculkan tombol hijau bertuliskan **"Kirim Notifikasi WA"**.
- **Panduan:** 
  - Jika Anda mengklik tombol tersebut, sistem akan mengarahkan Anda ke aplikasi WhatsApp Web/Desktop.
  - Pesan teks akan terbuat otomatis (menyebutkan nama OPD, judul rancangan, dan status terbarunya) yang ditujukan ke nomor WA PIC instansi tersebut.
  - Anda cukup menekan tombol Kirim (*Send*) di WhatsApp.

---

## 3. Untuk Super Admin

### A. Penyesuaian Akses Menu
- **Menu Tambah Usulan Dihilangkan:** Mengingat peran Super Admin adalah mengelola *Master Data*, memantau *Log*, dan menjaga sistem, maka tombol dan menu "Tambah Usulan" kini dihilangkan dari tampilan Super Admin. Pengajuan hanya boleh dilakukan melalui akun OPD.

### B. Perbaikan Visibilitas Data Usulan
- **Perubahan:** Kini Super Admin dapat melihat secara langsung (*real-time*) semua usulan baru yang masuk dari seluruh OPD di tabel Data Usulan tanpa ada *bug* data yang tidak muncul.

---
*Dokumen ini diterbitkan sebagai panduan pelengkap untuk perilisan versi pembaruan aplikasi PROPemperda.*
