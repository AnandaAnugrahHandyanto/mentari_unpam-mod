// Fungsi utama untuk mendapatkan data presensi dari semua jadwal kuliah
async function fetchAllPresensiData() {
  // Dapatkan token autentikasi terlebih dahulu
  const token = await getAuthToken()

  if (!token) {
    console.error('Token tidak ditemukan. Tidak dapat melanjutkan.')
    showPopupMessage('Error: Token tidak ditemukan', 'error')
    return
  }

  console.log('Token ditemukan:', token)

  try {
    // 1. Fetch jadwal kuliah terlebih dahulu
    console.log('Mengambil data jadwal kuliah...')
    const jadwalKuliah = await fetchJadwalKuliah(token)

    if (!jadwalKuliah || !jadwalKuliah.length) {
      console.error('Tidak ada jadwal kuliah yang ditemukan.')
      showPopupMessage('Tidak ada jadwal kuliah yang ditemukan', 'error')
      return
    }

    console.log(`Ditemukan ${jadwalKuliah.length} mata kuliah`)

    // Extract student information from the first item in jadwal kuliah
    const mahasiswaInfo = {
      nim: jadwalKuliah[0].nim,
      nama_mahasiswa: jadwalKuliah[0].nama_mahasiswa,
      id_semester_registrasi: jadwalKuliah[0].id_semester_registrasi,
      nama_semester_registrasi: jadwalKuliah[0].nama_semester_registrasi,
    }

    // 2. Untuk setiap mata kuliah, ambil data presensi
    const allPresensiData = []

    for (const jadwal of jadwalKuliah) {
      const { id_kelas, id_mata_kuliah, nama_mata_kuliah, sks } = jadwal

      console.log(
        `Mengambil data presensi untuk: ${nama_mata_kuliah} (${id_mata_kuliah})`
      )

      try {
        const presensiData = await fetchPresensiPertemuan(
          token,
          id_kelas,
          id_mata_kuliah
        )

        // Tambahkan nama mata kuliah dan SKS ke data presensi
        const enrichedData = {
          nama_mata_kuliah,
          id_mata_kuliah,
          id_kelas,
          sks,
          pertemuan: presensiData,
        }

        allPresensiData.push(enrichedData)

        console.log(
          `Berhasil mengambil data presensi untuk: ${nama_mata_kuliah}`
        )
      } catch (error) {
        console.error(
          `Gagal mengambil data presensi untuk ${nama_mata_kuliah}:`,
          error
        )
      }
    }

    // 3. Tambahkan data mahasiswa ke presensi data
    allPresensiData.mahasiswa = mahasiswaInfo

    // 4. Tampilkan ringkasan data presensi sebagai popup
    showPresensiTable(allPresensiData)
    return allPresensiData
  } catch (error) {
    console.error('Terjadi kesalahan saat mengambil data:', error)
    showPopupMessage('Terjadi kesalahan saat mengambil data', 'error')
  }
}

