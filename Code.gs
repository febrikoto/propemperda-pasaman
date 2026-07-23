/**
 * ============================================================================
 * GOOGLE APPS SCRIPT BACKEND (Code.gs) - PROPEMPERDA KABUPATEN PASAMAN
 * ============================================================================
 * SISTEM KEAMANAN DAN AUTENTIKASI BERBASIS PERAN (RBAC ENGINE)
 * Terkoneksi Langsung dengan Google Sheets Database:
 * https://docs.google.com/spreadsheets/d/1xDGpXMdDCDeHHCHNpZH-81Ie4Vo_KavZUTX92V26DIU/edit?gid=0#gid=0
 * ============================================================================
 */

const SPREADSHEET_ID = "1xDGpXMdDCDeHHCHNpZH-81Ie4Vo_KavZUTX92V26DIU";
const FOLDER_ID = "YOUR_GOOGLE_DRIVE_FOLDER_ID"; // Ganti dengan ID Folder Google Drive Anda jika ingin simpan file fisik
const SHEET_USULAN = "Data_Usulan";
const SHEET_TRASH = "Trash_Usulan";
const SHEET_USERS = "Master_Users";
const SHEET_OPD = "Master_OPD";
const SHEET_LOGS = "Audit_Log";

/**
 * Helper Fungsi Koneksi ke Spreadsheet Utama
 */
function getDb() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    Logger.log("Gagal membuka spreadsheet ID, mencoba active spreadsheet: " + e.toString());
    return SpreadsheetApp.getActiveSpreadsheet();
  }
}

