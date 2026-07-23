const fs = require('fs');

let gsCode = fs.readFileSync('e:\\40. Web\\appsekda\\Code.gs', 'utf8');

// Add SHEET_OPD constant
gsCode = gsCode.replace('const SHEET_USERS = "Master_Users";', 'const SHEET_USERS = "Master_Users";\nconst SHEET_OPD = "Master_OPD";');

// Add getUsers and getOpds in doGet
const getAdditions = `
  } else if (action === "getUsers") {
    var users = getUsers();
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: users })).setMimeType(ContentService.MimeType.JSON);
  } else if (action === "getOpds") {
    var opds = getOpds();
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: opds })).setMimeType(ContentService.MimeType.JSON);
`;
gsCode = gsCode.replace(/\}\s*else if \(action === "getTrashList"\) \{/g, getAdditions.trim() + ' } else if (action === "getTrashList") {');

// Add to doPost
const postAdditions = `
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
`;
gsCode = gsCode.replace(/case "deleteUser":/g, postAdditions.trim() + '\n      case "deleteUser":');

// Add functions to Code.gs
const newFunctions = `
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

function seedDatabase`;
gsCode = gsCode.replace(/function seedDatabase/g, newFunctions);

fs.writeFileSync('e:\\40. Web\\appsekda\\Code.gs', gsCode);

let appCode = fs.readFileSync('e:\\40. Web\\appsekda\\app.js', 'utf8');

const syncReplacement = `function syncWithGoogleSheets() {
  const gasUrl = localStorage.getItem("propemperda_gas_url");
  if (gasUrl && gasUrl.startsWith("http")) {
    const roleParam = \`role=\${currentUser ? currentUser.role : "guest"}&opd=\${encodeURIComponent(currentUser ? currentUser.opd : "")}\`;
    
    fetch(\`\${gasUrl}?action=getUsulanList&\${roleParam}\`)
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
      fetch(\`\${gasUrl}?action=getUsers&\${roleParam}\`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data && data.data.length > 0) {
            masterUserList = data.data;
            saveToStorage("propemperda_users", masterUserList);
          }
        }).catch(e => console.log(e));
        
      fetch(\`\${gasUrl}?action=getOpds&\${roleParam}\`)
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
`;
appCode = appCode.replace(/function syncWithGoogleSheets\(\) \{[\s\S]*?\}\n\nfunction executeGasPost/m, syncReplacement + '\nfunction executeGasPost');

appCode = appCode.replace(/masterUserList\[idx\] = \{ username, password, nama, role, opd \};\n\s*saveToStorage\("propemperda_users", masterUserList\);/g, `masterUserList[idx] = { username, password, nama, role, opd };
    saveToStorage("propemperda_users", masterUserList);
    executeGasPost("updateUser", { oldUsername: oldU, userData: masterUserList[idx] });`);

appCode = appCode.replace(/masterUserList\.push\(\{ username, password, nama, role, opd \}\);\n\s*saveToStorage\("propemperda_users", masterUserList\);/g, `masterUserList.push({ username, password, nama, role, opd });
    saveToStorage("propemperda_users", masterUserList);
    executeGasPost("createUser", { userData: { username, password, nama, role, opd } });`);

appCode = appCode.replace(/if \(editUserIndex !== -1\) \{/g, `if (editUserIndex !== -1) {
    const oldU = masterUserList[editUserIndex].username;`);

appCode = appCode.replace(/masterUserList\.splice\(index, 1\);\n\s*saveToStorage\("propemperda_users", masterUserList\);/g, `const uToDelete = masterUserList[index].username;
      masterUserList.splice(index, 1);
      saveToStorage("propemperda_users", masterUserList);
      executeGasPost("deleteUser", { username: uToDelete });`);

appCode = appCode.replace(/masterOpdList\[idx\] = \{ kode, nama \};\n\s*saveToStorage\("propemperda_opds", masterOpdList\);/g, `masterOpdList[idx] = { kode, nama };
    saveToStorage("propemperda_opds", masterOpdList);
    executeGasPost("updateOpd", { oldKode: oldK, opdData: masterOpdList[idx] });`);

appCode = appCode.replace(/masterOpdList\.push\(\{ kode, nama \}\);\n\s*saveToStorage\("propemperda_opds", masterOpdList\);/g, `masterOpdList.push({ kode, nama });
    saveToStorage("propemperda_opds", masterOpdList);
    executeGasPost("createOpd", { opdData: { kode, nama } });`);

appCode = appCode.replace(/if \(editOpdIndex !== -1\) \{/g, `if (editOpdIndex !== -1) {
    const oldK = masterOpdList[editOpdIndex].kode;`);

appCode = appCode.replace(/masterOpdList\.splice\(index, 1\);\n\s*saveToStorage\("propemperda_opds", masterOpdList\);/g, `const oToDelete = masterOpdList[index].kode;
      masterOpdList.splice(index, 1);
      saveToStorage("propemperda_opds", masterOpdList);
      executeGasPost("deleteOpd", { kode: oToDelete });`);

fs.writeFileSync('e:\\40. Web\\appsekda\\app.js', appCode);
console.log("Done");
