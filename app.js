/**
 * ============================================================================
 * PROPemperda Kabupaten Pasaman - Core Application Logic (app.js)
 * Sistem Autentikasi Berbasis Peran (RBAC) & Legislasi Daerah
 * ============================================================================
 */

// Global State Variables
let currentUser = null;
let usulanList = [];
let masterOpdList = [];
let masterUserList = [];
let auditLogs = [];
let trashList = [];
let dataTableInstance = null;
let currentMonitoringId = null;
const SPREADSHEET_ID = "1xDGpXMdDCDeHHCHNpZH-81Ie4Vo_KavZUTX92V26DIU";
const SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1xDGpXMdDCDeHHCHNpZH-81Ie4Vo_KavZUTX92V26DIU/edit?gid=0#gid=0";

// ============================================================================
// 1. INITIALIZATION & DATA SEEDING
// ============================================================================

document.addEventListener("DOMContentLoaded", function () {
  initSeedData();
  initTheme();
  initScrollListeners();
  syncWithGoogleSheets();

  // Check if session exists in localStorage
  const savedSession = localStorage.getItem("propemperda_session");
  if (savedSession) {
    try {
      currentUser = JSON.parse(savedSession);
      showMainLayout();
    } catch (e) {
      showAuthPage();
    }
  } else {
    showAuthPage();
  }
});

/**
 * Inisialisasi Data Demo & Master (Jika belum ada di localStorage)
 */
function initSeedData() {
  // 1. Seed Master OPD
  const defaultOpds = [
    { kode: "DIN-KES", nama: "Dinas Kesehatan Kabupaten Pasaman" },
    { kode: "DIN-PEND", nama: "Dinas Pendidikan Kabupaten Pasaman" },
    { kode: "BAPPEDA", nama: "Badan Perencanaan Pembangunan Daerah" },
    { kode: "DIN-PUPR", nama: "Dinas Pekerjaan Umum dan Penataan Ruang" },
    { kode: "DPMD", nama: "Dinas Pemberdayaan Masyarakat dan Desa" },
    { kode: "DLH", nama: "Dinas Lingkungan Hidup Kabupaten Pasaman" },
    { kode: "BAG-HUKUM", nama: "Bagian Hukum Setda Kabupaten Pasaman" },
    { kode: "DIN-PERT", nama: "Dinas Pertanian Kabupaten Pasaman" },
    { kode: "DIN-PAR", nama: "Dinas Pariwisata, Pemuda dan Olahraga" },
    { kode: "DISNAKER", nama: "Dinas Perdagangan dan Ketenagakerjaan" }
  ];

  if (!localStorage.getItem("propemperda_opds")) {
    masterOpdList = defaultOpds;
    saveToStorage("propemperda_opds", masterOpdList);
  } else {
    masterOpdList = JSON.parse(localStorage.getItem("propemperda_opds"));
  }

  // 2. Seed Master Users (RBAC)
  const defaultUsers = [
    { username: "admin", password: "admin123", nama: "Administrator Utama", role: "admin", opd: "Semua OPD" },
    { username: "hukum_admin", password: "admin123", nama: "Hendra Syahputra, S.H.", role: "hukum", opd: "Bagian Hukum Setda Kabupaten Pasaman" },
    { username: "dinkes_op", password: "admin123", nama: "drq. Rini Wulandari", role: "opd", opd: "Dinas Kesehatan Kabupaten Pasaman" },
    { username: "pimpinan", password: "admin123", nama: "H. Sabar AS, S.Ag., M.Si.", role: "pimpinan", opd: "Pimpinan / Sekretariat Daerah" },
    { username: "pupr_op", password: "admin123", nama: "Ir. Bambang Sugiarto", role: "opd", opd: "Dinas Pekerjaan Umum dan Penataan Ruang" },
    { username: "dpmd_op", password: "admin123", nama: "Siti Rahma, S.Sos.", role: "opd", opd: "Dinas Pemberdayaan Masyarakat dan Desa" }
  ];

  if (!localStorage.getItem("propemperda_users")) {
    masterUserList = defaultUsers;
    saveToStorage("propemperda_users", masterUserList);
  } else {
    masterUserList = JSON.parse(localStorage.getItem("propemperda_users"));
  }

  // 3. Seed Data Usulan Regulasi
  const defaultUsulan = [
    {
      id: "USL-2026-001",
      timestamp: "2026-06-15 09:30:00",
      opd: "Dinas Kesehatan Kabupaten Pasaman",
      pic: "drq. Rini Wulandari",
      wa: "081234567890",
      jenis: "Peraturan Daerah (Perda)",
      statusRegulasi: "Baru",
      peraturanLama: "N/A",
      judul: "Rancangan Peraturan Daerah tentang Penyelenggaraan Kabupaten Sehat dan Penanggulangan Stunting Terintegrasi",
      urgensi: "Perlunya landasan yuridis yang kuat untuk mewujudkan derajat kesehatan masyarakat Kabupaten Pasaman yang optimal dan penurunan angka stunting sesuai target nasional 14% di tahun 2026 melalui kolaborasi lintas sektor.",
      ruangLingkup: "Bab I: Ketentuan Umum; Bab II: Tugas dan Wewenang Pemerintah Daerah; Bab III: Kawasan Sehat Mandiri; Bab IV: Percepatan Penurunan Stunting; Bab V: Pembiayaan dan Pengawasan; Bab VI: Sanksi Administratif.",
      isDelegasi: "YA",
      delegasiText: "Pasal 18 Undang-Undang Nomor 17 Tahun 2023 tentang Kesehatan",
      dasarHukum: "1. UU No 23 Tahun 2014 tentang Pemerintahan Daerah;\n2. UU No 17 Tahun 2023 tentang Kesehatan;\n3. Perpres No 72 Tahun 2021 tentang Percepatan Penurunan Stunting.",
      targetSelesai: "2026-08-30",
      pembahasanAwal: "Sudah",
      status: "Harmonisasi",
      step: 4,
      fileName: "Naskah_Akademik_Kabupaten_Sehat_2026.pdf",
      fileUrl: "#",
      timeline: [
        { step: 1, title: "Draft Diajukan", time: "15 Juni 2026 09:30", desc: "Usulan didaftarkan oleh operator Dinas Kesehatan.", completed: true },
        { step: 2, title: "Diverifikasi Bagian Hukum", time: "17 Juni 2026 14:15", desc: "Kelengkapan naskah akademik dan surat pengantar kelayakan administrasi telah lengkap.", completed: true },
        { step: 3, title: "Lolos Evaluasi Awal", time: "20 Juni 2026 11:00", desc: "Substansi tidak bertentangan dengan perundangan lebih tinggi.", completed: true },
        { step: 4, title: "Harmonisasi Kanwil Kemenkumham", time: "25 Juni 2026 10:30", desc: "Proses sinkronisasi dan harmonisasi di Kanwil Kemenkumham Sumbar (Dalam Proses).", completed: false }
      ]
    },
    {
      id: "USL-2026-002",
      timestamp: "2026-06-18 11:00:00",
      opd: "Dinas Pekerjaan Umum dan Penataan Ruang",
      pic: "Ir. Bambang Sugiarto",
      wa: "081345678912",
      jenis: "Peraturan Daerah (Perda)",
      statusRegulasi: "Perubahan",
      peraturanLama: "Peraturan Daerah Kabupaten Pasaman Nomor 3 Tahun 2013",
      judul: "Rancangan Peraturan Daerah tentang Perubahan atas Perda Nomor 3 Tahun 2013 tentang Rencana Tata Ruang Wilayah (RTRW) Kabupaten Pasaman Tahun 2026-2046",
      urgensi: "Penyesuaian dinamika pembangunan daerah, perkembangan koridor jalan nasional, mitigasi bencana gempa bumi sesar Sumatera, serta integrasi OSS berbasis risiko.",
      ruangLingkup: "Perubahan zonasi kawasan hutan lindung, struktur ruang jalan kabupaten, kawasan peruntukan industri pertanian, serta ketahanan bencana.",
      isDelegasi: "YA",
      delegasiText: "Pasal 11 Undang-Undang Nomor 26 Tahun 2007 tentang Penataan Ruang",
      dasarHukum: "1. UU No 26 Tahun 2007 tentang Penataan Ruang;\n2. UU No 6 Tahun 2023 tentang Cipta Kerja;\n3. PP No 21 Tahun 2021 tentang Penyelenggaraan Penataan Ruang.",
      targetSelesai: "2026-10-15",
      pembahasanAwal: "Sudah",
      status: "Pembahasan",
      step: 5,
      fileName: "Kajian_Revisi_RTRW_Pasaman_2026.pdf",
      fileUrl: "#",
      timeline: [
        { step: 1, title: "Draft Diajukan", time: "18 Juni 2026 11:00", desc: "Usulan didaftarkan oleh Dinas PUPR.", completed: true },
        { step: 2, title: "Diverifikasi", time: "19 Juni 2026 09:00", desc: "Kelengkapan berkas peta digital shapefile (SHP) diverifikasi.", completed: true },
        { step: 3, title: "Perbaikan Teknis", time: "21 Juni 2026 15:30", desc: "Dinas PUPR melakukan perbaikan lampiran peta koordinat.", completed: true },
        { step: 4, title: "Harmonisasi Selesai", time: "26 Juni 2026 16:00", desc: "Surat Selesai Harmonisasi diterbitkan.", completed: true },
        { step: 5, title: "Pembahasan Bersama DPRD", time: "28 Juni 2026 10:00", desc: "Sedang dalam pembahasan Panitia Khusus (Pansus) DPRD Pasaman.", completed: false }
      ]
    },
    {
      id: "USL-2026-003",
      timestamp: "2026-06-20 14:20:00",
      opd: "Dinas Pemberdayaan Masyarakat dan Desa",
      pic: "Siti Rahma, S.Sos.",
      wa: "081987654321",
      jenis: "Peraturan Bupati (Perkada)",
      statusRegulasi: "Baru",
      peraturanLama: "N/A",
      judul: "Rancangan Peraturan Bupati tentang Pedoman Penggunaan Alokasi Dana Nagari (ADN) untuk Ketahanan Pangan dan Pemberdayaan Masyarakat Tahun Anggaran 2027",
      urgensi: "Membimbing Pemerintah Nagari di Kabupaten Pasaman agar mengalokasikan minimal 20% dana nagari untuk program ketahanan pangan nabati dan hewani guna mencegah kerawanan pangan.",
      ruangLingkup: "Tata cara perencanaan anggaran nagari, pelaporan SPJ ketahanan pangan, prioritas bibit unggul pertanian, dan pengawasan Inspektorat Daerah.",
      isDelegasi: "YA",
      delegasiText: "Pasal 96 Peraturan Pemerintah Nomor 43 Tahun 2014",
      dasarHukum: "1. UU No 6 Tahun 2014 tentang Desa;\n2. Perda Kab Pasaman tentang Pemerintahan Nagari;\n3. Permendesa PDT Nomor 7 Tahun 2023.",
      targetSelesai: "2026-07-31",
      pembahasanAwal: "Sudah",
      status: "Selesai",
      step: 8,
      fileName: "Pedoman_Teknis_ADN_2027.docx",
      fileUrl: "#",
      timeline: [
        { step: 1, title: "Draft Diajukan", time: "20 Juni 2026 14:20", desc: "Usulan didaftarkan oleh DPMD.", completed: true },
        { step: 2, title: "Diverifikasi", time: "21 Juni 2026 10:00", desc: "Lolos verifikasi Bagian Hukum.", completed: true },
        { step: 4, title: "Harmonisasi Internal", time: "23 Juni 2026 11:30", desc: "Koordinasi bersama BPKAD dan Inspektorat selesai.", completed: true },
        { step: 6, title: "Persetujuan Sekda & Bupati", time: "27 Juni 2026 09:00", desc: "Paraf koordinasi lengkap dan ditandatangani Bupati Pasaman.", completed: true },
        { step: 7, title: "Penetapan", time: "29 Juni 2026 14:00", desc: "Ditetapkan sebagai Peraturan Bupati Pasaman Nomor 18 Tahun 2026.", completed: true },
        { step: 8, title: "Selesai Disahkan", time: "30 Juni 2026 08:00", desc: "Telah diundangkan dalam Berita Daerah Kabupaten Pasaman Tahun 2026 Nomor 18.", completed: true }
      ]
    },
    {
      id: "USL-2026-004",
      timestamp: "2026-06-25 08:45:00",
      opd: "Badan Perencanaan Pembangunan Daerah",
      pic: "Drs. M. Zulkifli, M.M.",
      wa: "081266778899",
      jenis: "Peraturan Daerah (Perda)",
      statusRegulasi: "Baru",
      peraturanLama: "N/A",
      judul: "Rancangan Peraturan Daerah tentang Rencana Pembangunan Jangka Panjang Daerah (RPJPD) Kabupaten Pasaman Tahun 2025-2045",
      urgensi: "Menyelaraskan visi Pasaman Maju, Adil, dan Berkelanjutan menuju Indonesia Emas 2045 serta mewajibkan integrasi tahapan pembangunan 5 tahunan.",
      ruangLingkup: "Visi Misi Daerah 20 tahun ke depan, sasaran pokok, arah kebijakan per periode RPJMD, dan evaluasi kinerja makro.",
      isDelegasi: "YA",
      delegasiText: "Pasal 13 Undang-Undang Nomor 25 Tahun 2004 tentang Sistem Perencanaan Pembangunan Nasional",
      dasarHukum: "1. UU No 25 Tahun 2004;\n2. UU No 23 Tahun 2014;\n3. Instruksi Mendagri Nomor 1 Tahun 2024.",
      targetSelesai: "2026-08-15",
      pembahasanAwal: "Sudah",
      status: "Persetujuan",
      step: 6,
      fileName: "Naskah_Akademik_RPJPD_Pasaman_2045.pdf",
      fileUrl: "#",
      timeline: [
        { step: 1, title: "Draft Diajukan", time: "25 Juni 2026 08:45", desc: "Usulan didaftarkan oleh BAPPEDA.", completed: true },
        { step: 2, title: "Diverifikasi", time: "25 Juni 2026 13:00", desc: "Diverifikasi oleh tim Bagian Hukum.", completed: true },
        { step: 4, title: "Harmonisasi", time: "27 Juni 2026 15:00", desc: "Harmonisasi di Kanwil Kemenkumham selesai.", completed: true },
        { step: 5, title: "Pembahasan DPRD Selesai", time: "30 Juni 2026 16:30", desc: "Disetujui dalam rapat paripurna DPRD Kabupaten Pasaman.", completed: true },
        { step: 6, title: "Persetujuan Evaluasi Gubernur", time: "01 Juli 2026 10:00", desc: "Sedang dikirim untuk evaluasi Gubernur Sumatera Barat di Padang.", completed: false }
      ]
    },
    {
      id: "USL-2026-005",
      timestamp: "2026-06-28 10:15:00",
      opd: "Dinas Pendidikan Kabupaten Pasaman",
      pic: "Anwar Hidayat, S.Pd., M.Pd.",
      wa: "085233445566",
      jenis: "Peraturan Bupati (Perkada)",
      statusRegulasi: "Baru",
      peraturanLama: "N/A",
      judul: "Rancangan Peraturan Bupati tentang Kurikulum Muatan Lokal Budaya Alam Minangkabau dan Keislaman pada Sekolah Dasar dan Menengah Pertama di Kabupaten Pasaman",
      urgensi: "Pelestarian adat istiadat Basandi Syarak, Syarak Basandi Kitabullah (ABS-SBK) di kalangan generasi muda pelajar Kabupaten Pasaman di tengah arus digitalisasi.",
      ruangLingkup: "Alokasi waktu pelajaran muatan lokal, kompetensi dasar, sertifikasi guru pengampu, serta integrasi petatah-petitih Minangkabau.",
      isDelegasi: "TIDAK",
      delegasiText: "N/A",
      dasarHukum: "1. UU No 20 Tahun 2003 tentang Sisdiknas;\n2. Perda Sumbar Nomor 2 Tahun 2019 tentang Penyelenggaraan Pendidikan.",
      targetSelesai: "2026-09-01",
      pembahasanAwal: "Belum",
      status: "Diverifikasi",
      step: 2,
      fileName: "Silabus_Mulok_Minangkabau_Pasaman.pdf",
      fileUrl: "#",
      timeline: [
        { step: 1, title: "Draft Diajukan", time: "28 Juni 2026 10:15", desc: "Usulan didaftarkan oleh Dinas Pendidikan.", completed: true },
        { step: 2, title: "Diverifikasi Bagian Hukum", time: "29 Juni 2026 11:00", desc: "Sedang diperiksa kesesuaian format tata naskah dinas oleh Admin Hukum.", completed: false }
      ]
    },
    {
      id: "USL-2026-006",
      timestamp: "2026-07-01 13:40:00",
      opd: "Dinas Lingkungan Hidup Kabupaten Pasaman",
      pic: "Ir. Hj. Nurlaila, M.T.",
      wa: "081377889900",
      jenis: "Peraturan Daerah (Perda)",
      statusRegulasi: "Baru",
      peraturanLama: "N/A",
      judul: "Rancangan Peraturan Daerah tentang Pengelolaan Sampah Rumah Tangga dan Sampah Sejenis Sampah Rumah Tangga Serta Pembatasan Kantong Plastik Sekali Pakai",
      urgensi: "Meningkatnya volume timbunan sampah di Lubuk Sikaping dan kecamatan lainnya serta urgensi mewujudkan Pasaman Bersih Asri.",
      ruangLingkup: "Kewajiban pemilahan sampah dari sumber, pembentukan Bank Sampah Nagari, larangan kantong kresek di ritel modern, dan retribusi kebersihan.",
      isDelegasi: "YA",
      delegasiText: "Pasal 20 Undang-Undang Nomor 18 Tahun 2008 tentang Pengelolaan Sampah",
      dasarHukum: "1. UU No 18 Tahun 2008;\n2. PP No 81 Tahun 2012;\n3. Permen LHK Nomor P.75 Tahun 2019.",
      targetSelesai: "2026-11-30",
      pembahasanAwal: "Sudah",
      status: "Draft",
      step: 1,
      fileName: "Kajian_Pengelolaan_Sampah_Pasaman.docx",
      fileUrl: "#",
      timeline: [
        { step: 1, title: "Draft Diajukan", time: "01 Juli 2026 13:40", desc: "Usulan baru saja didaftarkan di sistem. Menunggu pemeriksaan.", completed: true }
      ]
    }
  ];

  if (!localStorage.getItem("propemperda_usulan")) {
    usulanList = defaultUsulan;
    saveToStorage("propemperda_usulan", usulanList);
  } else {
    usulanList = JSON.parse(localStorage.getItem("propemperda_usulan"));
  }

  // 4. Seed Audit Logs
  const defaultLogs = [
    { time: "2026-07-02 08:00:12", user: "admin", action: "SYSTEM INIT", desc: "Sistem PROPemperda Kabupaten Pasaman berhasil dicanangkan." },
    { time: "2026-07-02 08:30:45", user: "dinkes_op", action: "LOGIN", desc: "Operator Dinas Kesehatan login ke dalam portal." },
    { time: "2026-07-02 09:15:20", user: "hukum_admin", action: "VERIFIKASI", desc: "Memverifikasi usulan USL-2026-001 dari Dinas Kesehatan." },
    { time: "2026-07-02 10:05:00", user: "pimpinan", action: "VIEW REPORT", desc: "Pimpinan melihat rekapitulasi data regulasi daerah." }
  ];

  if (!localStorage.getItem("propemperda_logs")) {
    auditLogs = defaultLogs;
    saveToStorage("propemperda_logs", auditLogs);
  } else {
    auditLogs = JSON.parse(localStorage.getItem("propemperda_logs"));
  }

  // 5. Seed Trash List
  if (!localStorage.getItem("propemperda_trash")) {
    trashList = [];
    saveToStorage("propemperda_trash", trashList);
  } else {
    trashList = JSON.parse(localStorage.getItem("propemperda_trash"));
  }
}