/**
 * Handle GET Request dari Frontend
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "ping";
  var userRole = (e && e.parameter && e.parameter.role) ? e.parameter.role : "guest";
  var username = (e && e.parameter && e.parameter.user) ? e.parameter.user : "Anonymous";
  var userOpd = (e && e.parameter && e.parameter.opd) ? e.parameter.opd : "";
  var ip = (e && e.parameter && e.parameter.ip) ? e.parameter.ip : "Browser-Client";

  if (action === "ping") {
    return HtmlService.createHtmlOutput("<h3>PROPemperda Kabupaten Pasaman — RBAC Protected API Server Running (Connected to Sheet ID: " + SPREADSHEET_ID + ").</h3>");
  }

  // Validasi akses GET
  var val = validateRole(action, userRole, userOpd, userOpd);
  if (!val.valid) {
    logAudit(username, userRole, action, "Gagal (403 Forbidden)", "API Endpoint", val.error, ip);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      code: 403,
      error: val.error
    })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "getUsulanList") {
    var data = getUsulanList(userRole, userOpd);
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: data }))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (action === "getAuditLogs") {
    var logs = getAuditLogs();
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: logs }))
      .setMimeType(ContentService.MimeType.JSON);
  } else if (action === "getUsers") {
    var users = getUsers();
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: users })).setMimeType(ContentService.MimeType.JSON);
  } else if (action === "getOpds") {
    var opds = getOpds();
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: opds })).setMimeType(ContentService.MimeType.JSON); } else if (action === "getTrashList") {
    var trash = getTrashList();
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: trash }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Action unknown" }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST Request dari Frontend (CRUD & RBAC Enforced Actions)
 */
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || "unknown";
    var user = payload.user || { username: "Anonymous", role: "guest", opd: "" };
    var ip = payload.ip || "Browser-Client";
    var target = payload.target || payload.id || "System";

    // 1. Logika otentikasi login / logout secara khusus
    if (action === "logActivity") {
      logAudit(user.username, user.role, payload.activityType || "INFO", payload.status || "Berhasil", target, payload.desc || "", ip);
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Validasi RBAC Backend untuk setiap aksi CRUD
    var val = validateRole(action, user.role, user.opd, payload.opd || (payload.item && payload.item.opd) || user.opd, payload);
    if (!val.valid) {
      logAudit(user.username, user.role, action, "Gagal (403 Forbidden)", target, val.error, ip);
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        code: 403,
        error: "403 Access Denied: " + val.error
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Eksekusi Aksi berdasarkan Role yang Valid
    var result = { success: false, error: "Aksi tidak dipahami oleh server." };

    switch (action) {
      case "createUsulan":
        result = createUsulan(payload.item, user);
        logAudit(user.username, user.role, "CREATE USULAN", "Berhasil", result.id || target, "Menambah usulan baru: " + (payload.item.judul || "").substring(0, 40), ip);
        break;
      case "updateUsulan":
        result = updateUsulan(payload.item, user);
        logAudit(user.username, user.role, "UPDATE USULAN", "Berhasil", payload.item.id, "Memperbarui dokumen usulan.", ip);
        break;
      case "deleteUsulan":
        result = deleteUsulan(payload.id, user);
        logAudit(user.username, user.role, "DELETE USULAN", "Berhasil", payload.id, "Menghapus usulan ke Trash.", ip);
        break;
      case "restoreUsulan":
        result = restoreUsulan(payload.id, user);
        logAudit(user.username, user.role, "RESTORE USULAN", "Berhasil", payload.id, "Mengembalikan dokumen dari Trash.", ip);
        break;
      case "updateStatus":
        result = updateStatus(payload.id, payload.status, payload.note, user);
        logAudit(user.username, user.role, "UPDATE STATUS", "Berhasil", payload.id, "Mengubah status menjadi: " + payload.status, ip);
        break;
      case "uploadFile":
        result = uploadFile(payload.fileBase64, payload.fileName, payload.fileMime);
        logAudit(user.username, user.role, "UPLOAD FILE", "Berhasil", payload.fileName, "Mengunggah berkas kajian teknis.", ip);
        break;
      case "downloadFile":
        logAudit(user.username, user.role, "DOWNLOAD FILE", "Berhasil", payload.fileName || target, "Mendownload berkas lampiran.", ip);
        result = { success: true };
        break;
      case "exportPDF":
      case "exportExcel":
        logAudit(user.username, user.role, action.toUpperCase(), "Berhasil", "Laporan Rekap", "Mengekspor laporan ke format " + action.replace("export", ""), ip);
        result = { success: true };
        break;
      case "createUser":
        result = createUser(payload.userData);
        logAudit(user.username, user.role, "CREATE USER", "Berhasil", payload.userData.username, "Membuat akun baru role " + payload.userData.role, ip);
        break;
      case "updateUser":
        result = updateUser(payload.oldUsername, payload.userData);
        logAudit(user.username, user.role, "UPDATE USER", "Berhasil", payload.userData.username, "Memperbarui akun pengguna", ip);
        break;
      case "createOpd":
        result = createOpd(payload.opdData);
        logAudit(user.username, user.role, "CREATE OPD", "Berhasil", payload.opdData.kode, "Membuat OPD baru: " + payload.opdData.nama, ip);
        break;
      case "updateOpd":
        result = updateOpd(payload.oldKode, payload.opdData);
        logAudit(user.username, user.role, "UPDATE OPD", "Berhasil", payload.opdData.kode, "Memperbarui data OPD", ip);
        break;
      case "deleteOpd":
        result = deleteOpd(payload.kode);
        logAudit(user.username, user.role, "DELETE OPD", "Berhasil", payload.kode, "Menghapus OPD.", ip);
        break;
      case "deleteUser":
        result = deleteUser(payload.username);
        logAudit(user.username, user.role, "DELETE USER", "Berhasil", payload.username, "Menghapus akun pengguna.", ip);
        break;
      case "seedDatabase":
        result = seedDatabase(payload);
        logAudit(user.username, user.role, "SEED DATABASE", "Berhasil", "Spreadsheet DB", "Mengunggah data demo awal aplikasi ke Google Sheets.", ip);
        break;
      default:
        throw new Error("Action " + action + " tidak didukung oleh backend.");
    }

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      code: 500,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ============================================================================
 * ENGINE VALIDASI HAK AKSES (RBAC VALIDATOR)
 * ============================================================================
 */
function validateRole(action, role, userOpd, targetOpd, payload) {
  // Aksi publik / logging dasar diizinkan untuk semua peran (termasuk guest / sebelum login)
  if (action === "ping" || action === "logActivity" || action === "getUsulanList") {
    return { valid: true, error: null };
  }

  // 1. Super Admin: Akses penuh tanpa batas
  if (role === "admin") {
    return { valid: true, error: null };
  }

  // 2. Admin Bagian Hukum
  if (role === "hukum") {
    const hukumAllowed = [
      "getUsulanList", "createUsulan", "updateUsulan", "updateStatus",
      "uploadFile", "downloadFile", "exportPDF", "exportExcel"
    ];
    if (hukumAllowed.indexOf(action) !== -1) {
      return { valid: true, error: null };
    }
    return { valid: false, error: "Role Admin Hukum tidak diizinkan mengakses menu/fitur ini (" + action + ")." };
  }

  // 3. Operator OPD
  if (role === "opd") {
    const opdAllowed = [
      "getUsulanList", "createUsulan", "updateUsulan", "uploadFile", "downloadFile"
    ];
    if (opdAllowed.indexOf(action) === -1) {
      return { valid: false, error: "Role Operator OPD tidak diizinkan untuk aksi " + action + "." };
    }
    // Validasi kepemilikan data OPD
    if (targetOpd && targetOpd !== userOpd && targetOpd !== "Semua OPD") {
      return { valid: false, error: "Operator OPD hanya boleh mengakses/memanipulasi data OPD miliknya sendiri (" + userOpd + ")." };
    }
    // Jika updateUsulan, pastikan status masih Draft atau Perlu Perbaikan
    if (action === "updateUsulan" && payload && payload.item) {
      var st = payload.item.status || "";
      if (st !== "Draft" && st !== "Perlu Perbaikan") {
        return { valid: false, error: "Operator OPD tidak dapat mengedit usulan yang sudah diverifikasi (Status: " + st + ")." };
      }
    }
    return { valid: true, error: null };
  }

  // 4. Pimpinan (Monitoring Read-Only)
  if (role === "pimpinan") {
    const pimpinanAllowed = [
      "getUsulanList", "downloadFile", "exportPDF", "exportExcel"
    ];
    if (pimpinanAllowed.indexOf(action) !== -1) {
      return { valid: true, error: null };
    }
    return { valid: false, error: "Role Pimpinan bersifat Read-Only (Monitoring) dan tidak diizinkan melakukan aksi manipulasi data (" + action + ")." };
  }

  return { valid: false, error: "Role tidak terdaftar atau sesi tidak valid." };
}

/**
 * ============================================================================
 * AUDIT LOGGING SYSTEM
 * ============================================================================
 */
function logAudit(user, role, action, status, target, description, ip) {
  try {
    var ss = getDb();
    var sheet = ss.getSheetByName(SHEET_LOGS) || ss.insertSheet(SHEET_LOGS);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Username", "Role", "IP Address", "Aktivitas", "Status", "Target", "Keterangan"]);
      sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#0f172a").setFontColor("#ffffff");
    }

    var timestamp = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
    sheet.appendRow([timestamp, user, role, ip || "Client", action, status, target || "-", description || "-"]);
  } catch(e) {
    Logger.log("Audit log error: " + e.toString());
  }
}

function getAuditLogs() {
  var ss = getDb();
  var sheet = ss.getSheetByName(SHEET_LOGS);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  var data = sheet.getDataRange().getValues();
  data.shift(); // remove headers

  return data.map(function(row) {
    return {
      time: row[0],
      user: row[1],
      role: row[2],
      ip: row[3],
      action: row[4],
      status: row[5],
      target: row[6],
      desc: row[7]
    };
  }).reverse();
}

/**
 * ============================================================================
 * DATABASE CRUD LOGIC
 * ============================================================================
 */
function getUsulanList(role, opd) {
  var ss = getDb();
  var sheet = ss.getSheetByName(SHEET_USULAN);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  var data = sheet.getDataRange().getValues();
  data.shift();

  var list = data.map(function(row) {
    return {
      timestamp: row[0], id: row[1], opd: row[2], pic: row[3], wa: row[4],
      jenis: row[5], statusRegulasi: row[6], peraturanLama: row[7], judul: row[8],
      urgensi: row[9], ruangLingkup: row[10], isDelegasi: row[11], delegasiText: row[12],
      dasarHukum: row[13], targetSelesai: row[14], pembahasanAwal: row[15], status: row[16],
      step: row[17], fileName: row[18], fileUrl: row[19]
    };
  });

  if (role === "opd") {
    list = list.filter(function(item) { return item.opd === opd; });
  }
  return list;
}

function createUsulan(item, user) {
  var ss = getDb();
  var sheet = ss.getSheetByName(SHEET_USULAN) || ss.insertSheet(SHEET_USULAN);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Timestamp", "ID Usulan", "OPD Pemrakarsa", "PIC", "No WhatsApp",
      "Jenis Regulasi", "Sifat Regulasi", "Peraturan Lama", "Judul Peraturan",
      "Urgensi", "Ruang Lingkup", "Delegasi", "Keterangan Delegasi",
      "Dasar Hukum", "Target Selesai", "Pembahasan Awal", "Status", "Step",
      "Nama File", "File URL Google Drive"
    ]);
    sheet.getRange(1, 1, 1, 20).setFontWeight("bold").setBackground("#0d6efd").setFontColor("#ffffff");
  }

  var timestamp = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
  var newId = item.id || ("USL-" + new Date().getTime());
  
  sheet.appendRow([
    timestamp, newId, item.opd, item.pic, item.wa, item.jenis, item.statusRegulasi,
    item.peraturanLama || "N/A", item.judul, item.urgensi, item.ruangLingkup,
    item.isDelegasi || "TIDAK", item.delegasiText || "N/A", item.dasarHukum,
    item.targetSelesai, item.pembahasanAwal, "Draft", 1, item.fileName || "", item.fileUrl || ""
  ]);

  return { success: true, id: newId };
}

