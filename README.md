# 🧾 Kalkulator Receh / Split Bill Web

[![id](https://img.shields.io/badge/lang-id-blue.svg)](README-id.md)

Welcome to **Kalkulator Receh**, a modern web application designed to simplify the process of splitting bills with friends. Built with Next.js and TypeScript, this app offers a smart, interactive, and highly efficient user experience.

Check out the live demo: **[https://retro-split-bill-web.vercel.app/](https://retro-split-bill-web.vercel.app/)**

<img width="1920" height="1177" alt="Kalkulator Receh Interface" src="https://github.com/user-attachments/assets/58b41d6f-26d5-44d9-b210-7e664465e601" />

## ✨ Key Features

This application is equipped with various advanced features to make splitting bills as fast and easy as possible:

*   **AI Receipt Scanner**: Snap a photo or upload your receipt and let AI extract the items and prices automatically.
*   **Rigid Sequential Flow**: A step-by-step locked workflow ensures data consistency from adding participants to final checkout.
*   **Multi-language Support (I18n)**: Seamlessly switch between English and Indonesian at any time.
*   **Auto-Saved Sessions**: Your session (participants, items, costs) is automatically saved in the browser. When you return, the app will offer to restore your last session.
*   **Interactive Bulk Input**: Paste multiple lines of orders from a receipt at once with real-time validation preview.
*   **Mark Debts as Paid**: Easily track payment status using the checkbox feature on debt details.
*   **Flexible Item Management**: Edit, delete, and tag items to multiple participants, complete with logic that limits tags based on item quantity.
*   **Copy Text for WhatsApp**: Copy the calculation results in a neat and super detailed text format—complete with item details per person—ready to be shared.
*   **Responsive & Optimized Design**: A neat and well-structured interface on both desktop and mobile devices.

## 🚀 Technologies Used

*   **Framework**: [Next.js](https://nextjs.org/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Hybrid App**: [Capacitor](https://capacitorjs.com/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Schema Validation**: [Zod](https://zod.dev/)
*   **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
*   **Animation**: [Framer Motion](https://www.framer.com/motion/)
*   **Security**: [DOMPurify](https://github.com/cure53/DOMPurify)
*   **AI Backend**: [Groq API](https://groq.com/)
*   **Deployment**: [Vercel](https://vercel.com/)

## 🛠️ Installation & Local Setup

Want to run this project on your computer? Follow these steps:

1.  **Clone Repository**
    ```bash
    git clone https://github.com/Mysteriza/split-bill-web
    cd split-bill-web
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

4.  **Open Application**
    Open your browser and visit [http://localhost:3000](http://localhost:3000) (or another port shown in the terminal).

---

Thank you for checking out this project!