// Fungsi untuk membuat popup table dengan desain Vercel
// Function to show attendance details when a row is clicked
function showAttendanceDetails(pertemuan, mataKuliah) {
  // Create modal container
  const modalContainer = document.createElement('div')
  modalContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10002;
  `

  // Create modal content
  const modalContent = document.createElement('div')
  modalContent.style.cssText = `
    background-color: rgba(25, 25, 30, 0.75); /* Dark transparent background */
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #f0f0f0; /* Light text color */
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
    width: 90%;
    max-width: 1200px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 24px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
    display: flex;
    flex-direction: column;
  `

  // Create header (STICKY)
  const header = document.createElement('div')
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 16px;
    position: sticky;
    top: -24px;
    z-index: 2;
    margin-left: -24px;
    margin-right: -24px;
    padding-left: 24px;
    padding-right: 24px;
    padding-top: 24px;
    background: inherit; /* Inherit glassmorphism effect */
  `

  header.innerHTML = `
    <h3 style="margin: 0; font-size: 18px; font-weight: 600; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${mataKuliah} - Detail Presensi</h3>
    <button id="close-detail-modal" style="background: none; border: none; cursor: pointer; color: #aaa; font-size: 24px;">×</button>
  `

  // Create table container (for horizontal scroll)
  const tableContainer = document.createElement('div')
  tableContainer.style.cssText = `
    width: 100%;
    overflow-x: auto;
  `

  // Create table
  const table = document.createElement('table')
  table.style.cssText = `
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    color: #f0f0f0;
  `

  table.innerHTML = `
    <thead>
      <tr style="background-color: rgba(255, 255, 255, 0.05);">
        <th style="padding: 12px 16px; text-align: left; font-weight: 600; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">Pertemuan</th>
        <th style="padding: 12px 16px; text-align: left; font-weight: 600; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">Jenis</th>
        <th style="padding: 12px 16px; text-align: center; font-weight: 600; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">Status</th>
        <th style="padding: 12px 16px; text-align: left; font-weight: 600; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">Tanggal Mulai</th>
        <th style="padding: 12px 16px; text-align: left; font-weight: 600; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">Tanggal Hadir</th>
        <th style="padding: 12px 16px; text-align: left; font-weight: 600; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">Oleh</th>
      </tr>
    </thead>
    <tbody id="detail-table-body">
    </tbody>
  `

  // Assemble modal
  modalContent.appendChild(header)
  tableContainer.appendChild(table)
  modalContent.appendChild(tableContainer)
  modalContainer.appendChild(modalContent)
  document.body.appendChild(modalContainer)

  // Add event listener to close button
  document
    .getElementById('close-detail-modal')
    .addEventListener('click', () => {
      document.body.removeChild(modalContainer)
    })

  // Fill table with data
  const tableBody = document.getElementById('detail-table-body')

  pertemuan.forEach((p, index) => {
    const row = document.createElement('tr')
    row.style.cssText = `transition: background-color 0.15s ease;`

    row.onmouseover = function () {
      this.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'
    }

    row.onmouseout = function () {
      this.style.backgroundColor = ''
    }

    // Status styling
    let statusColor, statusBg
    if (p.presensi_status === 'hadir') {
      statusColor = '#2ecc71' // bright green
      statusBg = 'rgba(46, 204, 113, 0.15)'
    } else {
      statusColor = '#e74c3c' // bright red
      statusBg = 'rgba(231, 76, 60, 0.15)'
    }

    // Format date
    const dateStr = p.presensi_date ? formatDate(p.presensi_date) : '-'
    const TglMulai = p.tanggal_mulai ? formatDateStart(p.tanggal_mulai) : '-'

    row.innerHTML = `
      <td style="padding: 12px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">${
        index + 1
      }</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">${
        p.jenis_perkuliahan || '-'
      }</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); text-align: center;">
        <div style="display: inline-flex; align-items: center; background-color: ${statusBg}; color: ${statusColor}; padding: 4px 10px; border-radius: 12px; font-weight: 500; font-size: 13px;">
          ${p.presensi_status || 'tidak hadir'}
        </div>
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">${TglMulai}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">${dateStr}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">${
        p.presensi_by || '-'
      }</td>
    `

    tableBody.appendChild(row)
  })
}