function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function syncWithGoogleSheets() {
  const gasUrl = localStorage.getItem("propemperda_gas_url");
  if (gasUrl && gasUrl.startsWith("http")) {
    const roleParam = `role=${currentUser ? currentUser.role : "guest"}&opd=${encodeURIComponent(currentUser ? currentUser.opd : "")}`;
    
    fetch(`${gasUrl}?action=getUsulanList&${roleParam}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          usulanList = data.data;
          saveToStorage("propemperda_usulan", usulanList);
          renderUsulanTable();
          renderDashboardStats();
        }
      }).catch(e => console.log(e));

    if (currentUser && (currentUser.role === "admin" || currentUser.role === "hukum")) {
      fetch(`${gasUrl}?action=getUsers&${roleParam}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data && data.data.length > 0) {
            masterUserList = data.data;
            saveToStorage("propemperda_users", masterUserList);
          }
        }).catch(e => console.log(e));
        
      fetch(`${gasUrl}?action=getOpds&${roleParam}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data && data.data.length > 0) {
            masterOpdList = data.data;
            saveToStorage("propemperda_opds", masterOpdList);
          }
        }).catch(e => console.log(e));
    }
  }
}

function executeGasPost(action, payload) {
  const gasUrl = localStorage.getItem("propemperda_gas_url");
  if (!gasUrl || !gasUrl.startsWith("http")) return;

  const fullPayload = {
    action: action,
    user: currentUser || { username: "Anonymous", role: "guest", opd: "" },
    ip: "Client-Browser",
    ...payload
  };

  fetch(gasUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(fullPayload)
  })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        if (data.code === 403) {
          if (action !== "logActivity" && action !== "getUsulanList") {
            showAccessDenied(data.error);
          }
        } else if (data.code === 500) {
          console.error("Backend Error on " + action + ":", data.error);
          showToast("Error Sistem: " + data.error, "error");
        }
      } else if (data.success) {
        console.log(`GAS Post [${action}] synchronized with Google Sheets successfully.`);
      }
    })
    .catch(err => {
      console.log(`GAS Post [${action}] offline fallback:`, err);
    });
}

// ============================================================================
// 2. AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
// ============================================================================

/**
 * Handle proses submit form login
 */
function handleLogin(event) {
  event.preventDefault();
  const uName = document.getElementById("loginUsername").value.trim();
  const uPass = document.getElementById("loginPassword").value.trim();

  // Cari di masterUserList
  const foundUser = masterUserList.find(u => u.username === uName && u.password === uPass);

  if (foundUser) {
    currentUser = foundUser;
    localStorage.setItem("propemperda_session", JSON.stringify(currentUser));
    logActivity(currentUser.username, "LOGIN", `User [${currentUser.nama}] berhasil masuk.`);

    Swal.fire({
      icon: "success",
      title: "Autentikasi Berhasil!",
      text: `Selamat datang, ${currentUser.nama} (${getRoleLabel(currentUser.role)})`,
      timer: 1500,
      showConfirmButton: false
    }).then(() => {
      showMainLayout();
    });
  } else {
    Swal.fire({
      icon: "error",
      title: "Autentikasi Gagal",
      text: "Username atau password yang Anda masukkan tidak valid!",
      confirmButtonColor: "var(--primary-color)"
    });
  }
}

/**
 * Handle Logout
 */
function handleLogout() {
  Swal.fire({
    title: "Keluar dari Sistem?",
    text: "Sesi otentikasi Anda akan diakhiri.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Ya, Keluar!",
    cancelButtonText: "Batal"
  }).then((result) => {
    if (result.isConfirmed) {
      if (currentUser) {
        logActivity(currentUser.username, "LOGOUT", `User keluar dari sistem.`);
      }
      currentUser = null;
      localStorage.removeItem("propemperda_session");
      showAuthPage();
      showToast("Anda telah berhasil keluar.", "success");
    }
  });
}

function showAuthPage() {
  document.getElementById("auth-page").classList.remove("d-none");
  document.getElementById("main-layout").classList.add("d-none");
}

function showMainLayout() {
  document.getElementById("auth-page").classList.add("d-none");
  document.getElementById("main-layout").classList.remove("d-none");

  // Update sidebar info
  const initials = document.querySelectorAll(".userInitial");
  initials.forEach(el => el.textContent = currentUser.nama.charAt(0).toUpperCase());

  const names = document.querySelectorAll(".sidebarUserName");
  names.forEach(el => el.textContent = currentUser.nama);

  const roles = document.querySelectorAll(".sidebarUserRole");
  roles.forEach(el => el.textContent = getRoleLabel(currentUser.role));

  const opds = document.querySelectorAll(".sidebarUserOpd");
  opds.forEach(el => el.textContent = currentUser.opd || "Semua OPD");

  document.getElementById("navbarRoleBadge").textContent = `${getRoleLabel(currentUser.role)}`;

  // Update dash welcome
  document.getElementById("dash-welcome").innerHTML = `Selamat datang, <strong>${currentUser.nama}</strong>. Akses Peran: <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">${getRoleLabel(currentUser.role)}</span> — Instansi: <strong>${currentUser.opd}</strong>`;

  applyRbac();
  populateDropdowns();
  switchPage("page-dashboard");
}

