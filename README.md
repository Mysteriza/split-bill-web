# 🧾 Kalkulator Receh

Selamat datang di **Kalkulator Receh**, sebuah aplikasi web modern yang dirancang untuk mempermudah proses pembagian tagihan (*split bill*) bersama teman-teman. Dibangun dengan Next.js dan TypeScript, aplikasi ini menawarkan pengalaman pengguna yang cerdas, interaktif, dan sangat efisien.

Lihat demonya secara langsung di: **[https://retro-split-bill-web.vercel.app/](https://retro-split-bill-web.vercel.app/)**

<img width="1920" height="1177" alt="Tampilan Aplikasi Kalkulator Receh" src="https://github.com/user-attachments/assets/58b41d6f-26d5-44d9-b210-7e664465e601" />

## ✨ Fitur Utama

Aplikasi ini dilengkapi dengan berbagai fitur canggih untuk memastikan proses patungan menjadi secepat dan semudah mungkin:

* **Sesi Tersimpan Otomatis**: Jangan takut kehilangan data. Sesi Anda (peserta, item, biaya) disimpan secara otomatis di browser. Saat Anda kembali, aplikasi akan menawarkan untuk melanjutkan sesi terakhir.
* **Input Massal Interaktif**: Tempel beberapa baris pesanan dari struk sekaligus. Sistem akan memberikan pratinjau validasi secara *real-time*, menyorot baris yang formatnya benar (✅) atau salah (❌) sebelum ditambahkan.
* **Manajemen Sesi (Impor/Ekspor)**: Simpan seluruh sesi perhitungan ke dalam file **JSON**. Muat kembali sesi tersebut kapan pun Anda butuhkan, dilindungi oleh validasi skema **Zod** untuk mencegah *crash* akibat file korup.
* **Tandai Utang Lunas**: Di rincian utang, Anda bisa mencentang siapa saja yang sudah membayar, membantu melacak status pembayaran dengan mudah.
* **Manajemen Item Fleksibel**: Edit, hapus, dan tandai item ke beberapa peserta, dilengkapi dengan logika yang membatasi jumlah tag sesuai kuantitas item.
* **Salin Teks untuk WhatsApp**: Salin hasil perhitungan dalam format teks yang rapi dan super detail—lengkap dengan rincian item per orang—siap untuk dibagikan.
* **Desain Responsif & Optimal**: Tampilan yang rapi dan terstruktur baik di desktop maupun mobile, dengan penyesuaian UI seperti menu aksi *dropdown* untuk menghemat ruang.

## 🤔 Mengapa Input Massal Lebih Baik dari Scan Struk?

Kami sengaja memilih untuk tidak mengimplementasikan fitur scan struk (OCR) dan fokus pada **Input Massal** demi **kecepatan, akurasi, dan kebebasan pengguna**.

* **Akurasi adalah Kunci**: Teknologi scan seringkali tidak 100% akurat. Dengan **Input Massal**, Anda menyalin teks yang sudah pasti benar, menghilangkan risiko kesalahan angka.
* **Lebih Cepat dari Koreksi**: Proses menyalin-tempel teks dari catatan atau struk digital jauh lebih cepat daripada memindai lalu mengoreksi setiap baris hasil pindai yang mungkin salah.
* **Gratis & Open-Source Selamanya**: Layanan scan AI yang akurat memerlukan biaya. Dengan tetap fokus pada fitur yang efisien, **Kalkulator Receh akan selalu gratis dan open-source**.

## 🧪 Coba Demo dengan Data Contoh

Ingin langsung melihat cara kerja semua fitur tanpa input manual? Unduh file sesi contoh di bawah ini, lalu gunakan fitur **"Impor"** di aplikasi untuk memuatnya.

[**Unduh File JSON Contoh**](https://github.com/Mysteriza/split-bill-web/releases/download/v1.0.0-assets/kalkulator-receh-sesi-2025-08-03.json)

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
    * Gunakan tombol **Kontak** untuk menambahkan dari daftar yang tersimpan di aplikasi.
    * Gunakan **Impor/Ekspor** untuk memuat atau menyimpan sesi perhitungan.

2.  **Input Semua Pesanan (Cara Cepat)**
    * Di kartu "Daftar Pesanan", gunakan area **Input Massal**.
    * Ketik atau *copy-paste* semua item dengan format: `Kuantitas Nama Item HargaTotal` per baris. Contoh: `2 Udang Keju 23836`.
    * Lihat pratinjau validasi di bawahnya untuk memastikan semua format benar, lalu klik **"Tambahkan Semua Item"**.

3.  **Tandai & Kelola Item**
    * Setelah semua item masuk daftar, gunakan tombol aksi di samping setiap item untuk **Tandai Peserta**, **Beri Diskon**, **Edit**, atau **Hapus**.

4.  **Atur Biaya & Penyederhanaan**
    * Isi PPN, Pajak Jasa, Ongkir, dan Diskon Global.
    * Atur pembulatan dan pilih siapa yang membayar tagihan. Jika sudah ada yang membayar, centang *checkbox* di kartu "Rincian Utang".

5.  **Lihat & Bagikan Hasil**
    * Semua perhitungan akan ter-update secara **real-time**.
    * Klik tombol **"Bagikan Hasil"** untuk menyalin ringkasan teks yang super detail dan siap dikirim ke WhatsApp.

---

Terima kasih telah mengunjungi dan menggunakan proyek ini!
