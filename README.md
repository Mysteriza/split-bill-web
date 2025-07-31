# 🧾 Kalkulator Receh

Selamat datang di **Kalkulator Receh**, sebuah aplikasi web modern yang dirancang untuk mempermudah proses pembagian tagihan (split bill) bersama teman-teman. Dibangun dengan Next.js dan TypeScript, aplikasi ini menawarkan pengalaman pengguna yang cepat, interaktif, dan intuitif.

Lihat demonya secara langsung di: **[https://retro-split-bill-web.vercel.app/](https://retro-split-bill-web.vercel.app/)**

<img width="1919" height="926" alt="image" src="https://github.com/user-attachments/assets/464b71bb-99f0-4941-9fd7-a98f68b38564" />

## ✨ Fitur Utama

Aplikasi ini dilengkapi dengan berbagai fitur canggih untuk memastikan proses patungan menjadi mudah dan menyenangkan:

* **Perhitungan Real-time**: Tidak perlu menekan tombol "hitung". Semua total tagihan dan bagian per orang akan diperbarui secara otomatis setiap kali Anda mengubah data.
* **Perhitungan Pajak Detail**: Input terpisah untuk **PPN (%)** dan **Service Tax (%)** untuk hasil yang lebih akurat sesuai struk restoran.
* **Manajemen Kontak**: Simpan daftar teman yang sering ikut patungan dalam "Buku Kontak". Tambahkan mereka ke sesi perhitungan dengan satu klik.
* **Input Item yang Fleksibel**: Tambah, **edit**, dan hapus item pesanan untuk setiap peserta dengan mudah.
* **Tutorial Interaktif**: Panduan penggunaan yang jelas dan mudah diakses langsung dari dalam aplikasi, cocok untuk pengguna baru.
* **Animasi Halus**: Antarmuka dilengkapi dengan animasi yang mulus saat menambah atau menghapus peserta dan item, memberikan umpan balik visual yang memuaskan.
* **Ekspor Hasil**: Simpan hasil perhitungan dalam format **PDF** yang rapi atau salin ringkasan teks yang sudah diformat khusus untuk dibagikan di aplikasi chat seperti **WhatsApp**.
* **Keamanan Input**: Dilengkapi dengan pembersihan input untuk mencegah *Cross-Site Scripting (XSS)*, memastikan data yang dimasukkan aman.
* **Desain Responsif**: Tampilan yang optimal baik di perangkat desktop maupun mobile.

## 🤔 Mengapa Tidak Ada Fitur Scan Struk?

Kami sengaja memilih untuk tidak mengimplementasikan fitur scan struk (OCR) demi **akurasi dan kebebasan pengguna**.

* **Akurasi adalah Kunci**: Teknologi scan, meskipun canggih, seringkali tidak 100% akurat dalam membaca struk yang berbeda formatnya, lecek, atau buram. Kesalahan kecil pada angka bisa menyebabkan perhitungan menjadi fatal.
* **Kontrol Penuh di Tangan Anda**: Metode input manual saat ini memastikan **Anda memiliki kontrol penuh** untuk menetapkan setiap item ke peserta yang benar, sesuatu yang tidak bisa dilakukan oleh AI secara otomatis. Ini adalah inti dari proses patungan yang adil.
* **Gratis & Open-Source Selamanya**: Layanan scan AI yang akurat memerlukan biaya, yang akan memaksa aplikasi ini menjadi berbayar. Dengan tetap sederhana, **Kalkulator Receh akan selalu gratis, open-source, dan dapat diandalkan**.

## 🚀 Teknologi yang Digunakan

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

1.  **Menambahkan Peserta ke Sesi**
    * **Cara Cepat**: Ketik nama teman di kolom *"Nama Peserta Baru..."* lalu tekan `Enter` atau klik tombol `+`. Nama ini akan otomatis tersimpan di kontak Anda untuk penggunaan selanjutnya.
    * **Dari Kontak**: Klik tombol *"Kelola Kontak"* untuk membuka daftar teman yang pernah Anda simpan. Klik tombol *"Tambah"* di samping nama mereka untuk memasukkannya ke sesi perhitungan saat ini.

2.  **Mencatat Pesanan Masing-Masing**
    * Setelah seorang peserta ditambahkan, sebuah kartu akan muncul atas namanya.
    * Di bagian bawah kartu tersebut, ada dua kolom: *"Nama item..."* dan *"Harga..."*.
    * Isi kedua kolom tersebut (misal: "Nasi Goreng" dan "25000"), lalu klik tombol `+` di sebelahnya. Item akan tercatat di bawah nama peserta tersebut.
    * Ulangi untuk semua pesanan dari setiap peserta.

3.  **Mengedit atau Menghapus Pesanan**
    * Di samping setiap item yang sudah tercatat, ada ikon pensil (✏️) untuk **mengedit** dan ikon silang (❌) untuk **menghapus**.

4.  **Mengatur Biaya Bersama**
    * Di kolom kanan, terdapat kartu *"Biaya Tambahan & Total"*.
    * Masukkan persentase **PPN** dan **Service Tax** jika ada (misal: 12% dan 5%).
    * Masukkan juga total biaya **Ongkir** dan **Diskon** dalam bentuk Rupiah.

5.  **Melihat Hasil Perhitungan**
    * Aplikasi ini bekerja secara **real-time**. Anda tidak perlu mencari tombol "Hitung".
    * Setiap kali Anda menambah item atau mengubah biaya tambahan, kartu *"Hasil Patungan"* di kanan bawah akan otomatis diperbarui, menampilkan total yang harus dibayar oleh setiap orang.

6.  **Menyimpan dan Membagikan Hasil**
    * Setelah semua perhitungan selesai, klik tombol **"Simpan"** di kartu "Hasil Patungan".
    * Pilih **"Salin Teks untuk WhatsApp"** untuk menyalin ringkasan yang rapi dan siap dibagikan di grup chat.
    * Pilih **"Unduh sebagai PDF"** untuk menyimpan laporan yang lebih detail dan formal.

---

Terima kasih telah mengunjungi dan menggunakan proyek ini!