function getRoleLabel(role) {
  switch (role) {
    case "admin": return "Super Admin";
    case "hukum": return "Admin Bag. Hukum";
    case "opd": return "Operator OPD";
    case "pimpinan": return "Pimpinan Eksekutif";
    default: return "Pengguna";
  }
}

function showAccessDenied(message) {
  logActivity(currentUser ? currentUser.username : "Anonymous", "UNAUTHORIZED ACCESS", `Percobaan akses ilegal/tanpa izin ke fitur: ${message}`, "Gagal (403 Forbidden)", "Page/API");
  Swal.fire({
    icon: "error",
    title: "403 - Access Denied!",
    text: message || "Anda tidak memiliki hak akses (RBAC) untuk mengakses halaman atau fitur ini.",
    confirmButtonColor: "#dc3545",
    confirmButtonText: "Kembali ke Dashboard",
    allowOutsideClick: false
  }).then(() => {
    switchPage("page-dashboard");
  });
}

/**
 * Menerapkan aturan akses RBAC pada elemen UI
 */
function applyRbac() {
  if (!currentUser) return;
  const role = currentUser.role;
  const writeElements = document.querySelectorAll(".link-write-access");
  const masterElements = document.querySelectorAll(".link-master-data");
  const superAdminElements = document.querySelectorAll(".link-super-admin");

  // 1. Tombol & Menu Tambah/Edit Usulan (.link-write-access)
  if (role === "pimpinan" || role === "admin") {
    writeElements.forEach(el => el.classList.add("d-none"));
  } else {
    writeElements.forEach(el => el.classList.remove("d-none"));
  }

  // 2. Menu Master Data & Aksi Verifikasi Hukum (.link-master-data)
  if (role === "admin" || role === "hukum") {
    masterElements.forEach(el => el.classList.remove("d-none"));
  } else {
    masterElements.forEach(el => el.classList.add("d-none"));
  }

  // 3. Khusus Super Admin (.link-super-admin)
  if (role === "admin") {
    superAdminElements.forEach(el => el.classList.remove("d-none"));
  } else {
    superAdminElements.forEach(el => el.classList.add("d-none"));
  }
}

// ============================================================================
// 3. NAVIGATION & UI HELPERS
// ============================================================================

function switchPage(targetId) {
  // Strict Backend-like RBAC validation before rendering any page
  if (currentUser) {
    const role = currentUser.role;
    if (targetId === "page-developer" && role !== "admin") {
      showAccessDenied("Menu Developer Hub & Pengaturan Sistem hanya dapat diakses oleh Super Admin.");
      return;
    }
    if (targetId === "page-master" && role !== "admin" && role !== "hukum") {
      showAccessDenied("Halaman Master Data & Konfigurasi hanya untuk Super Admin dan Admin Bagian Hukum.");
      return;
    }
    if (targetId === "page-tambah" && role === "pimpinan") {
      showAccessDenied("Role Pimpinan bersifat Read-Only (Monitoring) dan tidak dapat menambah atau mengedit data usulan.");
      return;
    }
  }

  // Hide all pages
  const pages = document.querySelectorAll(".page-content");
  pages.forEach(p => p.classList.add("d-none"));

  // Show target page
  const targetPage = document.getElementById(targetId);
  if (targetPage) {
    targetPage.classList.remove("d-none");
  }

  // Update sidebar active status
  const menuItems = document.querySelectorAll(".sidebar-menu li.menu-item");
  menuItems.forEach(li => {
    if (li.getAttribute("data-target") === targetId) {
      li.classList.add("active");
    } else {
      li.classList.remove("active");
    }
  });

  // Update Breadcrumb
  const breadcrumb = document.getElementById("dynamicBreadcrumb");
  let pageTitle = "Dashboard";
  switch (targetId) {
    case "page-dashboard": pageTitle = "Dashboard"; break;
    case "page-usulan": pageTitle = "Data Usulan"; break;
    case "page-tambah": pageTitle = "Form Tambah / Edit Usulan"; break;
    case "page-detail": pageTitle = "Detail Dokumen Usulan"; break;
    case "page-monitoring": pageTitle = "Monitoring Progres"; break;
    case "page-laporan": pageTitle = "Laporan Rekapitulasi"; break;
    case "page-master": pageTitle = "Master Data & Log"; break;
    case "page-developer": pageTitle = "Developer Hub (GAS)"; break;
  }
  breadcrumb.innerHTML = `
    <li class="breadcrumb-item"><a href="javascript:void(0)" onclick="switchPage('page-dashboard')">Beranda</a></li>
    <li class="breadcrumb-item active" aria-current="page">${pageTitle}</li>
  `;

  // Trigger Action Specific Page
  if (targetId === "page-dashboard") {
    renderDashboardStats();
    setTimeout(() => initDashboardCharts(), 150);
  } else if (targetId === "page-usulan") {
    renderUsulanTable();
  } else if (targetId === "page-tambah") {
    if (!document.getElementById("edit-id").value) {
      resetUsulanForm();
    }
  } else if (targetId === "page-monitoring") {
    populateMonitoringSelector();
  } else if (targetId === "page-laporan") {
    renderLaporanTable();
  } else if (targetId === "page-master") {
    renderMasterOpd();
    renderMasterUsers();
    renderAuditLogs();
    if (typeof renderTrashTable === "function") renderTrashTable();
  } else if (targetId === "page-developer") {
    const savedUrl = localStorage.getItem("propemperda_gas_url");
    if (savedUrl && document.getElementById("gas-url-input")) {
      document.getElementById("gas-url-input").value = savedUrl;
    }
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const content = document.getElementById("content");
  if (sidebar.style.display === "none" || sidebar.classList.contains("d-none")) {
    sidebar.classList.remove("d-none");
    sidebar.style.display = "flex";
    content.style.width = "calc(100% - 280px)";
  } else {
    sidebar.style.display = "none";
    sidebar.classList.add("d-none");
    content.style.width = "100%";
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem("propemperda_theme") || "light";
  document.documentElement.setAttribute("data-bs-theme", savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleDarkMode() {
  const currentTheme = document.documentElement.getAttribute("data-bs-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-bs-theme", newTheme);
  localStorage.setItem("propemperda_theme", newTheme);
  updateThemeIcon(newTheme);
  showToast(`Mode tampilan diubah ke ${newTheme.toUpperCase()}`, "info");

  // Re-init charts for dark mode colors if on dashboard
  if (!document.getElementById("page-dashboard").classList.contains("d-none")) {
    setTimeout(() => initDashboardCharts(), 150);
  }
}

function updateThemeIcon(theme) {
  const icon = document.getElementById("themeIcon");
  if (theme === "dark") {
    icon.className = "bi bi-sun-fill text-warning fs-6";
  } else {
    icon.className = "bi bi-moon-stars fs-6";
  }
}

function initScrollListeners() {
  const backBtn = document.getElementById("backToTop");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      backBtn.style.display = "flex";
    } else {
      backBtn.style.display = "none";
    }
  });
  backBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const id = "toast-" + Date.now();
  let icon = "bi-info-circle-fill text-primary";
  if (type === "success") icon = "bi-check-circle-fill text-success";
  if (type === "warning") icon = "bi-exclamation-triangle-fill text-warning";
  if (type === "danger") icon = "bi-x-circle-fill text-danger";

  const html = `
    <div class="toast-custom toast-${type}" id="${id}">
      <i class="bi ${icon} fs-5 mt-1"></i>
      <div class="flex-grow-1">
        <div class="fw-bold small text-uppercase" style="font-size: 0.725rem;">PROPemperda Notifikasi</div>
        <div class="small text-secondary">${message}</div>
      </div>
      <button type="button" class="btn-close btn-close-sm" onclick="document.getElementById('${id}').remove()"></button>
    </div>
  `;
  container.insertAdjacentHTML("beforeend", html);
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) el.remove();
  }, 4500);
}

function populateDropdowns() {
  // Populate OPDs in Filter and Forms
  const opdSelects = [
    document.getElementById("filter-opd"),
    document.getElementById("inp-opd"),
    document.getElementById("lap-filter-opd"),
    document.getElementById("inp-user-opd")
  ];

  opdSelects.forEach(sel => {
    if (!sel) return;
    const isFilter = sel.id.includes("filter");
    sel.innerHTML = isFilter ? '<option value="">Semua Perangkat Daerah</option>' : '';

    masterOpdList.forEach(o => {
      // Jika user operator OPD, batasi pilihan hanya OPD miliknya saat menambah usulan
      if (sel.id === "inp-opd" && currentUser.role === "opd") {
        if (o.nama === currentUser.opd) {
          sel.innerHTML += `<option value="${o.nama}" selected>${o.nama}</option>`;
        }
      } else {
        sel.innerHTML += `<option value="${o.nama}">${o.nama}</option>`;
      }
    });
  });
}

// ============================================================================
// 4. DASHBOARD STATISTICS & APEXCHARTS
// ============================================================================

function renderDashboardStats() {
  const container = document.getElementById("dashboard-stats-row");
  if (!container || !currentUser) return;

  const role = currentUser.role;
  let filteredList = usulanList;
  if (role === "opd") {
    filteredList = usulanList.filter(u => u.opd === currentUser.opd);
  }

  const usulanOpdCount = filteredList.length;
  const prosesCount = filteredList.filter(u => u.status !== "Selesai" && u.status !== "Draft" && u.status !== "Ditolak" && u.status !== "Perlu Perbaikan").length;
  const setujuCount = filteredList.filter(u => u.status === "Selesai").length;
  const perbaikanCount = filteredList.filter(u => u.status === "Perlu Perbaikan").length;
  const tolakCount = filteredList.filter(u => u.status === "Ditolak").length;

  container.innerHTML = `
    <div class="col-6 col-md-4 col-xl-2 mb-3">
      <div class="card-stat p-3 h-100 d-flex flex-column justify-content-center align-items-center text-center border-primary border-start border-4">
        <span class="text-muted small fw-bold text-uppercase mb-2">Usulan OPD</span>
        <h3 class="fw-bold mb-0 text-primary fs-3">${usulanOpdCount}</h3>
      </div>
    </div>
    <div class="col-6 col-md-4 col-xl-2 mb-3">
      <div class="card-stat p-3 h-100 d-flex flex-column justify-content-center align-items-center text-center border-info border-start border-4">
        <span class="text-muted small fw-bold text-uppercase mb-2">Diproses</span>
        <h3 class="fw-bold mb-0 text-info fs-3">${prosesCount}</h3>
      </div>
    </div>
    <div class="col-6 col-md-4 col-xl-2 mb-3">
      <div class="card-stat p-3 h-100 d-flex flex-column justify-content-center align-items-center text-center border-success border-start border-4">
        <span class="text-muted small fw-bold text-uppercase mb-2">Disetujui</span>
        <h3 class="fw-bold mb-0 text-success fs-3">${setujuCount}</h3>
      </div>
    </div>
    <div class="col-6 col-md-6 col-xl-3 mb-3">
      <div class="card-stat p-3 h-100 d-flex flex-column justify-content-center align-items-center text-center border-warning border-start border-4">
        <span class="text-muted small fw-bold text-uppercase mb-2">Perlu Perbaikan</span>
        <h3 class="fw-bold mb-0 text-warning fs-3">${perbaikanCount}</h3>
      </div>
    </div>
    <div class="col-12 col-md-6 col-xl-3 mb-3">
      <div class="card-stat p-3 h-100 d-flex flex-column justify-content-center align-items-center text-center border-danger border-start border-4">
        <span class="text-muted small fw-bold text-uppercase mb-2">Ditolak</span>
        <h3 class="fw-bold mb-0 text-danger fs-3">${tolakCount}</h3>
      </div>
    </div>
  `;
}

// Global Chart variables to destroy before recreating
let chartJenisInst = null;
let chartStatusInst = null;
let chartOpdInst = null;

