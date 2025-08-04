# 🧾 Kalkulator Receh

Selamat datang di **Kalkulator Receh**, sebuah aplikasi web modern yang dirancang untuk mempermudah proses pembagian tagihan (*split bill*) bersama teman-teman. Dibangun dengan Next.js dan TypeScript, aplikasi ini menawarkan pengalaman pengguna yang cepat, akurat, dan sangat efisien.

Lihat demonya secara langsung di: **[https://retro-split-bill-web.vercel.app/](https://retro-split-bill-web.vercel.app/)**

<img width="1920" height="1177" alt="Tampilan Aplikasi Kalkulator Receh" src="https://github.com/user-attachments/assets/58b41d6f-26d5-44d9-b210-7e664465e601" />

## ✨ Fitur Utama

Aplikasi ini dilengkapi dengan berbagai fitur canggih untuk memastikan proses patungan menjadi secepat dan semudah mungkin:

* **Perhitungan Real-time**: Semua total tagihan dan bagian per orang diperbarui secara otomatis setiap kali Anda mengubah data.
* **Input Massal Super Cepat**: Salin-tempel (*copy-paste*) beberapa baris pesanan langsung dari struk atau catatan Anda sekaligus.
* **Manajemen Sesi (Impor/Ekspor)**: Simpan seluruh sesi perhitungan (peserta, item, biaya) ke dalam sebuah file **JSON**. Muat kembali sesi tersebut kapan pun Anda butuhkan.
* **Validasi Input Aman dengan Zod**: Fitur impor dilindungi oleh skema validasi yang ketat, mencegah aplikasi *crash* jika file JSON tidak valid.
* **Integrasi Kontak Perangkat**: Tambahkan peserta langsung dari **buku kontak HP** atau desktop Anda menggunakan Contact Picker API.
* **Manajemen Item Fleksibel**: Edit, hapus, dan tandai item ke beberapa peserta, dilengkapi dengan logika yang membatasi jumlah tag sesuai kuantitas item.
* **Dialog Konfirmasi**: Fitur keamanan untuk mencegah penghapusan atau reset data yang tidak disengaja.
* **Salin Teks untuk WhatsApp**: Salin hasil perhitungan dalam format teks yang rapi dan detail—lengkap dengan rincian item per orang—siap untuk dibagikan.
* **Desain Responsif & Optimal**: Tampilan yang rapi dan terstruktur baik di desktop maupun mobile, dengan penyesuaian UI seperti menu aksi *dropdown*.

## 🤔 Mengapa Input Massal Lebih Baik dari Scan Struk?

Kami sengaja memilih untuk tidak mengimplementasikan fitur scan struk (OCR) dan fokus pada **Input Massal** demi **kecepatan, akurasi, dan kebebasan pengguna**.

* **Akurasi adalah Kunci**: Teknologi scan seringkali tidak 100% akurat. Dengan **Input Massal**, Anda menyalin teks yang sudah pasti benar, menghilangkan risiko kesalahan angka.
* **Lebih Cepat dari Koreksi**: Proses menyalin-tempel teks dari catatan atau struk digital jauh lebih cepat daripada memindai lalu mengoreksi setiap baris hasil pindai yang mungkin salah.
* **Gratis & Open-Source Selamanya**: Layanan scan AI yang akurat memerlukan biaya. Dengan tetap fokus pada fitur yang efisien, **Kalkulator Receh akan selalu gratis dan open-source**.

## 🧪 Coba Demo dengan Data Contoh

Ingin langsung melihat cara kerja semua fitur tanpa input manual? Unduh file sesi contoh di bawah ini, lalu gunakan fitur **"Impor"** di aplikasi untuk memuatnya.

[**Unduh Contoh File JSON**](https://github.com/Mysteriza/split-bill-web/releases/download/v1.0.0-assets/kalkulator-receh-sesi-2025-08-03.json)

File ini berisi data lengkap untuk 6 peserta dengan 11 item pesanan yang sudah ditandai, lengkap dengan pajak dan diskon.

## 🚀 Teknologi yang Digunakan

* **Framework**: [Next.js](https://nextjs.org/)
* **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **Validasi Skema**: [Zod](https://zod.dev/)
* **Komponen UI**: [shadcn/ui](https://ui.shadcn.com/)
* **Animasi**: [Framer Motion](https://www.framer.com/motion/)
* **Keamanan**: [DOMPurify](https://github.com/cure53/DOMPurify)
* **Deployment**: [Vercel](https://vercel.com/)

## 🛠️ Panduan Instalasi & Setup Lokal

Ingin menjalankan proyek ini di komputer Anda? Ikuti langkah-langkah berikut:

1.  **Clone Repositori**
    Buka terminal Anda dan jalankan perintah berikut:
    ```bash
    git clone [https://github.com/Mysteriza/split-bill-web](https://github.com/Mysteriza/split-bill-web)
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

1.  **Kelola Peserta & Sesi**
    * Ketik nama di kolom *"Nama Peserta Baru..."* lalu tekan `Enter`.
    * Gunakan tombol **Kontak** untuk menambahkan dari daftar yang tersimpan di aplikasi, atau **Dari HP** untuk impor dari kontak perangkat.
    * Gunakan **Impor/Ekspor** untuk memuat atau menyimpan sesi perhitungan.

2.  **Input Semua Pesanan (Cara Cepat)**
    * Di kartu "Daftar Pesanan", gunakan area **Input Massal**.
    * Ketik atau *copy-paste* semua item dengan format: `Kuantitas Nama Item HargaTotal` per baris. Contoh: `2 Udang Keju 23836`.
    * Klik tombol **"Tambahkan Semua Item dari Teks"**.

3.  **Tandai & Kelola Item**
    * Setelah semua item masuk daftar, gunakan tombol aksi di samping setiap item untuk:
        * **Tandai Peserta** (<UserPlus />): Pilih siapa saja yang memesan item tersebut.
        * **Beri Diskon** (<Percent />), **Edit** (<Pencil />), atau **Hapus** (<Trash2 />).

4.  **Atur Biaya Tambahan & Penyederhanaan**
    * Isi PPN, Pajak Jasa, Ongkir, dan Diskon Global.
    * Atur pembulatan dan pilih siapa yang membayar tagihan untuk menyederhanakan utang.

5.  **Lihat & Bagikan Hasil**
    * Semua perhitungan akan ter-update secara **real-time**.
    * Klik tombol **"Bagikan Hasil"** untuk menyalin ringkasan teks yang super detail dan siap dikirim ke WhatsApp.

---

Terima kasih telah mengunjungi dan menggunakan proyek ini!
