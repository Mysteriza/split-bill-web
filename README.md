# 🧾 Kalkulator Receh

Selamat datang di **Kalkulator Receh**, sebuah aplikasi web modern yang dirancang untuk mempermudah proses pembagian tagihan (split bill) bersama teman-teman. Dibangun dengan Next.js dan TypeScript, aplikasi ini menawarkan pengalaman pengguna yang cepat, interaktif, dan intuitif.

Lihat demonya secara langsung di: **[https://retro-split-bill-web.vercel.app/](https://retro-split-bill-web.vercel.app/)**

<img width="1919" height="926" alt="image" src="https://github.com/user-attachments/assets/464b71bb-99f0-4941-9fd7-a98f68b38564" />

## ✨ Fitur Utama

Aplikasi ini dilengkapi dengan berbagai fitur canggih untuk memastikan proses patungan menjadi mudah dan menyenangkan:

* **Perhitungan Real-time**: Tidak perlu menekan tombol "hitung". Semua total tagihan dan bagian per orang akan diperbarui secara otomatis setiap kali Anda mengubah data.
* **Manajemen Kontak**: Simpan daftar teman yang sering ikut patungan dalam sebuah "Buku Kontak". Tambahkan mereka ke sesi perhitungan dengan satu klik tanpa perlu mengetik ulang.
* **Input Item yang Fleksibel**: Tambah, edit, dan hapus item pesanan untuk setiap peserta dengan mudah.
* **Animasi Halus**: Antarmuka dilengkapi dengan animasi yang mulus saat menambah atau menghapus peserta dan item, memberikan umpan balik visual yang memuaskan.
* **Ekspor Hasil**: Simpan hasil perhitungan dalam format PDF yang rapi atau salin ringkasan teks yang sudah diformat khusus untuk dibagikan di aplikasi chat seperti WhatsApp.
* **Keamanan Input**: Dilengkapi dengan pembersihan input untuk mencegah *Cross-Site Scripting (XSS)*, memastikan data yang dimasukkan aman.
* **Desain Responsif**: Tampilan yang optimal baik di perangkat desktop maupun mobile.

## 🚀 Teknologi yang Digunakan

Proyek ini dibangun menggunakan tumpukan teknologi modern:

* **Framework**: [Next.js](https://nextjs.org/)
* **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **Komponen UI**: [shadcn/ui](https://ui.shadcn.com/)
* **Animasi**: [Framer Motion](https://www.framer.com/motion/)
* **Keamanan**: [DOMPurify](https://github.com/cure53/DOMPurify)
* **Deployment**: [Vercel](https://vercel.com/)

## 🛠️ Panduan Instalasi & Setup Lokal

Ingin menjalankan proyek ini di komputer Anda? Ikuti langkah-langkah berikut:

1.  **Clone Repositori**
    Buka terminal Anda dan jalankan perintah berikut:
    ```bash
    git clone https://github.com/Mysteriza/split-bill-web
    cd split-bill-web
    ```

2.  **Instal Dependensi**
    Instal semua paket yang dibutuhkan menggunakan `npm`:
    ```bash
    npm install
    ```

3.  **Jalankan Server Development**
    Jalankan aplikasi dalam mode development:
    ```bash
    npm run dev
    ```

4.  **Buka Aplikasi**
    Buka browser Anda dan kunjungi [http://localhost:3000](http://localhost:3000) (atau port lain yang ditampilkan di terminal).

## 💡 Cara Menggunakan

1.  **Tambah Peserta**: Ketik nama teman Anda di kolom "Nama Peserta Baru" dan klik tombol `+`. Nama yang baru ditambahkan akan otomatis tersimpan di "Buku Kontak".
2.  **Gunakan Kontak (Opsional)**: Klik "Kelola Kontak" untuk melihat daftar teman yang tersimpan dan menambahkannya ke sesi saat ini.
3.  **Input Pesanan**: Untuk setiap peserta, masukkan nama item dan harganya di bagian bawah *card* mereka, lalu klik `+`.
4.  **Edit/Hapus Item**: Gunakan ikon pensil (✏️) untuk mengedit atau ikon silang (❌) untuk menghapus item yang sudah ada.
5.  **Isi Biaya Tambahan**: Di kolom sebelah kanan, masukkan nominal Pajak, Ongkir, dan Diskon.
6.  **Lihat Hasil**: Hasil perhitungan total tagihan dan bagian per orang akan langsung terlihat dan diperbarui secara otomatis.
7.  **Simpan Hasil**: Klik tombol "Simpan" pada kartu "Hasil Patungan" untuk mengunduh PDF atau menyalin teks ke clipboard.

---

Terima kasih telah mengunjungi proyek ini!
