# Changelog

## [6.2] - 07 November 2025

Versi ini berfokus pada peningkatan keandalan dan konsistensi fitur **"Cari Jawaban"** pada forum diskusi, serta penyempurnaan UI/UX secara keseluruhan.

### 🚀 Fitur dan Peningkatan Baru

* **Peningkatan Cakupan Tombol "Cari Jawaban"**
    * Tombol **"Cari Jawaban"** sekarang muncul dan berfungsi pada **seluruh postingan diskusi**, baik itu balasan dari Dosen maupun Mahasiswa. (Sebelumnya hanya Dosen).

### 🐛 Perbaikan Keandalan & UX (Fixes & Reliability)

* **Perbaikan Konsistensi Kemunculan Tombol Forum (SPA Fix):**
    * Memperbaiki masalah di mana tombol **"Cari Jawaban"** tidak muncul secara otomatis setelah navigasi antar halaman diskusi (*Single Page Application* / SPA) dan seringkali memerlukan *refresh* browser.
    * Solusi diimplementasikan menggunakan teknik **Polling Berbasis Elemen** yang secara sabar menunggu elemen UI MENTARI dimuat, memastikan kemunculan tombol yang 100% andal.

* **Perbaikan UX Penyalinan Saran Pertanyaan:**
    * Memperbaiki *bug* di mana teks "Copy" ikut tersalin saat pengguna mengklik tombol *Copy* pada saran pertanyaan. Kini, hanya teks pertanyaan yang disalin.

* **Perapian Tampilan Jawaban Gemini:**
    * Memperbaiki format *output* jawaban dari Gemini AI agar terlihat rapi dan tidak padat dengan menerapkan CSS `white-space: pre-line;` untuk menampilkan pemisah paragraf yang jelas.