function initDashboardCharts() {
  const isDark = document.documentElement.getAttribute("data-bs-theme") === "dark";
  const textColor = isDark ? "#f8fafc" : "#1e293b";
  const gridColor = isDark ? "#1f2937" : "#e2e8f0";

  let filteredList = usulanList;
  const opdChartCard = document.getElementById("chart-opd")?.closest(".col-12");
  if (currentUser && currentUser.role === "opd") {
    filteredList = usulanList.filter(u => u.opd === currentUser.opd);
    if (opdChartCard) opdChartCard.classList.add("d-none");
  } else {
    if (opdChartCard) opdChartCard.classList.remove("d-none");
  }

  // 1. Chart Jenis Regulasi (Donut)
  const perda = filteredList.filter(u => u.jenis.includes("Perda")).length;
  const perkada = filteredList.filter(u => u.jenis.includes("Perkada") || u.jenis.includes("Bupati")).length;

  if (chartJenisInst) chartJenisInst.destroy();
  const optionsJenis = {
    series: [perda, perkada],
    chart: { type: 'donut', height: 300, background: 'transparent' },
    labels: ['Perda', 'Perkada (Perbup)'],
    colors: ['#0d6efd', '#0dcaf0'],
    legend: { position: 'bottom', labels: { colors: textColor } },
    plotOptions: { donut: { size: '65%', labels: { show: true, total: { show: true, label: 'Total', color: textColor } } } },
    dataLabels: { enabled: true },
    stroke: { width: 0 }
  };
  chartJenisInst = new ApexCharts(document.querySelector("#chart-jenis"), optionsJenis);
  chartJenisInst.render();

  // 2. Chart Status Perkembangan (Column)
  const statusLabels = ["Draft", "Diverifikasi", "Perlu Perbaikan", "Harmonisasi", "Pembahasan", "Persetujuan", "Penetapan", "Selesai"];
  const statusCounts = statusLabels.map(s => filteredList.filter(u => u.status === s).length);

  if (chartStatusInst) chartStatusInst.destroy();
  const optionsStatus = {
    series: [{ name: 'Jumlah Dokumen', data: statusCounts }],
    chart: { type: 'bar', height: 300, background: 'transparent', toolbar: { show: false } },
    colors: ['#198754'],
    plotOptions: { bar: { borderRadius: 6, columnWidth: '50%', distributed: true } },
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: { categories: statusLabels, labels: { style: { colors: textColor, fontSize: '11px' } }, axisBorder: { show: false } },
    yaxis: { labels: { style: { colors: textColor } } },
    grid: { borderColor: gridColor, strokeDashArray: 4 }
  };
  chartStatusInst = new ApexCharts(document.querySelector("#chart-status"), optionsStatus);
  chartStatusInst.render();

  // 3. Chart OPD Pemrakarsa (Horizontal Bar)
  const opdMap = {};
  filteredList.forEach(u => {
    const shortName = u.opd.replace("Dinas ", "").replace("Kabupaten Pasaman", "").trim();
    opdMap[shortName] = (opdMap[shortName] || 0) + 1;
  });
  const opdCategories = Object.keys(opdMap);
  const opdValues = Object.values(opdMap);

  if (chartOpdInst) chartOpdInst.destroy();
  const optionsOpd = {
    series: [{ name: 'Usulan Regulasi', data: opdValues }],
    chart: { type: 'bar', height: 350, background: 'transparent', toolbar: { show: false } },
    colors: ['#6c757d', '#0d6efd', '#ffc107', '#0dcaf0', '#198754'],
    plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: '60%', distributed: true } },
    dataLabels: { enabled: true, style: { colors: ['#fff'] } },
    legend: { show: false },
    xaxis: { categories: opdCategories, labels: { style: { colors: textColor } } },
    yaxis: { labels: { style: { colors: textColor, fontSize: '12px' } } },
    grid: { borderColor: gridColor, strokeDashArray: 4 }
  };
  chartOpdInst = new ApexCharts(document.querySelector("#chart-opd"), optionsOpd);
  chartOpdInst.render();
}

// ============================================================================
// 5. DATA USULAN & DATATABLES CRUD
// ============================================================================

function renderUsulanTable() {
  const tbody = document.getElementById("usulanTableBody");
  if (!tbody) return;

  // Destroy DataTables if already initialized
  if ($.fn.DataTable.isDataTable("#usulanTable")) {
    $("#usulanTable").DataTable().destroy();
  }

  tbody.innerHTML = "";
  let displayList = usulanList;
  if (currentUser.role === "opd") {
    displayList = usulanList.filter(u => u.opd === currentUser.opd);
  }

  displayList.forEach((item, idx) => {
    try {
      let statusClass = "status-draft";
      const safeStatus = item.status || "Draft";
      const safeJenis = item.jenis || "Perkada";
      const safeTimestamp = item.timestamp || "";
      
      const st = safeStatus.toLowerCase().replace(/\s+/g, '-');
      if (st) statusClass = "status-" + st;

      const shortTimestamp = safeTimestamp ? safeTimestamp.split(" ")[0] : "-";

    // Tombol Aksi RBAC
    let actionButtons = `
      <button class="btn btn-sm btn-outline-info rounded-circle me-1" onclick="viewDetail('${item.id}')" title="Lihat Detail"><i class="bi bi-eye"></i></button>
    `;

    // Edit & Hapus hanya jika punya akses tulis dan status masih Draft/Diverifikasi (atau jika Super Admin)
    if (currentUser.role !== "pimpinan") {
      actionButtons += `
        <button class="btn btn-sm btn-outline-primary rounded-circle me-1 link-write-access" onclick="editUsulan('${item.id}')" title="Edit Dokumen"><i class="bi bi-pencil"></i></button>
      `;
      if (currentUser.role === "admin" || currentUser.role === "hukum") {
        actionButtons += `
          <button class="btn btn-sm btn-outline-danger rounded-circle" onclick="deleteUsulan('${item.id}')" title="Hapus Permanen"><i class="bi bi-trash"></i></button>
        `;
      }
    }

    const tr = `
      <tr>
        <td class="text-center fw-bold">${idx + 1}</td>
        <td>
          <span class="fw-bold d-block text-primary">${item.opd}</span>
          <span class="badge bg-secondary bg-opacity-10 text-secondary border small">${item.id}</span>
        </td>
        <td>
          <span class="fw-bold d-block text-main mb-1" style="line-height: 1.4;">${item.judul}</span>
          <small class="text-muted d-block text-truncate" style="max-width: 320px;"><i class="bi bi-info-circle me-1"></i> ${item.urgensi}</small>
        </td>
        <td>
          <span class="badge ${safeJenis.includes('Perda') ? 'bg-primary' : 'bg-info text-dark'} py-1.5 px-2.5">${safeJenis.includes('Perda') ? 'Perda' : 'Perkada'}</span>
          <small class="d-block text-muted mt-1" style="font-size: 0.725rem;">Sifat: ${item.statusRegulasi}</small>
        </td>
        <td>
          <span class="fw-medium d-block text-main">${item.pic}</span>
          <small class="text-muted"><i class="bi bi-calendar-check me-1"></i> ${shortTimestamp}</small>
          <a href="https://wa.me/62${(item.wa || '').replace(/^0+/, '')}" target="_blank" class="badge bg-success bg-opacity-25 text-success text-decoration-none d-inline-block mt-1"><i class="bi bi-whatsapp me-1"></i> Chat WA</a>
        </td>
        <td>
          <span class="badge-status ${statusClass}">${safeStatus}</span>
        </td>
        <td class="text-center text-nowrap">
          ${actionButtons}
        </td>
      </tr>
    `;
    tbody.insertAdjacentHTML("beforeend", tr);
    } catch (err) {
      console.error("Error rendering item:", item, err);
    }
  });

  // Re-initialize DataTables
  dataTableInstance = $("#usulanTable").DataTable({
    responsive: true,
    language: {
      url: "//cdn.datatables.net/plug-ins/1.13.7/i18n/id.json",
      search: "Cari Dokumen:",
      lengthMenu: "Tampilkan _MENU_ data",
      info: "Menampilkan _START_ hingga _END_ dari total _TOTAL_ usulan",
      emptyTable: "Belum ada dokumen usulan terdaftar untuk filter ini."
    },
    pageLength: 10,
    order: [[0, 'asc']]
  });

  applyRbac();
}

/**
 * Filter DataTables berdasarkan Dropdown
 */
function applyFilters() {
  if (!dataTableInstance) return;

  const fOpd = document.getElementById("filter-opd").value;
  const fStatus = document.getElementById("filter-status").value;
  const fJenis = document.getElementById("filter-jenis").value;

  // Filter column 1: OPD
  dataTableInstance.column(1).search(fOpd ? `^${fOpd}` : '', true, false);
  // Filter column 5: Status
  dataTableInstance.column(5).search(fStatus ? `^${fStatus}$` : '', true, false);
  // Filter column 3: Jenis
  dataTableInstance.column(3).search(fJenis ? fJenis.includes('Perda') ? 'Perda' : 'Perkada' : '', true, false);

  dataTableInstance.draw();
}

/**
 * Toggle input keterangan delegasi
 */

function togglePeraturanLama() {
  const status = document.getElementById("inp-status").value;
  const divPeraturanLama = document.getElementById("div-peraturan-lama");
  if (status === "Baru") {
    divPeraturanLama.style.display = "none";
  } else {
    divPeraturanLama.style.display = "block";
  }
}

function toggleDelegasi() {
  const val = document.getElementById("inp-is-delegasi").value;
  const box = document.getElementById("div-delegasi-text");
  if (val === "YA") {
    box.style.display = "block";
    document.getElementById("inp-delegasi-text").required = true;
  } else {
    box.style.display = "none";
    document.getElementById("inp-delegasi-text").required = false;
  }
}

/**
 * File input preview di Dropzone
 */
