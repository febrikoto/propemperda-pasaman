const fs = require('fs');
let code = fs.readFileSync('e:\\40. Web\\appsekda\\app.js', 'utf8');

// 1. Dashboard Stats
const regexDashboard = /function renderDashboardStats\(\) \{[\s\S]*?\}\n\n\/\//m;
const newDashboard = `function renderDashboardStats() {
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

  container.innerHTML = \`
    <div class="col-6 col-md-4 col-xl-2 mb-3">
      <div class="card-stat p-3 h-100 d-flex flex-column justify-content-center align-items-center text-center border-primary border-start border-4">
        <span class="text-muted small fw-bold text-uppercase mb-2">Usulan OPD</span>
        <h3 class="fw-bold mb-0 text-primary fs-3">\${usulanOpdCount}</h3>
      </div>
    </div>
    <div class="col-6 col-md-4 col-xl-2 mb-3">
      <div class="card-stat p-3 h-100 d-flex flex-column justify-content-center align-items-center text-center border-info border-start border-4">
        <span class="text-muted small fw-bold text-uppercase mb-2">Diproses</span>
        <h3 class="fw-bold mb-0 text-info fs-3">\${prosesCount}</h3>
      </div>
    </div>
    <div class="col-6 col-md-4 col-xl-2 mb-3">
      <div class="card-stat p-3 h-100 d-flex flex-column justify-content-center align-items-center text-center border-success border-start border-4">
        <span class="text-muted small fw-bold text-uppercase mb-2">Disetujui</span>
        <h3 class="fw-bold mb-0 text-success fs-3">\${setujuCount}</h3>
      </div>
    </div>
    <div class="col-6 col-md-6 col-xl-3 mb-3">
      <div class="card-stat p-3 h-100 d-flex flex-column justify-content-center align-items-center text-center border-warning border-start border-4">
        <span class="text-muted small fw-bold text-uppercase mb-2">Perlu Perbaikan</span>
        <h3 class="fw-bold mb-0 text-warning fs-3">\${perbaikanCount}</h3>
      </div>
    </div>
    <div class="col-12 col-md-6 col-xl-3 mb-3">
      <div class="card-stat p-3 h-100 d-flex flex-column justify-content-center align-items-center text-center border-danger border-start border-4">
        <span class="text-muted small fw-bold text-uppercase mb-2">Ditolak</span>
        <h3 class="fw-bold mb-0 text-danger fs-3">\${tolakCount}</h3>
      </div>
    </div>
  \`;
}

//`;
code = code.replace(regexDashboard, newDashboard);

// 2. togglePeraturanLama logic
const toggleFunction = `
function togglePeraturanLama() {
  const status = document.getElementById("inp-status").value;
  const divPeraturanLama = document.getElementById("div-peraturan-lama");
  if (status === "Baru") {
    divPeraturanLama.style.display = "none";
  } else {
    divPeraturanLama.style.display = "block";
  }
}
`;
code = code.replace('function toggleDelegasi() {', toggleFunction + '\nfunction toggleDelegasi() {');

// 3. Edit modal "Baru" logic
const editUsulanTrigger = `document.getElementById("inp-status").value = item.statusRegulasi || "Baru";\n    togglePeraturanLama();`;
code = code.replace(/document\.getElementById\("inp-status"\)\.value = item\.statusRegulasi \|\| "Baru";/g, editUsulanTrigger);

const pageTambahTrigger = `document.getElementById("inp-status").value = "Baru";\n    togglePeraturanLama();`;
code = code.replace(/document\.getElementById\("inp-status"\)\.value = "Baru";/g, pageTambahTrigger);

// 4. Hide "Tambah Usulan" for admin
const newRbac = `// 1. Tombol & Menu Tambah/Edit Usulan (.link-write-access)
  if (role === "pimpinan" || role === "admin") {
    writeElements.forEach(el => el.classList.add("d-none"));
  } else {
    writeElements.forEach(el => el.classList.remove("d-none"));
  }`;
code = code.replace(/\/\/ 1\. Tombol & Menu Tambah\/Edit Usulan \(\.link-write-access\)\s*if \(role === "pimpinan"\) \{\s*writeElements\.forEach\(el => el\.classList\.add\("d-none"\)\);\s*\} else \{\s*writeElements\.forEach\(el => el\.classList\.remove\("d-none"\)\);\s*\}/m, newRbac);