// Helper function to format date
function formatDate(dateString) {
  if (!dateString) return '-'

  try {
    const date = new Date(dateString)
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (e) {
    return dateString
  }
}

function formatDateStart(dateString) {
  if (!dateString) return '-'

  try {
    const date = new Date(dateString)
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch (e) {
    return dateString
  }
}

// Modify the showPresensiTable function to make rows clickable
function showPresensiTable(presensiData) {
  // Get student info
  const mahasiswaInfo = presensiData.mahasiswa;

  // Create popup container
  const popupContainer = document.createElement('div');
  popupContainer.id = 'presensi-popup';
  popupContainer.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(18, 18, 22, 0.8);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e5e7eb;
    padding: 24px;
    border-radius: 16px;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    z-index: 10000;
    width: 90%;
    max-width: 1000px;
    max-height: 90vh;
    overflow-y: auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  `;

  let totalSKS = 0;
  let totalPertemuanKeseluruhan = 0;
  let totalHadirKeseluruhan = 0;
  let criticalCoursesCount = 0;

  presensiData.forEach((data) => {
    totalSKS += parseInt(data.sks || 0);
    const hadir = data.pertemuan.filter(p => p.presensi_status === 'hadir').length;
    const totalPertemuan = data.pertemuan.length;
    totalHadirKeseluruhan += hadir;
    totalPertemuanKeseluruhan += totalPertemuan;
    const persentase = totalPertemuan > 0 ? (hadir / totalPertemuan) * 100 : 0;
    if (persentase < 75) {
      criticalCoursesCount++;
    }
  });

  const avgAttendance = totalPertemuanKeseluruhan > 0 ? (totalHadirKeseluruhan / totalPertemuanKeseluruhan * 100).toFixed(1) : 0;
  const header = document.createElement('div');
  header.style.cssText = `margin-bottom: 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 16px;`;
  header.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
      <div>
        <h2 style="margin: 0; font-size: 24px; font-weight: 600; text-shadow: 0 1px 3px rgba(0,0,0,0.5);">Ringkasan Presensi</h2>
        <p style="margin: 4px 0 0; color: #9ca3af; font-size: 14px;">${mahasiswaInfo.nama_mahasiswa} (${mahasiswaInfo.nim})</p>
      </div>
      <button id="export-presensi-btn" style="background-color: rgba(255, 255, 255, 0.1); color: #e5e7eb; border: 1px solid rgba(255, 255, 255, 0.2); padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s ease;">Cetak PDF</button>
    </div>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">
      <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
        <div style="font-size: 12px; color: #9ca3af; margin-bottom: 4px;">Rata-rata Kehadiran</div>
        <div style="font-weight: 600; font-size: 20px; color: ${avgAttendance >= 75 ? '#2ecc71' : '#f39c12'};">${avgAttendance}%</div>
      </div>
      <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
        <div style="font-size: 12px; color: #9ca3af; margin-bottom: 4px;">Total SKS</div>
        <div style="font-weight: 600; font-size: 20px;">${totalSKS}</div>
      </div>
      <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
        <div style="font-size: 12px; color: #9ca3af; margin-bottom: 4px;">Matkul Kritis</div>
        <div style="font-weight: 600; font-size: 20px; color: ${criticalCoursesCount > 0 ? '#e74c3c' : '#2ecc71'};">${criticalCoursesCount}</div>
      </div>
      <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">
        <div style="font-size: 12px; color: #9ca3af; margin-bottom: 4px;">Semester</div>
        <div style="font-weight: 600; font-size: 20px;">${mahasiswaInfo.nama_semester_registrasi}</div>
      </div>
    </div>
  `;

  const cardContainer = document.createElement('div');
  cardContainer.id = 'presensi-card-container';
  cardContainer.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
  `;

  presensiData.forEach((data, index) => {
    const hadir = data.pertemuan.filter(p => p.presensi_status === 'hadir').length;
    const totalPertemuan = data.pertemuan.length;
    const persentase = totalPertemuan > 0 ? ((hadir / totalPertemuan) * 100) : 0;

    let statusBarColor, statusText;
    if (persentase >= 85) {
      statusBarColor = '#2ecc71';
      statusText = 'Aman';
    } else if (persentase >= 75) {
      statusBarColor = '#3498db';
      statusText = 'Cukup';
    } else {
      statusBarColor = '#e74c3c';
      statusText = 'Kritis';
    }
    
    const card = document.createElement('div');
    card.style.cssText = `
      background-color: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
    `;
    card.onmouseover = () => { card.style.borderColor = 'rgba(255, 255, 255, 0.3)'; card.style.transform = 'translateY(-3px)'; };
    card.onmouseout = () => { card.style.borderColor = 'rgba(255, 255, 255, 0.1)'; card.style.transform = 'none'; };
    card.onclick = () => showAttendanceDetails(data.pertemuan, data.nama_mata_kuliah);

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
        <h3 style="font-size: 15px; font-weight: 600; margin: 0; line-height: 1.3; flex: 1 1 0%; min-width: 150px;">${data.nama_mata_kuliah}</h3>
        <span style="background-color: ${statusBarColor}; color: white; padding: 4px 8px; font-size: 11px; font-weight: 500; border-radius: 6px; flex-shrink: 0;">${statusText}</span>
      </div>
      <div style="font-size: 12px; color: #9ca3af; margin-bottom: auto; padding-bottom: 12px;">${data.id_mata_kuliah} • ${data.sks || '3'} SKS</div>
      
      <div style="width: 100%; background-color: rgba(0,0,0,0.3); border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
        <div style="width: ${persentase.toFixed(1)}%; background-color: ${statusBarColor}; height: 8px; border-radius: 4px; transition: width 0.5s ease;"></div>
      </div>
      
      <div style="display: flex; justify-content: space-between; font-size: 12px; color: #bdc3c7;">
        <span>Hadir: <strong>${hadir} / ${totalPertemuan}</strong></span>
        <span><strong>${persentase.toFixed(1)}%</strong></span>
      </div>
    `;
    cardContainer.appendChild(card);
  });

  const footer = document.createElement('div');
  footer.style.cssText = `margin-top: 24px; display: flex; justify-content: flex-end;`;
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Tutup';
  closeButton.style.cssText = `
    padding: 8px 16px;
    background-color: #0070f3;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
  `;
  closeButton.onclick = () => document.body.removeChild(popupContainer);
  footer.appendChild(closeButton);

  popupContainer.appendChild(header);
  popupContainer.appendChild(cardContainer);
  popupContainer.appendChild(footer);
  document.body.appendChild(popupContainer);

  // Add export functionality
  document.getElementById('export-presensi-btn').onclick = () => {
    printRecap(presensiData, mahasiswaInfo);
  };
}