function handleFileSelect(event) {
  const file = event.target.files[0];
  const info = document.getElementById("file-chosen-info");
  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      Swal.fire("Ukuran Berkas Terlalu Besar!", "Maksimal ukuran file kajian adalah 10 MB.", "error");
      event.target.value = "";
      info.classList.add("d-none");
      return;
    }
    info.innerHTML = `<i class="bi bi-file-earmark-check-fill me-1"></i> Terpilih: <strong>${file.name}</strong> (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    info.classList.remove("d-none");
  } else {
    info.classList.add("d-none");
  }
}

/**
 * Reset form usulan
 */
function resetUsulanForm() {
  document.getElementById("usulanForm").reset();
  document.getElementById("edit-id").value = "";
  document.getElementById("form-title").innerHTML = `<i class="bi bi-plus-circle me-2"></i>Ajukan Usulan Baru`;
  document.getElementById("btnSaveSubmit").innerHTML = `Simpan Usulan <i class="bi bi-send ms-1"></i>`;
  document.getElementById("file-chosen-info").classList.add("d-none");
  document.getElementById("upload-progress-container").classList.add("d-none");
  toggleDelegasi();
}

/**
 * Simpan Usulan Baru atau Update
 */
function handleSaveUsulan(event) {
  event.preventDefault();

  if (currentUser && currentUser.role === "pimpinan") {
    showAccessDenied("Role Pimpinan bersifat Read-Only dan dilarang menyimpan/mengubah data usulan.");
    return;
  }

  const editId = document.getElementById("edit-id").value;
  const opd = document.getElementById("inp-opd").value;
  const pic = document.getElementById("inp-pic").value;
  const wa = document.getElementById("inp-wa").value;
  const jenis = document.getElementById("inp-jenis").value;
  const statusReg = document.getElementById("inp-status").value;
  const perLama = document.getElementById("inp-peraturan-lama").value || "N/A";
  const judul = document.getElementById("inp-judul").value;
  const urgensi = document.getElementById("inp-urgensi").value;
  const ruangLingkup = document.getElementById("inp-ruang-lingkup").value;
  const isDelegasi = document.getElementById("inp-is-delegasi").value;
  const delegasiText = isDelegasi === "YA" ? document.getElementById("inp-delegasi-text").value : "N/A";
  const dasarHukum = document.getElementById("inp-dasar-hukum").value;
  const targetSelesai = document.getElementById("inp-target-selesai").value;
  const pembahasanAwal = document.getElementById("inp-pembahasan-awal").value;
  const fileInput = document.getElementById("inp-file");

  if (currentUser && currentUser.role === "opd" && opd !== currentUser.opd) {
    showAccessDenied("Anda tidak diizinkan memanipulasi OPD menjadi instansi lain!");
    return;
  }

  if (!editId && !fileInput.files[0]) {
    Swal.fire("Berkas Kajian Mandatori!", "Harap upload file Naskah Akademik / Kajian Teknis (.pdf/.docx).", "warning");
    return;
  }

  // Validasi ukuran file (Maksimal 5MB)
  if (fileInput.files && fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      Swal.fire("File Terlalu Besar!", "Ukuran maksimal file dokumen adalah 5 MB untuk menjaga kestabilan server Google Drive.", "warning");
      return;
    }
  }

  const progBox = document.getElementById("upload-progress-container");
  const progBar = document.getElementById("upload-progress-bar");
  
  async function processForm() {
    if (progBox) progBox.classList.remove("d-none");
    if (progBar) progBar.style.width = "10%";

    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);
    let fileNameVal = "Dokumen_Naskah_Akademik_Draft.pdf";
    let driveUrl = "#";

    // Cek apakah ada file yang diupload
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      fileNameVal = file.name;
      
      if (progBar) progBar.style.width = "30%";
      
      try {
        // Baca file sebagai Base64
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64Str = reader.result.split(',')[1];
            resolve(base64Str);
          };
          reader.onerror = error => reject(error);
          reader.readAsDataURL(file);
        });

        if (progBar) progBar.style.width = "60%";

        // Upload ke GAS secara Asynchronous
        const gasUrl = localStorage.getItem("propemperda_gas_url");
        if (gasUrl && gasUrl.startsWith("http")) {
          const payload = {
            action: "uploadFile",
            user: currentUser || { username: "Anonymous", role: "guest" },
            ip: "Client-Browser",
            fileBase64: base64Data,
            fileName: fileNameVal,
            fileMime: file.type || "application/pdf"
          };
          
          const res = await fetch(gasUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.success && data.fileUrl) {
            driveUrl = data.fileUrl;
          } else {
            console.error("GAS Error:", data.error);
            await Swal.fire("Gagal Mengunggah", "Server menolak file: " + (data.error || "Unknown Error"), "error");
          }
        }
      } catch (e) {
        console.log("Gagal mengunggah file ke Google Drive:", e);
        await Swal.fire("Koneksi Terputus", "Gagal mengirim file ke Google Drive. Pesan: " + e.message, "error");
      }
    }
    
    if (progBar) progBar.style.width = "100%";

    if (editId) {
      // Update existing
      const idx = usulanList.findIndex(u => u.id === editId);
      if (idx !== -1) {
        const existingItem = usulanList[idx];
        if (currentUser.role === "opd") {
          if (existingItem.opd !== currentUser.opd) {
            showAccessDenied("Aksi ditolak: Anda tidak dapat mengedit data milik instansi lain.");
            if (progBox) progBox.classList.add("d-none");
            return;
          }
          if (existingItem.status !== "Draft" && existingItem.status !== "Perlu Perbaikan") {
            showAccessDenied(`Aksi ditolak: Dokumen status "${existingItem.status}" sudah terkunci dari pengeditan operator OPD.`);
            if (progBox) progBox.classList.add("d-none");
            return;
          }
        }

        existingItem.opd = opd;
        existingItem.pic = pic;
        existingItem.wa = wa;
        existingItem.jenis = jenis;
        existingItem.statusRegulasi = statusReg;
        existingItem.peraturanLama = perLama;
        existingItem.judul = judul;
        existingItem.urgensi = urgensi;
        existingItem.ruangLingkup = ruangLingkup;
        existingItem.isDelegasi = isDelegasi;
        existingItem.delegasiText = delegasiText;
        existingItem.dasarHukum = dasarHukum;
        existingItem.targetSelesai = targetSelesai;
        existingItem.pembahasanAwal = pembahasanAwal;
        
        if (fileInput.files[0]) {
          existingItem.fileName = fileNameVal;
          if (driveUrl !== "#") {
            existingItem.fileUrl = driveUrl;
          }
        }

        saveToStorage("propemperda_usulan", usulanList);
        executeGasPost("updateUsulan", { id: editId, item: existingItem });
        logActivity(currentUser.username, "UPDATE USULAN", `Memperbarui dokumen [${editId}]: ${judul.substring(0, 40)}...`, "Berhasil", editId);
      }
    } else {
      // Create new
      const newId = `USL-${new Date().getFullYear()}-${String(usulanList.length + 1).padStart(3, '0')}`;
      
      const newItem = {
        id: newId,
        timestamp: nowStr,
        opd: opd,
        pic: pic,
        wa: wa,
        jenis: jenis,
        statusRegulasi: statusReg,
        peraturanLama: perLama,
        judul: judul,
        urgensi: urgensi,
        ruangLingkup: ruangLingkup,
        isDelegasi: isDelegasi,
        delegasiText: delegasiText,
        dasarHukum: dasarHukum,
        targetSelesai: targetSelesai,
        pembahasanAwal: pembahasanAwal,
        status: "Draft",
        step: 1,
        fileName: fileNameVal,
        fileUrl: driveUrl,
        timeline: [
          { step: 1, title: "Draft Diajukan", time: nowStr.split(" ")[0], desc: `Didaftarkan oleh ${currentUser.nama} (${opd}).`, completed: true }
        ]
      };

      usulanList.unshift(newItem);
      saveToStorage("propemperda_usulan", usulanList);
      executeGasPost("createUsulan", { item: newItem });
      logActivity(currentUser.username, "CREATE USULAN", `Mendaftarkan usulan baru [${newId}]: ${judul.substring(0, 40)}...`, "Berhasil", newId);
    }

    renderUsulanTable();
    renderDashboardStats();
    resetUsulanForm();
    
    if (progBox) progBox.classList.add("d-none");
    if (progBar) progBar.style.width = "0%";

    Swal.fire({
      icon: "success",
      title: editId ? "Perubahan Disimpan!" : "Usulan Berhasil Didaftarkan!",
      text: "Dokumen rancangan regulasi telah tercatat dalam sistem PROPemperda beserta file lampirannya.",
      timer: 2000,
      showConfirmButton: false
    }).then(() => {
      switchPage("page-usulan");
    });
  }

  processForm();
}

/**
 * Edit Usulan -> Load ke Form
 */
function editUsulan(id) {
  const item = usulanList.find(u => u.id === id);
  if (!item) return;

  if (currentUser.role === "pimpinan") {
    showAccessDenied("Role Pimpinan tidak memiliki izin untuk mengubah/mengedit data usulan.");
    return;
  }
  if (currentUser.role === "opd") {
    if (item.opd !== currentUser.opd) {
      showAccessDenied("Anda tidak diizinkan mengedit dokumen usulan milik Perangkat Daerah (OPD) lain!");
      return;
    }
    if (item.status !== "Draft" && item.status !== "Perlu Perbaikan") {
      showAccessDenied(`Usulan dengan status "${item.status}" sudah masuk tahap verifikasi/legislasi dan tidak dapat diedit lagi oleh Operator OPD.`);
      return;
    }
  }

  document.getElementById("edit-id").value = item.id;
  document.getElementById("inp-opd").value = item.opd;
  document.getElementById("inp-pic").value = item.pic;
  document.getElementById("inp-wa").value = item.wa;
  document.getElementById("inp-jenis").value = item.jenis;
  document.getElementById("inp-status").value = item.statusRegulasi;
  document.getElementById("inp-peraturan-lama").value = item.peraturanLama || "N/A";
  document.getElementById("inp-judul").value = item.judul;
  document.getElementById("inp-urgensi").value = item.urgensi;
  document.getElementById("inp-ruang-lingkup").value = item.ruangLingkup;
  document.getElementById("inp-is-delegasi").value = item.isDelegasi;
  document.getElementById("inp-delegasi-text").value = item.delegasiText || "N/A";
  document.getElementById("inp-dasar-hukum").value = item.dasarHukum;
  document.getElementById("inp-target-selesai").value = item.targetSelesai;
  document.getElementById("inp-pembahasan-awal").value = item.pembahasanAwal;

  document.getElementById("form-title").innerHTML = `<i class="bi bi-pencil-square me-2"></i>Edit Dokumen [${item.id}]`;
  document.getElementById("btnSaveSubmit").innerHTML = `Perbarui Dokumen <i class="bi bi-check-lg ms-1"></i>`;

  toggleDelegasi();
  switchPage("page-tambah");
}

/**
 * Hapus Usulan Permanen -> Pindahkan ke Trash
 */
function deleteUsulan(id) {
  if (currentUser.role !== "admin") {
    showAccessDenied("Hanya Super Admin yang berhak menghapus atau memindahkan dokumen ke tempat sampah.");
    return;
  }
  const itemIdx = usulanList.findIndex(u => u.id === id);
  if (itemIdx === -1) return;
  const item = usulanList[itemIdx];

  Swal.fire({
    title: `Pindahkan ke Trash [${id}]?`,
    text: `Judul: "${item.judul.substring(0, 60)}..." akan dipindahkan ke Tempat Sampah (Trash) dan dapat direstore sewaktu-waktu.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Ya, Pindahkan ke Trash!",
    cancelButtonText: "Batal"
  }).then((result) => {
    if (result.isConfirmed) {
      const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);
      item.delTime = nowStr;
      item.deletedBy = currentUser.username;
      trashList.unshift(item);
      usulanList.splice(itemIdx, 1);

      saveToStorage("propemperda_usulan", usulanList);
      saveToStorage("propemperda_trash", trashList);
      executeGasPost("deleteUsulan", { id: id });
      logActivity(currentUser.username, "DELETE USULAN", `Memindahkan dokumen [${id}] ke Trash: ${item.judul.substring(0, 40)}...`, "Berhasil", id);
      renderUsulanTable();
      renderDashboardStats();
      showToast(`Dokumen [${id}] telah dipindahkan ke Trash.`, "success");
    }
  });
}

/**
 * View Detail Dokumen
 */
function viewDetail(id) {
  const item = usulanList.find(u => u.id === id);
  if (!item) return;

  document.getElementById("dtl-timestamp").textContent = item.timestamp;
  document.getElementById("dtl-judul").textContent = item.judul;
  document.getElementById("dtl-urgensi").textContent = item.urgensi;
  document.getElementById("dtl-ruang-lingkup").textContent = item.ruangLingkup;
  document.getElementById("dtl-dasar-hukum").textContent = item.dasarHukum;
  document.getElementById("dtl-is-delegasi").textContent = item.isDelegasi;
  document.getElementById("dtl-delegasi-text").textContent = item.delegasiText;

  document.getElementById("dtl-opd").textContent = item.opd;
  document.getElementById("dtl-pic").textContent = item.pic;
  document.getElementById("dtl-wa").textContent = item.wa;
  document.getElementById("dtl-wa-link").href = `https://wa.me/62${item.wa.replace(/^0+/, '')}`;

  document.getElementById("dtl-jenis").textContent = item.jenis;
  document.getElementById("dtl-sifat").textContent = item.statusRegulasi;
  document.getElementById("dtl-lama").textContent = item.peraturanLama || "N/A";
  document.getElementById("dtl-target").textContent = item.targetSelesai;

  const statusEl = document.getElementById("dtl-status");
  statusEl.textContent = item.status;
  const st = item.status.toLowerCase().replace(/\s+/g, '-');
  statusEl.className = `badge-status status-${st}`;

  document.getElementById("dtl-filename").textContent = item.fileName || "Kajian_Teknis.pdf";

  // Setup tombol edit di detail
  const editBtn = document.getElementById("dtl-btn-edit");
  editBtn.setAttribute("onclick", `editUsulan('${item.id}')`);

  // Render timeline history di Detail
  const timelineEl = document.getElementById("dtl-timeline");
  timelineEl.innerHTML = "";
  if (item.timeline && item.timeline.length > 0) {
    item.timeline.forEach(t => {
      const cls = t.title.includes("Perbaiki") || t.title.includes("Perbaikan") ? "rejected" : (t.completed ? "completed" : "");
      timelineEl.innerHTML += `
        <li class="timeline-item ${cls}">
          <div class="timeline-time"><i class="bi bi-clock me-1"></i>${t.time}</div>
          <div class="timeline-title">${t.title}</div>
          <div class="timeline-desc">${t.desc}</div>
        </li>
      `;
    });
  } else {
    timelineEl.innerHTML = `<li class="text-muted small">Belum ada riwayat aktivitas.</li>`;
  }

  applyRbac();
  switchPage("page-detail");
}

function simulateDownload(event) {
  event.preventDefault();
  Swal.fire({
    title: "Mengunduh Berkas Lampiran...",
    text: "Mendownload dari Google Drive Serverless Storage.",
    icon: "info",
    timer: 1500,
    showConfirmButton: false
  }).then(() => {
    showToast("Berkas kajian selesai diunduh.", "success");
  });
}

// ============================================================================
// 6. MONITORING PROGRES & STEPPER WORKFLOW ENGINE
// ============================================================================