function updateUsulan(item, user) {
  var ss = getDb();
  var sheet = ss.getSheetByName(SHEET_USULAN);
  if (!sheet) throw new Error("Sheet usulan tidak ditemukan.");

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === item.id) {
      sheet.getRange(i + 1, 3).setValue(item.opd);
      sheet.getRange(i + 1, 4).setValue(item.pic);
      sheet.getRange(i + 1, 5).setValue(item.wa);
      sheet.getRange(i + 1, 6).setValue(item.jenis);
      sheet.getRange(i + 1, 7).setValue(item.statusRegulasi);
      sheet.getRange(i + 1, 8).setValue(item.peraturanLama || "N/A");
      sheet.getRange(i + 1, 9).setValue(item.judul);
      sheet.getRange(i + 1, 10).setValue(item.urgensi);
      sheet.getRange(i + 1, 11).setValue(item.ruangLingkup);
      sheet.getRange(i + 1, 12).setValue(item.isDelegasi);
      sheet.getRange(i + 1, 13).setValue(item.delegasiText || "N/A");
      sheet.getRange(i + 1, 14).setValue(item.dasarHukum);
      sheet.getRange(i + 1, 15).setValue(item.targetSelesai);
      sheet.getRange(i + 1, 16).setValue(item.pembahasanAwal);
      if (item.fileName) sheet.getRange(i + 1, 19).setValue(item.fileName);
      if (item.fileUrl) sheet.getRange(i + 1, 20).setValue(item.fileUrl);
      return { success: true };
    }
  }
  throw new Error("Dokumen dengan ID " + item.id + " tidak ditemukan.");
}