// buat rekap HTML dan mencetaknya ke PDF
function printRecap(presensiData, mahasiswaInfo) {
  const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  
  let tableRows = '';
  presensiData.forEach((data, index) => {
    const hadir = data.pertemuan.filter(p => p.presensi_status === 'hadir').length;
    const total = data.pertemuan.length;
    const persentase = total > 0 ? ((hadir / total) * 100).toFixed(1) + '%' : 'N/A';
    tableRows += `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td>${data.nama_mata_kuliah}</td>
        <td style="text-align: center;">${data.id_mata_kuliah}</td>
        <td style="text-align: center;">${data.sks || '3'}</td>
        <td style="text-align: center;">${hadir}</td>
        <td style="text-align: center;">${total}</td>
        <td style="text-align: center;">${persentase}</td>
      </tr>
    `;
  });

  const printHtml = `
    <html>
      <head>
        <title>Rekap Presensi - ${mahasiswaInfo.nim}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
          body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; margin: 2.5cm 2.5cm 2.5cm 3cm; }
          .header { display: flex; align-items: center; }
          .header img { width: 85px; height: auto; }
          .header-text { margin-left: 20px; text-align: left;}
          .header-text h1 { font-size: 16pt; margin: 0; font-weight: bold; }
          .header-text h2 { font-size: 14pt; margin: 0; font-weight: bold; }
          hr.main-line { border: none; border-top: 1.5px solid #000; margin: 5px 0 15px 0; }
          .info-table { font-size: 11pt; border-collapse: collapse; }
          .info-table td { padding: 2px 0; vertical-align: top; }
          .info-table td:nth-child(1) { width: 140px; }
          .info-table td:nth-child(2) { width: 15px; text-align: center; }
          table.data { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10pt; }
          table.data th, table.data td { border: 1px solid #000; padding: 6px; text-align: left; }
          table.data th { background-color: #e0e0e0; font-weight: bold; text-align: center;}
          .signature { margin-top: 40px; float: right; text-align: center; width: 280px; }
          .signature p { margin: 0; }
          .signature .name { margin-top: 60px; font-weight: bold; text-decoration: underline; }
          @page { size: A4; margin: 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="https://unpam.ac.id/_nuxt/logo-unpam-300x291.DBvGUDu1.png" alt="Logo UNPAM">
          <div class="header-text">
            <h1>UNIVERSITAS PAMULANG</h1>
            <h2>REKAP PRESENSI SEMESTER ${mahasiswaInfo.nama_semester_registrasi.toUpperCase()}</h2>
          </div>
        </div>
        <hr class="main-line">
        <table class="info-table">
          <tr>
            <td>FAKULTAS / PRODI</td>
            <td>:</td>
            <td>ILMU KOMPUTER / TEKNIK INFORMATIKA S1</td>
          </tr>
          <tr>
            <td>NAMA MAHASISWA</td>
            <td>:</td>
            <td>${mahasiswaInfo.nama_mahasiswa}</td>
          </tr>
          <tr>
            <td>NIM</td>
            <td>:</td>
            <td>${mahasiswaInfo.nim}</td>
          </tr>
        </table>
        <table class="data">
          <thead>
            <tr>
              <th>NO</th>
              <th>NAMA MATA KULIAH</th>
              <th>KODE MK</th>
              <th>SKS</th>
              <th>HADIR</th>
              <th>TOTAL</th>
              <th>PERSENTASE</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div class="signature">
          <p>Tangerang Selatan, ${today}</p>
          <p>Ketua Program Studi</p>
          <p class="name">Dr. Eng. Ahmad Musyafa, S.Kom., M.Kom</p>
          <p>NIDN. 0425018609</p>
        </div>
      </body>
    </html>
  `;
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(printHtml);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { // Timeout is needed for some browsers
    printWindow.print();
    printWindow.close();
  }, 250);
}