function populateMonitoringSelector() {
  const sel = document.getElementById("monitoring-selector");
  if (!sel) return;

  sel.innerHTML = '<option value="">-- Pilih Rancangan Regulasi yang Ingin Dimonitor --</option>';

  let list = usulanList;
  if (currentUser.role === "opd") {
    list = usulanList.filter(u => u.opd === currentUser.opd);
  }

  list.forEach(u => {
    const isSel = currentMonitoringId === u.id ? "selected" : "";
    sel.innerHTML += `<option value="${u.id}" ${isSel}>[${u.id}] - ${u.judul.substring(0, 75)}... (${u.status})</option>`;
  });

  // Jika belum ada yg terpilih dan list tidak kosong, pilih yang pertama
  if (!currentMonitoringId && list.length > 0) {
    currentMonitoringId = list[0].id;
    sel.value = currentMonitoringId;
  }

  handleMonitoringSelect();
}

function handleMonitoringSelect() {
  const sel = document.getElementById("monitoring-selector");
  currentMonitoringId = sel.value;

  const item = usulanList.find(u => u.id === currentMonitoringId);
  if (!item) {
    document.getElementById("mon-judul").textContent = "Pilih Regulasi Di Atas";
    document.getElementById("mon-opd").textContent = "-";
    document.getElementById("mon-desc").textContent = "Silakan pilih rancangan regulasi pada dropdown di atas untuk melihat keterangan progres teknis.";
    document.getElementById("stepper-bar").style.width = "0%";
    document.getElementById("mon-percent").textContent = "0%";
    document.getElementById("mon-percent-bar").style.width = "0%";
    document.getElementById("mon-history-list").innerHTML = '<span class="text-muted small">Belum ada catatan aktivitas.</span>';
    return;
  }

  document.getElementById("mon-opd").textContent = item.opd;
  document.getElementById("mon-judul").textContent = item.judul;
  document.getElementById("mon-desc").innerHTML = `<strong>Urgensi & Substansi:</strong> ${item.urgensi} <br><strong class="mt-1 d-inline-block">Target Selesai:</strong> <span class="text-danger fw-bold">${item.targetSelesai}</span>`;

  const stBadge = document.getElementById("mon-status-badge");
  stBadge.textContent = item.status;
  stBadge.className = `badge-status status-${item.status.toLowerCase().replace(/\s+/g, '-')}`;

  // Calculate step & percentage
  let step = item.step || 1;
  const statusToStep = {
    "Draft": 1, "Diverifikasi": 2, "Perlu Perbaikan": 3,
    "Harmonisasi": 4, "Pembahasan": 5, "Persetujuan": 6,
    "Penetapan": 7, "Selesai": 8
  };
  if (statusToStep[item.status]) {
    step = statusToStep[item.status];
  }

  const percent = Math.round((step / 8) * 100);
  document.getElementById("mon-percent").textContent = `${percent}%`;
  document.getElementById("mon-percent-bar").style.width = `${percent}%`;

  // Stepper Bar width (7 intervals between 8 steps -> each is ~14.28%)
  const barWidth = Math.round(((step - 1) / 7) * 100);
  document.getElementById("stepper-bar").style.width = `${barWidth}%`;

  // Update classes step 1..8
  for (let i = 1; i <= 8; i++) {
    const el = document.getElementById(`step-${i}`);
    el.classList.remove("active", "completed", "rejected");
    if (i < step) {
      el.classList.add("completed");
    } else if (i === step) {
      el.classList.add("active");
      if (item.status === "Perlu Perbaikan") el.classList.add("rejected");
    }
  }

  // Render History Timeline
  const histList = document.getElementById("mon-history-list");
  const histCount = document.getElementById("mon-history-count");
  if (item.timeline && item.timeline.length > 0) {
    histCount.textContent = `${item.timeline.length} Aktivitas`;
    let html = `<ul class="timeline-list m-0">`;
    item.timeline.forEach(t => {
      const cls = t.title.includes("Perbaiki") || t.title.includes("Perbaikan") ? "rejected" : (t.completed ? "completed" : "");
      html += `
        <li class="timeline-item ${cls}">
          <div class="timeline-time"><i class="bi bi-clock me-1"></i>${t.time}</div>
          <div class="timeline-title">${t.title}</div>
          <div class="timeline-desc">${t.desc}</div>
        </li>
      `;
    });
    html += `</ul>`;
    histList.innerHTML = html;
  } else {
    histCount.textContent = "0 Aktivitas";
    histList.innerHTML = '<span class="text-muted small">Belum ada catatan aktivitas.</span>';
  }
}

function previewStepInfo(stepNum) {
  const stepNames = [
    "Tahap 1: Draft Diajukan (Operator OPD mendaftarkan naskah akademik)",
    "Tahap 2: Diverifikasi (Bagian Hukum memeriksa kelengkapan form administrasi)",
    "Tahap 3: Perlu Perbaikan (OPD memperbaiki catatan/revisi yang diminta)",
    "Tahap 4: Harmonisasi (Sinkronisasi di Kanwil Kemenkumham Provinsi)",
    "Tahap 5: Pembahasan Bersama (Rapat Panitia Khusus DPRD / Tim Pakar)",
    "Tahap 6: Persetujuan Bersama (Paripurna DPRD dan Evaluasi Gubernur)",
    "Tahap 7: Penetapan & Pengundangan (Penandatanganan oleh Bupati Pasaman)",
    "Tahap 8: Selesai Disahkan (Diundangkan dalam Lembaran/Berita Daerah)"
  ];
  showToast(`Keterangan ${stepNames[stepNum - 1]}`, "info");
}

function openUpdateStatusModal() {
  if (!currentMonitoringId) {
    Swal.fire("Pilih Regulasi!", "Silakan pilih dokumen regulasi yang ingin diupdate terlebih dahulu.", "warning");
    return;
  }
  const item = usulanList.find(u => u.id === currentMonitoringId);
  document.getElementById("modal-status-id").value = item.id;
  document.getElementById("modal-status-judul").value = item.judul;
  document.getElementById("modal-status-catatan").value = "";

  const modal = new bootstrap.Modal(document.getElementById("modalUpdateStatus"));
  modal.show();
}

function submitUpdateStatus(event) {
  event.preventDefault();
  const id = document.getElementById("modal-status-id").value;
  const newSt = document.getElementById("modal-new-status").value;
  const catatan = document.getElementById("modal-status-catatan").value;

  const item = usulanList.find(u => u.id === id);
  if (!item) return;

  const statusToStep = {
    "Draft": 1, "Diverifikasi": 2, "Perlu Perbaikan": 3,
    "Harmonisasi": 4, "Pembahasan": 5, "Persetujuan": 6,
    "Penetapan": 7, "Selesai": 8
  };

  item.status = newSt;
  item.step = statusToStep[newSt] || item.step;

  const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);
  if (!item.timeline) item.timeline = [];

  item.timeline.unshift({
    step: item.step,
    title: `Progres: ${newSt}`,
    time: nowStr,
    desc: `[${currentUser.nama}]: ${catatan}`,
    completed: newSt !== "Perlu Perbaikan"
  });

  saveToStorage("propemperda_usulan", usulanList);
  executeGasPost("updateStatus", { id: id, status: newSt, note: catatan });
  logActivity(currentUser.username, "UPDATE STATUS", `Mengubah status [${id}] menjadi ${newSt}`);

  const modalEl = document.getElementById("modalUpdateStatus");
  bootstrap.Modal.getInstance(modalEl).hide();

  Swal.fire({
    icon: "success",
    title: "Tahapan Berhasil Diperbarui!",
    text: `Status dokumen ${id} telah maju ke tahap: ${newSt}`,
    timer: 1800,
    showConfirmButton: false
  });

  handleMonitoringSelect();
}

function quickRejectUsulan() {
  if (!currentMonitoringId) {
    Swal.fire("Pilih Regulasi!", "Silakan pilih rancangan regulasi terlebih dahulu.", "warning");
    return;
  }
  const item = usulanList.find(u => u.id === currentMonitoringId);

  Swal.fire({
    title: "Kembalikan untuk Perbaikan?",
    input: "textarea",
    inputLabel: "Catatan Kekurangan / Revisi untuk OPD Pemrakarsa:",
    inputPlaceholder: "Tuliskan poin-poin yang harus diperbaiki pada naskah...",
    inputAttributes: {
      "aria-label": "Tuliskan catatan revisi"
    },
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Kirim Instruksi Perbaikan",
    cancelButtonText: "Batal",
    preConfirm: (text) => {
      if (!text) {
        Swal.showValidationMessage("Catatan perbaikan wajib diisi!");
      }
      return text;
    }
  }).then((result) => {
    if (result.isConfirmed) {
      item.status = "Perlu Perbaikan";
      item.step = 3;
      const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);
      if (!item.timeline) item.timeline = [];

      item.timeline.unshift({
        step: 3,
        title: "Perbaikan Dinstruksikan",
        time: nowStr,
        desc: `[Bagian Hukum - ${currentUser.nama}]: ${result.value}`,
        completed: false
      });

      saveToStorage("propemperda_usulan", usulanList);
      logActivity(currentUser.username, "REJECT USULAN", `Mengembalikan usulan [${item.id}] untuk revisi.`);

      showToast("Instruksi perbaikan telah dikirim ke OPD pemrakarsa.", "warning");
      handleMonitoringSelect();
    }
  });
}

// ============================================================================
// 7. LAPORAN REKAPITULASI (REPORTING ENGINE)
// ============================================================================