function deleteUsulan(id, user) {
  var ss = getDb();
  var sheet = ss.getSheetByName(SHEET_USULAN);
  var trashSheet = ss.getSheetByName(SHEET_TRASH) || ss.insertSheet(SHEET_TRASH);

  if (trashSheet.getLastRow() === 0) {
    trashSheet.appendRow([
      "Timestamp Deleted", "ID Usulan", "OPD Pemrakarsa", "PIC", "No WhatsApp",
      "Jenis Regulasi", "Sifat Regulasi", "Peraturan Lama", "Judul Peraturan",
      "Urgensi", "Ruang Lingkup", "Delegasi", "Keterangan Delegasi",
      "Dasar Hukum", "Target Selesai", "Pembahasan Awal", "Status", "Step",
      "Nama File", "File URL Google Drive", "Deleted By"
    ]);
    trashSheet.getRange(1, 1, 1, 21).setFontWeight("bold").setBackground("#dc3545").setFontColor("#ffffff");
  }

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === id) {
      var rowData = data[i];
      var delTime = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
      rowData[0] = delTime;
      rowData.push(user.username);
      trashSheet.appendRow(rowData);
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  throw new Error("ID tidak ditemukan.");
}

function restoreUsulan(id, user) {
  var ss = getDb();
  var sheet = ss.getSheetByName(SHEET_USULAN);
  var trashSheet = ss.getSheetByName(SHEET_TRASH);
  if (!trashSheet) throw new Error("Trash kosong.");

  var data = trashSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === id) {
      var rowData = data[i].slice(0, 20);
      sheet.appendRow(rowData);
      trashSheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  throw new Error("ID tidak ditemukan di Trash.");
}

