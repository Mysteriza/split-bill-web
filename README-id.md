# 🧾 Kalkulator Receh / Split Bill Web

[![en](https://img.shields.io/badge/lang-en-red.svg)](README.md)

Selamat datang di **Kalkulator Receh**, sebuah aplikasi web modern yang dirancang untuk mempermudah proses pembagian tagihan (*split bill*) bersama teman-teman. Dibangun dengan Next.js dan TypeScript, aplikasi ini menawarkan pengalaman pengguna yang cerdas, interaktif, dan sangat efisien.

Lihat demonya secara langsung di: **[https://retro-split-bill-web.vercel.app/](https://retro-split-bill-web.vercel.app/)**

<img width="1920" height="1177" alt="Tampilan Aplikasi Kalkulator Receh" src="https://github.com/user-attachments/assets/58b41d6f-26d5-44d9-b210-7e664465e601" />

## ✨ Fitur Utama

Aplikasi ini dilengkapi dengan berbagai fitur canggih untuk memastikan proses patungan menjadi secepat dan semudah mungkin:

*   **Pemindai Struk AI**: Ambil foto atau unggah struk belanja dan biarkan AI mengekstrak item dan harga secara otomatis.
*   **Alur Sekuensial Rigid**: Alur kerja bertahap yang terkunci memastikan konsistensi data dari awal menambah peserta hingga hasil akhir.
*   **Dukungan Multi-bahasa (I18n)**: Berganti bahasa antara Bahasa Inggris dan Indonesia kapan saja dengan mulus.
*   **Sesi Tersimpan Otomatis**: Sesi Anda (peserta, item, biaya) disimpan secara otomatis di browser. Saat Anda kembali, aplikasi akan menawarkan untuk melanjutkan sesi terakhir.
*   **Input Massal Interaktif**: Tempel beberapa baris pesanan dari struk sekaligus dengan pratinjau validasi *real-time* untuk memastikan tidak ada kesalahan format.
*   **Tandai Utang Lunas**: Lacak status pembayaran dengan mudah menggunakan fitur centang pada rincian utang.
*   **Manajemen Item Fleksibel**: Edit, hapus, dan tandai item ke beberapa peserta, dilengkapi dengan logika yang membatasi jumlah tag sesuai kuantitas item.
*   **Salin Teks untuk WhatsApp**: Salin hasil perhitungan dalam format teks yang rapi dan super detail—lengkap dengan rincian item per orang—siap untuk dibagikan.
*   **Desain Responsif & Optimal**: Tampilan yang rapi dan terstruktur baik di desktop maupun mobile.

## 🚀 Teknologi yang Digunakan

*   **Framework**: [Next.js](https://nextjs.org/)
*   **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
*   **Aplikasi Hybrid**: [Capacitor](https://capacitorjs.com/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Validasi Skema**: [Zod](https://zod.dev/)
*   **Komponen UI**: [shadcn/ui](https://ui.shadcn.com/)
*   **Animasi**: [Framer Motion](https://www.framer.com/motion/)
*   **Keamanan**: [DOMPurify](https://github.com/cure53/DOMPurify)
*   **AI Backend**: [Groq API](https://groq.com/)
*   **Deployment**: [Vercel](https://vercel.com/)

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