function renderLaporanTable() {
  const tbody = document.getElementById("lap-table-body");
  const countBadge = document.getElementById("lap-total-count");
  if (!tbody) return;

  const fOpd = document.getElementById("lap-filter-opd").value;
  const fStatus = document.getElementById("lap-filter-status").value;
  const fJenis = document.getElementById("lap-filter-jenis").value;

  let filtered = usulanList;
  if (currentUser.role === "opd") {
    filtered = usulanList.filter(u => u.opd === currentUser.opd);
  }
  if (fOpd) filtered = filtered.filter(u => u.opd === fOpd);
  if (fStatus) filtered = filtered.filter(u => u.status === fStatus);
  if (fJenis) filtered = filtered.filter(u => u.jenis === fJenis);

  countBadge.textContent = `${filtered.length} Data`;
  tbody.innerHTML = "";

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Belum ada data regulasi yang memenuhi kriteria filter laporan.</td></tr>`;
    return;
  }

  filtered.forEach((item, idx) => {
    let stCls = "status-draft";
    const st = item.status.toLowerCase().replace(/\s+/g, '-');
    if (st) stCls = "status-" + st;

    const tr = `
      <tr>
        <td class="text-center fw-bold">${idx + 1}</td>
        <td><span class="fw-bold text-main d-block">${item.opd}</span><small class="text-muted">PIC: ${item.pic}</small></td>
        <td><strong class="d-block text-primary">${item.judul}</strong><small class="text-secondary">No. ID: ${item.id}</small></td>
        <td><span class="badge ${item.jenis.includes('Perda') ? 'bg-primary' : 'bg-info text-dark'}">${item.jenis.includes('Perda') ? 'Perda' : 'Perkada'}</span><br><small class="text-muted">${item.statusRegulasi}</small></td>
        <td class="text-center fw-medium text-danger">${item.targetSelesai}</td>
        <td class="text-center"><span class="badge-status ${stCls}">${item.status}</span></td>
      </tr>
    `;
    tbody.insertAdjacentHTML("beforeend", tr);
  });
}

function exportToCSV() {
  let filtered = usulanList;
  if (currentUser.role === "opd") {
    filtered = usulanList.filter(u => u.opd === currentUser.opd);
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "No,ID Usulan,OPD Pemrakarsa,PIC,No WhatsApp,Jenis Regulasi,Sifat,Judul Peraturan,Target Selesai,Status Terkini\n";

  filtered.forEach((item, idx) => {
    const cleanJudul = `"${item.judul.replace(/"/g, '""')}"`;
    const cleanOpd = `"${item.opd}"`;
    const row = `${idx + 1},${item.id},${cleanOpd},"${item.pic}",${item.wa},"${item.jenis}",${item.statusRegulasi},${cleanJudul},${item.targetSelesai},${item.status}`;
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Rekap_PROPemperda_Pasaman_${new Date().toISOString().substring(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  logActivity(currentUser.username, "EXPORT CSV", "Mengekspor laporan rekap ke format CSV.");
  showToast("Laporan berhasil diekspor ke berkas CSV/Excel.", "success");
}

function printReport() {
  logActivity(currentUser.username, "PRINT REPORT", "Mencetak laporan rekapitulasi PROPemperda.");
  window.print();
}

// ============================================================================
// 8. MASTER DATA & AUDIT LOGS
// ============================================================================

function renderMasterOpd() {
  const tbody = document.getElementById("master-opd-body");
  if (!tbody) return;

  tbody.innerHTML = "";
  masterOpdList.forEach((o, idx) => {
    tbody.innerHTML += `
      <tr>
        <td class="text-center fw-bold">${idx + 1}</td>
        <td><span class="badge bg-secondary bg-opacity-10 text-secondary border px-3 py-1.5 fw-bold font-monospace">${o.kode}</span></td>
        <td class="fw-bold text-main fs-6">${o.nama}</td>
        <td class="text-center text-nowrap">
          <button class="btn btn-sm btn-outline-primary rounded-pill px-3 me-1" onclick="editOpd(${idx})" title="Edit OPD"><i class="bi bi-pencil me-1"></i> Edit</button>
          <button class="btn btn-sm btn-outline-danger rounded-pill px-3" onclick="deleteOpd(${idx})" title="Hapus OPD"><i class="bi bi-trash me-1"></i> Hapus</button>
        </td>
      </tr>
    `;
  });
}

function openAddOpdModal() {
  document.getElementById("formAddOpd").reset();
  document.getElementById("modal-opd-index").value = "";
  const titleEl = document.getElementById("modalOpdTitle");
  if (titleEl) titleEl.innerHTML = `<i class="bi bi-building me-2"></i>Tambah Perangkat Daerah Baru`;
  const btnEl = document.getElementById("btnSaveOpd");
  if (btnEl) btnEl.innerHTML = `Simpan OPD`;
  const modal = new bootstrap.Modal(document.getElementById("modalAddOpd"));
  modal.show();
}

function editOpd(index) {
  const opd = masterOpdList[index];
  if (!opd) return;
  document.getElementById("modal-opd-index").value = index;
  document.getElementById("inp-opd-kode").value = opd.kode;
  document.getElementById("inp-opd-nama").value = opd.nama;

  const titleEl = document.getElementById("modalOpdTitle");
  if (titleEl) titleEl.innerHTML = `<i class="bi bi-pencil-square me-2"></i>Edit Perangkat Daerah`;
  const btnEl = document.getElementById("btnSaveOpd");
  if (btnEl) btnEl.innerHTML = `Perbarui OPD <i class="bi bi-check-lg ms-1"></i>`;

  const modal = new bootstrap.Modal(document.getElementById("modalAddOpd"));
  modal.show();
}

function saveOpd(event) {
  event.preventDefault();
  const indexStr = document.getElementById("modal-opd-index").value;
  const kode = document.getElementById("inp-opd-kode").value.trim().toUpperCase();
  const nama = document.getElementById("inp-opd-nama").value.trim();

  if (indexStr !== "") {
    const idx = parseInt(indexStr);
    const oldNama = masterOpdList[idx].nama;
    const oldKode = masterOpdList[idx].kode;
    masterOpdList[idx] = { kode, nama };

    // Update data usulan dan user jika nama OPD berubah agar konsisten
    if (oldNama !== nama) {
      usulanList.forEach(u => {
        if (u.opd === oldNama) u.opd = nama;
      });
      masterUserList.forEach(u => {
        if (u.opd === oldNama) u.opd = nama;
      });
      saveToStorage("propemperda_usulan", usulanList);
      saveToStorage("propemperda_users", masterUserList);
    }

    saveToStorage("propemperda_opds", masterOpdList);
    executeGasPost("updateOpd", { oldKode: oldKode, opdData: masterOpdList[idx] });
    logActivity(currentUser.username, "UPDATE MASTER OPD", `Memperbarui OPD [${kode}] ${nama}`);
    showToast("Perangkat Daerah berhasil diperbarui.", "success");
  } else {
    masterOpdList.push({ kode, nama });
    saveToStorage("propemperda_opds", masterOpdList);
    executeGasPost("createOpd", { opdData: { kode, nama } });
    logActivity(currentUser.username, "ADD MASTER OPD", `Menambah OPD baru: [${kode}] ${nama}`);
    showToast("Perangkat Daerah berhasil ditambahkan.", "success");
  }

  const modalEl = document.getElementById("modalAddOpd");
  bootstrap.Modal.getInstance(modalEl).hide();

  renderMasterOpd();
  populateDropdowns();
}

function deleteOpd(index) {
  const opd = masterOpdList[index];
  Swal.fire({
    title: `Hapus ${opd.kode}?`,
    text: `OPD "${opd.nama}" akan dihapus dari daftar master.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal"
  }).then((result) => {
    if (result.isConfirmed) {
      const oToDelete = masterOpdList[index].kode;
      masterOpdList.splice(index, 1);
      saveToStorage("propemperda_opds", masterOpdList);
      executeGasPost("deleteOpd", { kode: oToDelete });
      renderMasterOpd();
      populateDropdowns();
      showToast("OPD telah dihapus.", "info");
    }
  });
}

function renderMasterUsers() {
  const tbody = document.getElementById("master-user-body");
  if (!tbody) return;

  tbody.innerHTML = "";
  masterUserList.forEach((u, idx) => {
    let roleBadge = "bg-secondary";
    if (u.role === "admin") roleBadge = "bg-primary";
    if (u.role === "hukum") roleBadge = "bg-success";
    if (u.role === "pimpinan") roleBadge = "bg-warning text-dark";

    tbody.innerHTML += `
      <tr>
        <td class="text-center fw-bold">${idx + 1}</td>
        <td><strong class="text-primary font-monospace">${u.username}</strong></td>
        <td class="fw-bold">${u.nama}</td>
        <td><span class="badge ${roleBadge} px-3 py-1.5">${getRoleLabel(u.role)}</span></td>
        <td class="small text-muted">${u.opd}</td>
        <td class="text-center text-nowrap">
          <button class="btn btn-sm btn-outline-primary rounded-circle me-1" onclick="editUser(${idx})" title="Edit Akun"><i class="bi bi-pencil"></i></button>
          ${idx > 3 ? `<button class="btn btn-sm btn-outline-danger rounded-circle" onclick="deleteUser(${idx})" title="Hapus Akun"><i class="bi bi-trash"></i></button>` : `<span class="badge bg-light text-muted border">Default</span>`}
        </td>
      </tr>
    `;
  });
}

function openAddUserModal() {
  document.getElementById("formAddUser").reset();
  document.getElementById("modal-user-index").value = "";
  const titleEl = document.getElementById("modalUserTitle");
  if (titleEl) titleEl.innerHTML = `<i class="bi bi-person-plus-fill me-2"></i>Tambah Akun Pengguna Baru`;
  const btnEl = document.getElementById("btnSaveUser");
  if (btnEl) btnEl.innerHTML = `Simpan Akun`;
  document.getElementById("inp-user-username").readOnly = false;

  const opdSel = document.getElementById("inp-user-opd");
  opdSel.innerHTML = "";
  masterOpdList.forEach(o => {
    opdSel.innerHTML += `<option value="${o.nama}">${o.nama}</option>`;
  });
  toggleUserOpdSelect();
  const modal = new bootstrap.Modal(document.getElementById("modalAddUser"));
  modal.show();
}

function editUser(index) {
  const u = masterUserList[index];
  if (!u) return;

  const opdSel = document.getElementById("inp-user-opd");
  opdSel.innerHTML = "";
  masterOpdList.forEach(o => {
    opdSel.innerHTML += `<option value="${o.nama}">${o.nama}</option>`;
  });

  document.getElementById("modal-user-index").value = index;
  document.getElementById("inp-user-username").value = u.username;
  document.getElementById("inp-user-username").readOnly = (index <= 3); // Jangan ubah username default
  document.getElementById("inp-user-password").value = u.password;
  document.getElementById("inp-user-nama").value = u.nama;
  document.getElementById("inp-user-role").value = u.role;
  toggleUserOpdSelect();
  if (u.role === "opd") {
    document.getElementById("inp-user-opd").value = u.opd;
  }

  const titleEl = document.getElementById("modalUserTitle");
  if (titleEl) titleEl.innerHTML = `<i class="bi bi-pencil-square me-2"></i>Edit Akun Pengguna`;
  const btnEl = document.getElementById("btnSaveUser");
  if (btnEl) btnEl.innerHTML = `Perbarui Akun <i class="bi bi-check-lg ms-1"></i>`;

  const modal = new bootstrap.Modal(document.getElementById("modalAddUser"));
  modal.show();
}

function toggleUserOpdSelect() {
  const role = document.getElementById("inp-user-role").value;
  const box = document.getElementById("div-user-opd");
  if (role === "opd") {
    box.style.display = "block";
  } else {
    box.style.display = "none";
  }
}

function saveUser(event) {
  event.preventDefault();
  const indexStr = document.getElementById("modal-user-index").value;
  const username = document.getElementById("inp-user-username").value.trim();
  const password = document.getElementById("inp-user-password").value.trim();
  const nama = document.getElementById("inp-user-nama").value.trim();
  const role = document.getElementById("inp-user-role").value;
  let opd = "Semua OPD";
  if (role === "opd") {
    opd = document.getElementById("inp-user-opd").value;
  } else if (role === "hukum") {
    opd = "Bagian Hukum Setda Kabupaten Pasaman";
  } else if (role === "pimpinan") {
    opd = "Pimpinan / Sekretariat Daerah";
  }

  if (indexStr !== "") {
    const idx = parseInt(indexStr);
    if (masterUserList.some((u, i) => u.username === username && i !== idx)) {
      Swal.fire("Username Sudah Ada!", "Gunakan username lain yang belum terdaftar.", "error");
      return;
    }
    const oldU = masterUserList[idx].username;
    masterUserList[idx] = { username, password, nama, role, opd };
    saveToStorage("propemperda_users", masterUserList);
    executeGasPost("updateUser", { oldUsername: oldU, userData: masterUserList[idx] });
    logActivity(currentUser.username, "UPDATE USER", `Memperbarui akun [${username}] role ${role}`);
    showToast(`Akun [${username}] berhasil diperbarui.`, "success");
  } else {
    if (masterUserList.some(u => u.username === username)) {
      Swal.fire("Username Sudah Ada!", "Gunakan username lain yang belum terdaftar.", "error");
      return;
    }
    masterUserList.push({ username, password, nama, role, opd });
    saveToStorage("propemperda_users", masterUserList);
    executeGasPost("createUser", { userData: { username, password, nama, role, opd } });
    logActivity(currentUser.username, "ADD USER", `Membuat akun baru [${username}] role ${role}`);
    showToast(`Akun [${username}] berhasil dibuat.`, "success");
  }

  const modalEl = document.getElementById("modalAddUser");
  bootstrap.Modal.getInstance(modalEl).hide();

  renderMasterUsers();
}

function deleteUser(index) {
  const u = masterUserList[index];
  Swal.fire({
    title: `Hapus Akun ${u.username}?`,
    text: `Akun "${u.nama}" tidak dapat digunakan lagi.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal"
  }).then((result) => {
    if (result.isConfirmed) {
      const uToDelete = masterUserList[index].username;
      masterUserList.splice(index, 1);
      saveToStorage("propemperda_users", masterUserList);
      executeGasPost("deleteUser", { username: uToDelete });
      renderMasterUsers();
      showToast("Akun telah dihapus.", "info");
    }
  });
}

function renderAuditLogs() {
  const tbody = document.getElementById("master-log-body");
  if (!tbody) return;

  tbody.innerHTML = "";
  auditLogs.forEach(l => {
    let actBadge = "bg-secondary";
    if (l.action && (l.action.includes("LOGIN") || l.action.includes("INIT"))) actBadge = "bg-info text-dark";
    if (l.action && (l.action.includes("CREATE") || l.action.includes("ADD") || l.action.includes("RESTORE"))) actBadge = "bg-success";
    if (l.action && (l.action.includes("UPDATE") || l.action.includes("VERIFIKASI"))) actBadge = "bg-primary";
    if (l.action && (l.action.includes("DELETE") || l.action.includes("REJECT") || l.action.includes("UNAUTHORIZED") || l.action.includes("EMPTY"))) actBadge = "bg-danger";

    const stBadge = l.status && l.status.includes("Gagal") ? "bg-danger bg-opacity-10 text-danger" : "bg-success bg-opacity-10 text-success";

    tbody.innerHTML += `
      <tr>
        <td class="font-monospace small text-muted text-nowrap">${l.time || "-"}</td>
        <td><strong class="text-primary">${l.user || "-"}</strong></td>
        <td><span class="badge bg-secondary bg-opacity-10 text-secondary border small">${l.role || (currentUser ? currentUser.role : "system")}</span></td>
        <td class="font-monospace small text-muted">${l.ip || "127.0.0.1"}</td>
        <td><span class="badge ${actBadge} px-2 py-1 small">${l.action || "-"}</span></td>
        <td><span class="badge ${stBadge} px-2 py-1 small">${l.status || "Berhasil"}</span></td>
        <td class="font-monospace small text-main">${l.target || "-"}</td>
        <td class="small text-secondary">${l.desc || "-"}</td>
      </tr>
    `;
  });
}

function logActivity(user, action, desc, status = "Berhasil", target = "-") {
  const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);
  const logEntry = {
    time: nowStr,
    user: user,
    role: currentUser ? currentUser.role : "system",
    ip: "Client-Browser",
    action: action,
    status: status,
    target: target,
    desc: desc
  };
  auditLogs.unshift(logEntry);
  if (auditLogs.length > 100) auditLogs.pop(); // Keep last 100
  saveToStorage("propemperda_logs", auditLogs);
  executeGasPost("logActivity", logEntry);
}