// Fungsi untuk menampilkan loading spinner
function showLoadingSpinner() {
  const spinnerContainer = document.createElement('div')
  spinnerContainer.id = 'loading-spinner'
  spinnerContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10001;
    `

  const spinner = document.createElement('div')
  spinner.style.cssText = `
      width: 50px;
      height: 50px;
      border: 5px solid rgba(255, 255, 255, 0.2);
      border-top: 5px solid #0070f3;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 15px;
    `

  const messageContainer = document.createElement('div')
  messageContainer.style.cssText = `
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      font-size: 16px;
      color: #f0f0f0;
    `
  messageContainer.innerHTML = `
      <div style="font-weight: 500; margin-bottom: 5px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">Memuat Data Presensi</div>
      <div style="font-size: 14px; color: #aaa;">Mohon tunggu sebentar...</div>
    `

  const loadingContent = document.createElement('div')
  loadingContent.style.cssText = `
      display: flex;
      align-items: center;
      padding: 20px;
      background-color: rgba(25, 25, 30, 0.8);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `

  loadingContent.appendChild(spinner)
  loadingContent.appendChild(messageContainer)
  spinnerContainer.appendChild(loadingContent)

  // Tambahkan style untuk animasi
  const styleElement = document.createElement('style')
  styleElement.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `
  document.head.appendChild(styleElement)

  // Tambahkan ke body
  document.body.appendChild(spinnerContainer)

  return spinnerContainer
}

// Fungsi untuk hide loading spinner
function hideLoadingSpinner() {
  const spinner = document.getElementById('loading-spinner')
  if (spinner) {
    document.body.removeChild(spinner)
  }
}

