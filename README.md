# 🧾 Kalkulator Receh

Selamat datang di **Kalkulator Receh**, sebuah aplikasi web modern yang dirancang untuk mempermudah proses pembagian tagihan (*split bill*) bersama teman-teman. Dibangun dengan Next.js dan TypeScript, aplikasi ini menawarkan pengalaman pengguna yang cerdas, interaktif, dan sangat efisien.

Lihat demonya secara langsung di: **[https://retro-split-bill-web.vercel.app/](https://retro-split-bill-web.vercel.app/)**

<img width="1920" height="1177" alt="Tampilan Aplikasi Kalkulator Receh" src="https://github.com/user-attachments/assets/58b41d6f-26d5-44d9-b210-7e664465e601" />

## ✨ Fitur Utama

Aplikasi ini dilengkapi dengan berbagai fitur canggih untuk memastikan proses patungan menjadi secepat dan semudah mungkin:

* **Sesi Tersimpan Otomatis**: Sesi Anda (peserta, item, biaya) disimpan secara otomatis di browser. Saat Anda kembali, aplikasi akan menawarkan untuk melanjutkan sesi terakhir.
* **Input Massal Interaktif**: Tempel beberapa baris pesanan dari struk sekaligus dengan pratinjau validasi *real-time* untuk memastikan tidak ada kesalahan format.
* **Manajemen Sesi (Impor/Ekspor)**: Simpan dan muat kembali seluruh sesi perhitungan menggunakan file **JSON**, dilindungi oleh validasi skema **Zod**.
* **Tandai Utang Lunas**: Lacak status pembayaran dengan mudah menggunakan fitur centang pada rincian utang.
* **Manajemen Item Fleksibel**: Edit, hapus, dan tandai item ke beberapa peserta, dilengkapi dengan logika yang membatasi jumlah tag sesuai kuantitas item.
* **Salin Teks untuk WhatsApp**: Salin hasil perhitungan dalam format teks yang rapi dan super detail—lengkap dengan rincian item per orang—siap untuk dibagikan.
* **Desain Responsif & Optimal**: Tampilan yang rapi dan terstruktur baik di desktop maupun mobile.

## 📱 Coba Aplikasi Android (.apk)

Anda bisa mengunduh dan meng-install versi Android dari aplikasi ini langsung di HP Anda melalui tautan di bawah ini.

[**Unduh Kalkulator Receh v1.0.0.apk**](https://github.com/Mysteriza/split-bill-web/releases/download/v1.0.0-assets/Kalkulator.Receh.apk)

## 🧪 Coba Demo dengan Data Contoh

Ingin langsung melihat cara kerja semua fitur tanpa input manual? Unduh file sesi contoh di bawah ini, lalu gunakan fitur **"Impor"** di aplikasi untuk memuatnya.

[**Unduh File JSON Contoh**](https://github.com/Mysteriza/split-bill-web/releases/download/v1.0.0-assets/kalkulator-receh-sesi-2025-08-03.json)

## 🤔 Mengapa Input Massal Lebih Baik dari Scan Struk?

Kami sengaja memilih untuk tidak mengimplementasikan fitur scan struk (OCR) dan fokus pada **Input Massal** demi **kecepatan, akurasi, dan kebebasan pengguna**.

* **Akurasi adalah Kunci**: Dengan **Input Massal**, Anda menyalin teks yang sudah pasti benar, menghilangkan risiko kesalahan angka.
* **Lebih Cepat dari Koreksi**: Proses menyalin-tempel teks dari catatan jauh lebih cepat daripada memindai lalu mengoreksi setiap baris hasil pindai yang mungkin salah.
* **Gratis & Open-Source Selamanya**: **Kalkulator Receh akan selalu gratis dan open-source**.

## 🚀 Teknologi yang Digunakan

* **Framework**: [Next.js](https://nextjs.org/)
* **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
* **Aplikasi Hybrid**: [Capacitor](https://capacitorjs.com/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **Validasi Skema**: [Zod](https://zod.dev/)
* **Komponen UI**: [shadcn/ui](https://ui.shadcn.com/)
* **Animasi**: [Framer Motion](https://www.framer.com/motion/)
* **Keamanan**: [DOMPurify](https://github.com/cure53/DOMPurify)
* **Deployment**: [Vercel](https://vercel.com/)

## 🛠️ Panduan Instalasi & Setup Lokal

Ingin menjalankan proyek ini di komputer Anda? Ikuti langkah-langkah berikut:

1.  **Clone Repositori**
    ```bash
    git clone https://github.com/Mysteriza/split-bill-web
    cd split-bill-web
    ```

2.  **Instal Dependensi**
    ```bash
    npm install
    ```

3.  **Jalankan Server Development**
    ```bash
    npm run dev
    ```

4.  **Buka Aplikasi**
    Buka browser Anda dan kunjungi [http://localhost:3000](http://localhost:3000) (atau port lain yang ditampilkan di terminal).

---

Terima kasih telah mengunjungi dan menggunakan proyek ini!