// 5. Add "Ditolak" to update status options
const newStatusOptions = `<option value="Selesai">Tahap 8: Selesai Disahkan (Tercatat)</option>\n            <option value="Ditolak">Usulan Ditolak</option>`;
code = code.replace(/<option value="Selesai">Tahap 8: Selesai Disahkan \(Tercatat\)<\/option>/g, newStatusOptions);

// WA Integration fix in updateStatus
// When updating status, it can send WA. Let's add a button in sweetalert if status is changed.
// Let's modify the swal response in updateStatus
const waReplace = `const tgl = new Date().toLocaleString("id-ID");
        item.status = newStatus;
        item.history.unshift({ time: tgl, action: "Status diperbarui", detail: \`Status diubah menjadi: \${newStatus}\`, pic: currentUser.name, state: newStatus === "Selesai" ? "completed" : newStatus === "Ditolak" ? "rejected" : "active" });

        saveToStorage("propemperda_usulan", usulanList);
        
        let waLink = "";
        if (item.wa) {
           const noWa = "62" + item.wa.replace(/^0+/, '');
           const textWa = encodeURIComponent(\`Halo Bapak/Ibu OPD \${item.opd}, status usulan rancangan "\${item.judul}" telah diperbarui menjadi *\${newStatus}* oleh Bagian Hukum. Silakan cek aplikasi PROPemperda untuk detail lebih lanjut.\`);
           waLink = \`<div class="mt-3"><a href="https://wa.me/\${noWa}?text=\${textWa}" target="_blank" class="btn btn-success"><i class="bi bi-whatsapp me-2"></i>Kirim Notifikasi WA</a></div>\`;
        }

        Swal.fire({
          icon: "success",
          title: "Berhasil",
          html: "Status usulan berhasil diperbarui!" + waLink,
          confirmButtonText: "Tutup"
        }).then(() => {
          populateTableUsulan();
        });`;

code = code.replace(/const tgl = new Date\(\)\.toLocaleString\("id-ID"\);\s*item\.status = newStatus;\s*item\.history\.unshift\(\{ time: tgl, action: "Status diperbarui", detail: `Status diubah menjadi: \$\{newStatus\}`/m, 
`const tgl = new Date().toLocaleString("id-ID");
        item.status = newStatus;
        item.history.unshift({ time: tgl, action: "Status diperbarui", detail: \`Status diubah menjadi: \${newStatus}\`, pic: currentUser.name, state: newStatus === "Selesai" ? "completed" : newStatus === "Ditolak" ? "rejected" : "active" });

        saveToStorage("propemperda_usulan", usulanList);
        
        let waLink = "";
        if (item.wa) {
           const noWa = "62" + item.wa.replace(/^0+/, '');
           const textWa = encodeURIComponent(\`Halo Bapak/Ibu OPD \${item.opd}, status usulan rancangan "\${item.judul}" telah diperbarui menjadi *\${newStatus}* oleh Bagian Hukum. Silakan cek aplikasi PROPemperda untuk detail lebih lanjut.\`);
           waLink = \`<div class="mt-3"><a href="https://wa.me/\${noWa}?text=\${textWa}" target="_blank" class="btn btn-success"><i class="bi bi-whatsapp me-2"></i>Kirim Notifikasi WA</a></div>\`;
        }

        Swal.fire({
          icon: "success",
          title: "Berhasil",
          html: "Status usulan berhasil diperbarui!" + waLink,
          confirmButtonText: "Tutup"
        }).then(() => {
          populateTableUsulan();
        });
//`);

// clean up the rest of the replaced code block
code = code.replace(/pic: currentUser\.name, state: newStatus === "Selesai" \? "completed" : "active" \}\);\s*saveToStorage\("propemperda_usulan", usulanList\);\s*Swal\.fire\(\{\s*icon: "success",\s*title: "Berhasil",\s*text: "Status usulan berhasil diperbarui!",\s*confirmButtonText: "Tutup"\s*\}\)\.then\(\(\) => \{\s*populateTableUsulan\(\);\s*\}\);/m, "");

fs.writeFileSync('e:\\40. Web\\appsekda\\app.js', code);
console.log("Modifications complete.");