// Modifikasi tombol floating
function addFloatingButton() {
  // Cek apakah sudah ada container
  let container = document.getElementById('floatingButtonContainer')
  if (!container) {
    container = document.createElement('div')
    container.id = 'floatingButtonContainer'
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      display: flex;
      flex-direction: row;
      gap: 10px;
      z-index: 9999;
    `
    document.body.appendChild(container)
  }

  // Tambahkan tombol presensi
  let button = document.getElementById('presensiButton')
  if (!button) {
    button = document.createElement('button')
    button.id = 'presensiButton'
    button.textContent = 'Lihat Presensi'
    button.style.cssText = `
      padding: 10px 16px;
      background-color: #0070f3;
      color: white;
      border: none;
      border-radius: 7px;
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      font-weight: 500;
      font-size: 14px;
      transition: background 0.2s;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `
    button.onmouseover = function () {
      this.style.backgroundColor = '#0059b2'
    }
    button.onmouseout = function () {
      this.style.backgroundColor = '#0070f3'
    }
    button.onclick = function () {
      this.disabled = true
      this.textContent = 'Memuat...'
      const spinner = showLoadingSpinner()
      fetchAllPresensiData()
        .then(() => {
          this.disabled = false
          this.textContent = 'Lihat Presensi'
          hideLoadingSpinner()
        })
        .catch((error) => {
          console.error('Error:', error)
          this.disabled = false
          this.textContent = 'Lihat Presensi'
          hideLoadingSpinner()
        })
    }
    container.appendChild(button)
  }
}

// Fungsi untuk menampilkan pesan popup
function showPopupMessage(message, type = 'info') {
  const popup = document.createElement('div')
  popup.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    background-color: ${type === 'error' ? '#e74c3c' : '#2ecc71'};
    color: white;
    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  `

  popup.textContent = message
  document.body.appendChild(popup)

  setTimeout(() => {
    document.body.removeChild(popup)
  }, 5000)
}

// Fungsi untuk membersihkan token dari prefix yang tidak diperlukan
function cleanToken(token) {
  // Hapus prefix "__q_strn|" jika ada
  if (token && token.includes('__q_strn|')) {
    return token.split('__q_strn|')[1]
  }
  return token
}

// Fungsi untuk mendapatkan token autentikasi
async function getAuthToken() {
  // Cek token di localStorage dan sessionStorage
  const localStorageKeys = Object.keys(localStorage)
  const sessionStorageKeys = Object.keys(sessionStorage)

  // Array untuk menyimpan kemungkinan token
  let possibleTokens = []

  // Periksa localStorage
  for (const key of localStorageKeys) {
    let value = localStorage.getItem(key)
    if (
      value &&
      (value.includes('eyJ') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('auth'))
    ) {
      value = cleanToken(value)
      possibleTokens.push({ source: 'localStorage', key: key, value: value })
    }
  }

  // Periksa sessionStorage
  for (const key of sessionStorageKeys) {
    let value = sessionStorage.getItem(key)
    if (
      value &&
      (value.includes('eyJ') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('auth'))
    ) {
      value = cleanToken(value)
      possibleTokens.push({ source: 'sessionStorage', key: key, value: value })
    }
  }

  // Periksa cookies
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=')
    if (
      value &&
      (value.includes('eyJ') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('auth'))
    ) {
      const cleanedValue = cleanToken(decodeURIComponent(value))
      possibleTokens.push({
        source: 'cookie',
        key: key,
        value: cleanedValue,
      })
    }
  }

  // Cek jika ada global token dari monitor network requests
  if (window.lastAuthToken) {
    const cleanedToken = cleanToken(window.lastAuthToken)
    possibleTokens.push({
      source: 'networkMonitor',
      key: 'lastAuthToken',
      value: cleanedToken,
    })
  }

  if (possibleTokens.length > 0) {
    console.log('Token ditemukan')
    return possibleTokens[0].value
  } else {
    console.log('Tidak ada token ditemukan. Mengaktifkan monitoring...')
    monitorNetworkRequests()
    return null
  }
}