function getTrashList() {
  var ss = getDb();
  var sheet = ss.getSheetByName(SHEET_TRASH);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var data = sheet.getDataRange().getValues();
  data.shift();
  return data.map(function(row) {
    return {
      timestamp: row[0], id: row[1], opd: row[2], judul: row[8], status: row[16], deletedBy: row[20]
    };
  });
}

function updateStatus(id, newStatus, note, user) {
  var ss = getDb();
  var sheet = ss.getSheetByName(SHEET_USULAN);
  if (!sheet) throw new Error("Sheet tidak ditemukan.");

  var statusToStep = {
    "Draft": 1, "Diverifikasi": 2, "Perlu Perbaikan": 3,
    "Harmonisasi": 4, "Pembahasan": 5, "Persetujuan": 6,
    "Penetapan": 7, "Selesai": 8
  };

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === id) {
      sheet.getRange(i + 1, 17).setValue(newStatus);
      sheet.getRange(i + 1, 18).setValue(statusToStep[newStatus] || 1);
      return { success: true };
    }
  }
  throw new Error("ID tidak ditemukan.");
}

function uploadFile(base64Data, fileName, mimeType) {
  if (FOLDER_ID === "YOUR_GOOGLE_DRIVE_FOLDER_ID") {
    return { success: true, fileUrl: "#simulated_drive_url_" + fileName };
  }
  var folder = DriveApp.getFolderById(FOLDER_ID);
  var decoded = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(decoded, mimeType || "application/pdf", fileName);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { success: true, fileUrl: file.getUrl() };
}

function createUser(userData) {
  var ss = getDb();
  var sheet = ss.getSheetByName(SHEET_USERS) || ss.insertSheet(SHEET_USERS);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Username", "Password", "Nama Lengkap", "Role", "OPD"]);
    sheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#0d6efd").setFontColor("#ffffff");
  }
  sheet.appendRow([userData.username, userData.password, userData.nama, userData.role, userData.opd]);
  return { success: true };
}

function deleteUser(username) {
  var ss = getDb();
  var sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) return { success: true };
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === username) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: true };
}


function getUsers() {
  var ss = getDb();
  var sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var data = sheet.getDataRange().getValues();
  data.shift();
  return data.map(function(row) {
    return { username: row[0], password: row[1], nama: row[2], role: row[3], opd: row[4] };
  });
}

function getOpds() {
  var ss = getDb();
  var sheet = ss.getSheetByName(SHEET_OPD);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var data = sheet.getDataRange().getValues();
  data.shift();
  return data.map(function(row) {
    return { kode: row[0], nama: row[1] };
  });
}

function updateUser(oldUsername, userData) {
  var ss = getDb();
  var sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) return { success: false, error: "Sheet not found" };
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === oldUsername) {
      sheet.getRange(i + 1, 1, 1, 5).setValues([[userData.username, userData.password, userData.nama, userData.role, userData.opd]]);
      return { success: true };
    }
  }
  return { success: false, error: "User not found" };
}

function createOpd(opdData) {
  var ss = getDb();
  var sheet = ss.getSheetByName(SHEET_OPD) || ss.insertSheet(SHEET_OPD);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Kode", "Nama OPD"]);
    sheet.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#0d6efd").setFontColor("#ffffff");
  }
  sheet.appendRow([opdData.kode, opdData.nama]);
  return { success: true };
}

function updateOpd(oldKode, opdData) {
  var ss = getDb();
  var sheet = ss.getSheetByName(SHEET_OPD);
  if (!sheet) return { success: false, error: "Sheet not found" };
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === oldKode) {
      sheet.getRange(i + 1, 1, 1, 2).setValues([[opdData.kode, opdData.nama]]);
      return { success: true };
    }
  }
  return { success: false, error: "OPD not found" };
}

function deleteOpd(kode) {
  var ss = getDb();
  var sheet = ss.getSheetByName(SHEET_OPD);
  if (!sheet) return { success: true };
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === kode) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: true };
}