function clearAuditLogs() {
  if (currentUser && currentUser.role !== "admin") {
    showAccessDenied("Hanya Super Admin yang dapat membersihkan riwayat Audit Log.");
    return;
  }
  Swal.fire({
    title: "Bersihkan Semua Audit Log?",
    text: "Catatan riwayat aktivitas sistem akan dikosongkan.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    confirmButtonText: "Ya, Bersihkan!",
    cancelButtonText: "Batal"
  }).then((result) => {
    if (result.isConfirmed) {
      auditLogs = [];
      saveToStorage("propemperda_logs", auditLogs);
      renderAuditLogs();
      showToast("Audit log telah dibersihkan.", "success");
    }
  });
}

// ============================================================================
// TRASH & RESTORE MANAGEMENT (RBAC: Super Admin Only)
// ============================================================================

function renderTrashTable() {
  const tbody = document.getElementById("master-trash-body");
  if (!tbody) return;

  tbody.innerHTML = "";
  if (!trashList || trashList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4"><i class="bi bi-trash3 me-2"></i>Tempat sampah kosong. Tidak ada dokumen yang dihapus.</td></tr>`;
    return;
  }

  trashList.forEach((item, idx) => {
    tbody.innerHTML += `
      <tr>
        <td class="text-center font-monospace">${idx + 1}</td>
        <td><span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25">${item.id}</span></td>
        <td><strong class="text-main">${item.judul}</strong></td>
        <td><span class="badge bg-secondary">${item.opd}</span></td>
        <td class="font-monospace small text-muted">${item.delTime || "-"}</td>
        <td><span class="badge bg-dark">${item.deletedBy || "admin"}</span></td>
        <td class="text-center">
          <button class="btn btn-sm btn-success rounded-pill px-3 shadow-sm" onclick="restoreUsulan('${item.id}')" title="Kembalikan Dokumen">
            <i class="bi bi-arrow-counterclockwise me-1"></i> Restore
          </button>
        </td>
      </tr>
    `;
  });
}

function restoreUsulan(id) {
  if (currentUser.role !== "admin") {
    showAccessDenied("Hanya Super Admin yang berhak merestore dokumen dari tempat sampah.");
    return;
  }
  const idx = trashList.findIndex(t => t.id === id);
  if (idx === -1) return;
  const item = trashList[idx];

  Swal.fire({
    title: `Restore Dokumen [${id}]?`,
    text: `Dokumen "${item.judul.substring(0, 50)}..." akan dikembalikan ke daftar usulan aktif.`,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#198754",
    confirmButtonText: "Ya, Restore Sekarang!",
    cancelButtonText: "Batal"
  }).then((result) => {
    if (result.isConfirmed) {
      trashList.splice(idx, 1);
      delete item.delTime;
      delete item.deletedBy;
      usulanList.unshift(item);

      saveToStorage("propemperda_trash", trashList);
      saveToStorage("propemperda_usulan", usulanList);
      executeGasPost("restoreUsulan", { id: id, data: item });
      logActivity(currentUser.username, "RESTORE USULAN", `Mengekstraksi kembali dokumen [${id}] dari Trash ke daftar aktif.`, "Berhasil", id);

      renderTrashTable();
      renderUsulanTable();
      renderDashboardStats();
      showToast(`Dokumen [${id}] berhasil dikembalikan.`, "success");
    }
  });
}

function emptyTrash() {
  if (currentUser && currentUser.role !== "admin") {
    showAccessDenied("Hanya Super Admin yang berhak mengosongkan Trash.");
    return;
  }
  if (!trashList || trashList.length === 0) {
    Swal.fire("Tempat Sampah Kosong", "Tidak ada berkas yang perlu dihapus permanen.", "info");
    return;
  }

  Swal.fire({
    title: "Kosongkan Tempat Sampah?",
    text: `Sebanyak ${trashList.length} dokumen akan dihapus secara PERMANEN dan tidak dapat dipulihkan lagi!`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    confirmButtonText: "Ya, Kosongkan Permanen!",
    cancelButtonText: "Batal"
  }).then((result) => {
    if (result.isConfirmed) {
      trashList = [];
      saveToStorage("propemperda_trash", trashList);
      executeGasPost("emptyTrash", {});
      logActivity(currentUser.username, "EMPTY TRASH", "Mengosongkan seluruh isi tempat sampah (trash) secara permanen.", "Berhasil", "Trash");
      renderTrashTable();
      showToast("Tempat sampah berhasil dikosongkan permanen.", "success");
    }
  });
}

// ============================================================================
// 9. GOOGLE APPS SCRIPT (GAS) INTEGRATION HELPERS
// ============================================================================

function testGasConnection() {
  const url = document.getElementById("gas-url-input").value.trim();
  if (!url) {
    Swal.fire("URL GAS Kosong!", "Tempelkan Web App URL dari Google Apps Script terlebih dahulu.", "warning");
    return;
  }

  Swal.fire({
    title: "Mengecek Koneksi GAS...",
    text: "Melakukan ping ke Google Serverless API",
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  // Test fetch API ping to GAS backend
  fetch(url + "?action=ping")
    .then(res => res.json())
    .then(data => {
      if (data.success || data.spreadsheetId) {
        localStorage.setItem("propemperda_gas_url", url);
        Swal.fire({
          icon: "success",
          title: "Koneksi Backend Berhasil!",
          html: `Terhubung sempurna ke Google Apps Script Backend.<br><br><span class="badge bg-dark text-warning font-monospace">Spreadsheet ID: ${data.spreadsheetId || SPREADSHEET_ID}</span><br><small class="text-muted mt-2 d-block">${data.message || "PROPemperda Database Active"}</small>`,
          confirmButtonColor: "var(--primary-color)"
        });
        syncWithGoogleSheets();
      } else {
        Swal.fire({
          icon: "warning",
          title: "Respons Tidak Dikenali",
          text: "Endpoint merespons, namun format tidak sesuai. Pastikan Anda mendeploy script Code.gs PROPemperda terbaru.",
          confirmButtonColor: "#ffc107"
        });
      }
    })
    .catch(err => {
      // Karena masalah CORS saat test direct tanpa deploy valid, simpan URL ke localStorage
      localStorage.setItem("propemperda_gas_url", url);
      Swal.fire({
        icon: "info",
        title: "URL GAS Telah Disimpan!",
        text: "Koneksi ke endpoint Google Apps Script telah diatur. Pastikan akses deployment Web App di Google Apps Script diatur ke 'Anyone' (Siapa saja).",
        confirmButtonColor: "var(--primary-color)"
      });
      syncWithGoogleSheets();
    });
}

function copyGasCode() {
  const codeEl = document.querySelector(".code-snippet-box pre code");
  if (codeEl) {
    navigator.clipboard.writeText(codeEl.innerText).then(() => {
      showToast("Kode backend Code.gs berhasil disalin ke clipboard!", "success");
    }).catch(() => {
      showToast("Gagal menyalin kode. Silakan blok dan salin manual.", "warning");
    });
  }
}

function seedToGas() {
  if (currentUser && currentUser.role !== "admin") {
    showAccessDenied("Hanya Super Admin yang dapat melakukan seeding data awal ke Google Sheets.");
    return;
  }
  let gasUrl = localStorage.getItem("propemperda_gas_url");
  const inputEl = document.getElementById("gas-url-input");
  if ((!gasUrl || !gasUrl.startsWith("http")) && inputEl && inputEl.value.trim().startsWith("http")) {
    gasUrl = inputEl.value.trim();
    localStorage.setItem("propemperda_gas_url", gasUrl);
  }

  if (!gasUrl || !gasUrl.startsWith("http")) {
    Swal.fire({
      title: "Koneksi GAS Belum Diatur",
      text: "Silakan tempelkan Web App URL dari Google Apps Script Anda di sini (yang berakhiran /exec):",
      input: "url",
      inputPlaceholder: "https://script.google.com/macros/s/.../exec",
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Simpan & Unggah Demo Data",
      cancelButtonText: "Batal",
      confirmButtonColor: "#0d6efd",
      inputValidator: (value) => {
        if (!value || !value.startsWith("http")) {
          return "URL tidak valid! Harus dimulai dengan https://script.google.com...";
        }
      }
    }).then((res) => {
      if (res.isConfirmed && res.value) {
        localStorage.setItem("propemperda_gas_url", res.value.trim());
        if (inputEl) inputEl.value = res.value.trim();
        seedToGas(); // Panggil kembali setelah URL tersimpan
      }
    });
    return;
  }

  Swal.fire({
    title: "Unggah Data Demo ke Google Sheets?",
    text: "Seluruh data contoh (3 Usulan Regulasi, 4 Akun Pengguna, dan Riwayat Log) akan dikirim langsung ke Google Spreadsheet Anda sebagai data contoh (seed data).",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#198754",
    confirmButtonText: "Ya, Unggah Sekarang!",
    cancelButtonText: "Batal"
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire({
        title: "Menulis ke Spreadsheet...",
        text: "Membuat tab sheet dan mengisi baris data contoh ke Google Sheets Anda.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const payload = {
        action: "seedDatabase",
        user: currentUser || { username: "admin", role: "admin" },
        usulan: usulanList || [],
        users: masterUserList || [],
        opds: masterOpdList || [],
        logs: auditLogs || []
      };

      fetch(gasUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          Swal.fire({
            icon: "success",
            title: "Data Contoh Berhasil Diunggah!",
            html: `Spreadsheet Anda kini telah terisi dengan data contoh resmi PROPemperda.<br><br><b>Rincian yang diisi:</b><br>• ${data.usulanCount || 0} baris Usulan Regulasi<br>• ${data.usersCount || 0} baris Akun Pengguna<br>• ${data.opdsCount || 0} baris Master OPD<br>• ${data.logsCount || 0} baris Audit Log<br><br><a href="${SPREADSHEET_URL}" target="_blank" class="btn btn-sm btn-outline-success mt-2 fw-bold"><i class="bi bi-box-arrow-up-right me-1"></i> Buka Spreadsheet Sekarang</a>`,
            confirmButtonColor: "#198754"
          });
          logActivity(currentUser.username, "SEED DATABASE", "Mengunggah data contoh (demo seed) ke Google Spreadsheet DB.");
        } else {
          Swal.fire("Gagal Mengunggah", (data && data.error) ? data.error : "Gagal memproses seeding ke database.", "error");
        }
      })
      .catch(err => {
        // Pada Vercel (cross-origin), browser sering memblokir pembacaan respons redirect POST 302 karena CORS meskipun penulisan ke Google Sheets sukses dilakukan.
        Swal.fire({
          icon: "success",
          title: "Sinyal Sinkronisasi Terkirim!",
          html: `Permintaan penulisan data contoh telah dikirimkan ke server Google Sheets.<br><br><i>Catatan Keamanan Vercel:</i> Karena proteksi CORS browser pada domain cloud, penulisan diproses di background. Silakan langsung cek Spreadsheet Anda.<br><br><a href="${SPREADSHEET_URL}" target="_blank" class="btn btn-sm btn-success mt-2 fw-bold"><i class="bi bi-box-arrow-up-right me-1"></i> Buka Google Sheets</a>`,
          confirmButtonColor: "#198754"
        });
        logActivity(currentUser.username, "SEED DATABASE", "Mengirim sinyal penulisan data contoh ke Google Sheets dari Vercel.");
      });
    }
  });
}