// Fungsi untuk memonitor network requests
function monitorNetworkRequests() {
  console.log('Mengaktifkan monitoring network requests...')

  // Monitor fetch requests
  const originalFetch = window.fetch
  window.fetch = function (...args) {
    const request = args[0]
    if (args[1] && args[1].headers) {
      const headers = args[1].headers
      // Periksa jika headers adalah Headers object atau plain object
      if (headers instanceof Headers) {
        if (headers.has('authorization') || headers.has('Authorization')) {
          const authHeader =
            headers.get('authorization') || headers.get('Authorization')
          if (authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7)
            window.lastAuthToken = cleanToken(token)
          }
        }
      } else {
        // Plain object
        if (headers.authorization || headers.Authorization) {
          const authHeader = headers.authorization || headers.Authorization
          if (
            typeof authHeader === 'string' &&
            authHeader.startsWith('Bearer ')
          ) {
            const token = authHeader.substring(7)
            window.lastAuthToken = cleanToken(token)
          }
        }
      }
    }
    return originalFetch.apply(this, args)
  }
}

// Fungsi untuk fetch data jadwal kuliah
async function fetchJadwalKuliah(token) {
  try {
    // Dapatkan XSRF token jika ada
    let xsrfToken = ''
    const xsrfCookie = document.cookie
      .split(';')
      .find((c) => c.trim().startsWith('XSRF-TOKEN='))
    if (xsrfCookie) {
      xsrfToken = decodeURIComponent(xsrfCookie.split('=')[1])
    }

    // Fetch data jadwal kuliah
    const response = await fetch(
      'https://my.unpam.ac.id/api/presensi/mahasiswa/jadwal-kuliah',
      {
        method: 'GET',
        headers: {
          accept: 'application/json, text/plain, */*',
          authorization: `Bearer ${token}`,
          'x-xsrf-token': xsrfToken,
        },
        credentials: 'include',
      }
    )

    // Periksa apakah response berhasil
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    // Parse response menjadi JSON
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching jadwal kuliah:', error)
    throw error
  }
}

// Fungsi untuk fetch data presensi pertemuan
async function fetchPresensiPertemuan(token, idKelas, idMataKuliah) {
  try {
    // Dapatkan XSRF token jika ada
    let xsrfToken = ''
    const xsrfCookie = document.cookie
      .split(';')
      .find((c) => c.trim().startsWith('XSRF-TOKEN='))
    if (xsrfCookie) {
      xsrfToken = decodeURIComponent(xsrfCookie.split('=')[1])
    }

    // URL untuk mengambil data presensi
    const url = `https://my.unpam.ac.id/api/presensi/mahasiswa/jadwal-pertemuan/${idKelas}/${idMataKuliah}`

    // Fetch data presensi
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json, text/plain, */*',
        authorization: `Bearer ${token}`,
        'x-xsrf-token': xsrfToken,
      },
      credentials: 'include',
    })

    // Periksa apakah response berhasil
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    // Parse response menjadi JSON
    const data = await response.json()
    return data
  } catch (error) {
    console.error(
      `Error fetching data presensi untuk kelas ${idKelas}, mata kuliah ${idMataKuliah}:`,
      error
    )
    throw error
  }
}

// Jalankan fungsi utama
console.log('=== SCRIPT UNTUK MENDAPATKAN DATA PRESENSI UNPAM ===')
console.log('Memulai proses pengambilan data...')

// Tambahkan tombol floating untuk menjalankan script
addFloatingButton()
monitorNetworkRequests()

// Tambahkan event listener untuk auto-restart script saat token ditemukan
window.addEventListener('storage', function (e) {
  if (
    e.key.toLowerCase().includes('token') ||
    e.key.toLowerCase().includes('auth')
  ) {
    console.log('Token storage berubah, mencoba menjalankan script kembali')
    fetchAllPresensiData()
  }
})