function seedDatabase(payload) {
  var ss = getDb();
  var uCount = 0, usrCount = 0, logCount = 0, trCount = 0;

  // 1. Seed Usulan
  if (payload && payload.usulan && payload.usulan.length > 0) {
    var sheetU = ss.getSheetByName(SHEET_USULAN) || ss.insertSheet(SHEET_USULAN);
    if (sheetU.getLastRow() === 0) {
      sheetU.appendRow([
        "Timestamp", "ID Usulan", "OPD Pemrakarsa", "PIC", "No WhatsApp",
        "Jenis Regulasi", "Sifat Regulasi", "Peraturan Lama", "Judul Peraturan",
        "Urgensi", "Ruang Lingkup", "Delegasi", "Keterangan Delegasi",
        "Dasar Hukum", "Target Selesai", "Pembahasan Awal", "Status", "Step",
        "Nama File", "File URL Google Drive"
      ]);
      sheetU.getRange(1, 1, 1, 20).setFontWeight("bold").setBackground("#0d6efd").setFontColor("#ffffff");
    }
    var existingIds = {};
    if (sheetU.getLastRow() > 1) {
      var vals = sheetU.getRange(2, 2, sheetU.getLastRow() - 1, 1).getValues();
      for (var i = 0; i < vals.length; i++) { existingIds[vals[i][0]] = true; }
    }
    for (var j = 0; j < payload.usulan.length; j++) {
      var u = payload.usulan[j];
      if (!existingIds[u.id]) {
        sheetU.appendRow([
          u.timestamp || "2026-07-02 10:00:00", u.id, u.opd, u.pic, u.wa, u.jenis,
          u.statusRegulasi, u.peraturanLama || "N/A", u.judul, u.urgensi,
          u.ruangLingkup, u.isDelegasi || "TIDAK", u.delegasiText || "N/A",
          u.dasarHukum, u.targetSelesai, u.pembahasanAwal, u.status || "Draft",
          u.step || 1, u.fileName || "", u.fileUrl || ""
        ]);
        uCount++;
      }
    }
  }

  // 2. Seed Users
  if (payload && payload.users && payload.users.length > 0) {
    var sheetUsr = ss.getSheetByName(SHEET_USERS) || ss.insertSheet(SHEET_USERS);
    if (sheetUsr.getLastRow() === 0) {
      sheetUsr.appendRow(["Username", "Password", "Nama Lengkap", "Role", "OPD"]);
      sheetUsr.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#0d6efd").setFontColor("#ffffff");
    }
    var existingUser = {};
    if (sheetUsr.getLastRow() > 1) {
      var valsUsr = sheetUsr.getRange(2, 1, sheetUsr.getLastRow() - 1, 1).getValues();
      for (var k = 0; k < valsUsr.length; k++) { existingUser[valsUsr[k][0]] = true; }
    }
    for (var m = 0; m < payload.users.length; m++) {
      var usr = payload.users[m];
      if (!existingUser[usr.username]) {
        sheetUsr.appendRow([usr.username, usr.password, usr.nama, usr.role, usr.opd || "Semua OPD"]);
        usrCount++;
      }
    }
  }

  // 3. Seed Logs
  if (payload && payload.logs && payload.logs.length > 0) {
    var sheetL = ss.getSheetByName(SHEET_LOGS) || ss.insertSheet(SHEET_LOGS);
    if (sheetL.getLastRow() === 0) {
      sheetL.appendRow(["Timestamp", "Username", "Role", "IP Address", "Aktivitas", "Status", "Target", "Keterangan"]);
      sheetL.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#0f172a").setFontColor("#ffffff");
    }
    // Hanya tambahkan maksimal 5 log terbaru agar tidak berlebihan
    var maxLogs = Math.min(payload.logs.length, 5);
    for (var n = 0; n < maxLogs; n++) {
      var lg = payload.logs[n];
      sheetL.appendRow([lg.time || "-", lg.user || "-", lg.role || "admin", lg.ip || "Client", lg.action || "-", lg.status || "Berhasil", lg.target || "-", lg.desc || "-"]);
      logCount++;
    }
  }

  return { success: true, usulanCount: uCount, usersCount: usrCount, logsCount: logCount, trashCount: 0 };
}
