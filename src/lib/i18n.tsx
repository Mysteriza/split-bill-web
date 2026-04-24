import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'id' | 'en';

const dictionaries = {
  id: {
    // General
    cancel: "Batal",
    confirm: "Konfirmasi",
    saveChanges: "Simpan Perubahan",
    delete: "Hapus",
    edit: "Edit",
    add: "Tambah",
    
    // Header & Global
    appTitle: "Kalkulator Receh",
    appSubtitle: "Bagi tagihan tanpa pusing. Cepat, presisi, dan adil.",
    language: "Bahasa",
    
    // Step 1
    step1Title: "Peserta & Sesi",
    step1Placeholder: "Nama Peserta Baru...",
    addParticipant: "Tambah",
    contacts: "Kontak",
    import: "Impor",
    export: "Ekspor",
    reset: "Reset",
    
    // Step 2
    step2Title: "Input Pesanan",
    manualOrScan: "Manual / Scan Struk",
    bulkInputPlaceholder: "1 Nasi Goreng Spesial 25000\n2 Es Teh Manis 10000\n1 Kerupuk 2000",
    bulkInputHelp: "Format: Qty Nama Item HargaTotal. Scan Struk untuk mengisi otomatis, lalu audit dan edit bila perlu.",
    addOrders: "Tambahkan Item",
    min2Participants: "Tambahkan minimal 2 peserta di Tahap 1 untuk mulai memasukkan pesanan.",
    
    // Step 3
    step3Title: "Bagi Pesanan",
    unassignedItemsAlert: "Item Belum Dibagi!",
    min2Orders: "Tambahkan minimal 2 pesanan di Tahap 2 untuk mulai membagi tagihan.",
    tagParticipant: "Tandai Peserta",
    giveDiscount: "Beri Diskon",
    editItem: "Edit Item",
    deleteItem: "Hapus Item",
    assign: "Bagi",
    
    // Step 4
    step4Title: "Biaya Tambahan & Hasil Akhir",
    step4LockAlert: "Pastikan semua pesanan telah terbagi rata ke peserta di Tahap 3 untuk melihat hasil perhitungan akhir.",
    ppn: "PPN (%)",
    serviceTax: "Service Tax",
    deliveryFee: "Ongkir (Rp)",
    globalDiscount: "Diskon Global",
    
    // Visualization & Summary
    visualization: "Visualisasi Porsi Bayar",
    simplification: "Penyederhanaan",
    rounding: "Pembulatan",
    roundingNone: "Tidak ada",
    rounding100: "Ke atas (Rp 100)",
    rounding500: "Ke atas (Rp 500)",
    rounding1000: "Ke atas (Rp 1.000)",
    whoPaid: "Siapa yang Bayar?",
    notDetermined: "Belum Ditentukan",
    debtDetails: "Rincian Utang",
    mustPayTo: "harus bayar",
    to: "ke",
    
    // Final Totals
    grandTotals: "Total Keseluruhan",
    subtotalItem: "Subtotal Item",
    totalBill: "Total Tagihan",
    grandTotal: "Grand Total",
    
    // Split Result
    splitResult: "Hasil Patungan",
    shareResult: "Bagikan Hasil",
    
    // Popup & Actions
    processingOCR: "Memproses OCR...",
    ocrError: "Gagal terhubung ke server OCR",
    noItemsFound: "Tidak ada item yang ditemukan pada struk",
    scanFailed: "Gagal memindai struk.",
    cameraScanner: "Kamera Pemindai",
    loadingCamera: "Memuat kamera...",
    cameraError: "Kamera gagal dimuat. Pastikan izin kamera diberikan atau gunakan opsi Upload File.",
    takePhoto: "Ambil Foto",
    aiWarningTitle: "Peringatan Hasil AI",
    aiWarningDesc: "AI menemukan item dari struk. Hasil AI mungkin tidak 100% akurat. <strong>Mohon periksa kembali dan edit jika perlu.</strong>",
    gotItCheck: "Baik, Saya Akan Cek",
    saveShareResult: "Simpan & Bagikan Hasil",
    copyToClipboard: "Salin ke Clipboard",
    shareToWhatsApp: "Bagikan ke WhatsApp",
    gotItStart: "Saya Paham, Ayo Mulai!",
    copiedSuccess: "Berhasil disalin ke clipboard!",
    resetAllConfirmTitle: "Reset Semua Data?",
    resetAllConfirmDesc: "Aksi ini akan menghapus semua peserta, item, dan pengaturan biaya. Anda yakin ingin melanjutkan?",
    deleteItemConfirmTitle: "Hapus Item Ini?",
    deleteItemConfirmDesc: "Anda yakin ingin menghapus item ini?",
    tagParticipantTitle: "Tandai Peserta untuk Item:",
    tagParticipantLimit: "Pilih hingga <strong>{qty} peserta</strong> (sesuai kuantitas item).",
    saveTag: "Simpan Tanda",
    aiWarningCount: "Banyaknya item:",
    openCamera: "Buka Kamera",
    uploadReceipt: "Upload File Struk",
    restoreSessionTitle: "Lanjutkan Sesi Sebelumnya?",
    restoreSessionDesc: "Kami menemukan data tagihan yang belum selesai dari sesi Anda sebelumnya. Apakah Anda ingin melanjutkannya atau mulai dari awal?",
    startFresh: "Mulai Baru",
    continueSession: "Lanjutkan",
    
    // Toasts and notifications
    toastAllFieldsRequired: "Semua field harus diisi dengan benar.",
    toastAdded: "\"{name}\" berhasil ditambahkan.",
    toastItemsAdded: "{count} item berhasil ditambahkan.",
    toastLinesFailed: "{count} baris gagal diproses. Periksa pratinjau untuk detail.",
    toastItemUpdated: "Item berhasil diperbarui.",
    toastFailCopy: "Tidak dapat menyalin ke clipboard.",
    toastSuccessTitle: "Berhasil!",
    toastFailTitle: "Gagal",
    toastCopiedDetail: "Rincian berhasil disalin ke clipboard.",
    
    // Result Text Generator
    resTitle: "🧾 *Rincian Patungan - Kalkulator Receh* 🧾",
    resPerPerson: "*👤 Rincian Bayar Per Orang:*",
    resDebtDetails: "*💳 Rincian Utang (Sudah Disederhanakan):*",
    resSharedCost: "*Ringkasan Biaya Bersama:*",
    resSubtotal: "Subtotal Pesanan:",
    resTax: "PPN & Service Tax:",
    resDelivery: "Ongkir:",
    resDiscount: "Total Diskon:",
    resTotalBill: "*Total Tagihan: {amount}*",
    resFooter: "_Dihitung dengan Kalkulator Receh ✨_",
    mustPay: "harus bayar",
    
    // UI General
    saveShareResultDialogTitle: "Bagikan Hasil Perhitungan",
    saveShareResultDialogDesc: "Salin teks di bawah ini untuk dibagikan ke teman-teman Anda melalui WhatsApp atau aplikasi lain.",
    copyTextWA: "Salin Teks untuk WhatsApp",
    choosePayer: "Pilih Pembayar",
    chooseRounding: "Pilih Pembulatan",
    totalTip: "Total kelebihan (tip): ",
    totalShortfall: "Total kekurangan: ",
    shareOfPPN: "Bagian PPN",
    shareOfServiceTax: "Bagian Service Tax",
    shareOfDeliveryFee: "Bagian Ongkir",
    shareOfDiscount: "Bagian Diskon",
    contactBook: "Buku Kontak",
    contactDesc: "Pilih kontak untuk ditambahkan ke sesi ini atau tambah kontak baru.",
    newContactName: "Nama Kontak Baru",
    noContacts: "Belum ada kontak tersimpan.",
    discountFor: "Diskon untuk Item:",
    percent: "Persen (%)",
    amount: "Jumlah (Rp)",
    discountValue: "Nilai Diskon",
    saveDiscount: "Simpan Diskon",
    editOrder: "Ubah detail pesanan di bawah ini.",
    itemName: "Nama Item",
    qty: "Kuantitas",
    price: "Harga Satuan",
    tutorialTitle: "Panduan Lengkap",
    tutorialHeader: "Cara Pakai Kalkulator Receh",
    tutorialDesc: "Aplikasi ini menggunakan sistem tahapan (*sequential*) yang saling mengunci untuk mencegah kesalahan patungan. Ikuti alur berikut:",
    tutStep1Desc: "Ketik nama teman-teman Anda yang ikut patungan, atau pilih dari Buku Kontak. <strong>Anda wajib mendaftarkan minimal 2 peserta</strong> agar Tahap 2 terbuka.",
    tutStep2Desc: "Setelah Tahap 1 selesai, masukkan daftar pesanan. Gunakan fitur <strong>Scan Struk</strong> (Kamera/Upload) agar AI otomatis menyalin isi struk. Jika ingin manual, ketik dengan format <code>Qty Nama_Item Harga_Total (Cth: 2 Es Teh 10000)</code>. Masukkan <strong>minimal 2 item pesanan</strong>.",
    tutStep3Desc: "Pada daftar ini, klik tombol <strong>Bagi (Ikon Orang)</strong> di tiap pesanan untuk memilih siapa saja yang ikut menikmatinya. Pesanan yang belum terbagi akan berwarna merah. <strong>Tahap 4 akan terus terkunci selama masih ada item merah!</strong>",
    tutStep4Desc: "Setelah seluruh pesanan di Tahap 3 terbagi habis, tahap ini akan otomatis terbuka. Tambahkan PPN (misal 11%), Ongkir, dll. Hasil patungan akan terkalkulasi secara presisi dan langsung siap di-copy ke WhatsApp!",
  },
  en: {
    // General
    cancel: "Cancel",
    confirm: "Confirm",
    saveChanges: "Save Changes",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    
    // Header & Global
    appTitle: "Split Bill Web",
    appSubtitle: "Split bills without the headache. Fast, precise, and fair.",
    language: "Language",
    
    // Step 1
    step1Title: "Participants & Session",
    step1Placeholder: "New Participant Name...",
    addParticipant: "Add",
    contacts: "Contacts",
    import: "Import",
    export: "Export",
    reset: "Reset",
    
    // Step 2
    step2Title: "Input Orders",
    manualOrScan: "Manual / Scan Receipt",
    bulkInputPlaceholder: "1 Special Fried Rice 25000\n2 Sweet Iced Tea 10000\n1 Crackers 2000",
    bulkInputHelp: "Format: Qty ItemName TotalPrice. Scan Receipt to auto-fill, then audit and edit if needed.",
    addOrders: "Add Items",
    min2Participants: "Add at least 2 participants in Step 1 to start inputting orders.",
    
    // Step 3
    step3Title: "Assign Orders",
    unassignedItemsAlert: "Unassigned Items!",
    min2Orders: "Add at least 2 orders in Step 2 to start assigning them.",
    tagParticipant: "Tag Participant",
    giveDiscount: "Give Discount",
    editItem: "Edit Item",
    deleteItem: "Delete Item",
    assign: "Assign",
    
    // Step 4
    step4Title: "Additional Costs & Final Result",
    step4LockAlert: "Ensure all orders are assigned to participants in Step 3 to view the final calculation.",
    ppn: "Tax (%)",
    serviceTax: "Service Charge",
    deliveryFee: "Delivery Fee",
    globalDiscount: "Global Discount",
    
    // Visualization & Summary
    visualization: "Payment Portion Visualization",
    simplification: "Simplification",
    rounding: "Rounding",
    roundingNone: "None",
    rounding100: "Round up (100)",
    rounding500: "Round up (500)",
    rounding1000: "Round up (1000)",
    whoPaid: "Who Paid?",
    notDetermined: "Not Determined",
    debtDetails: "Debt Details",
    mustPayTo: "must pay",
    to: "to",
    
    // Final Totals
    grandTotals: "Grand Totals",
    subtotalItem: "Item Subtotal",
    totalBill: "Total Bill",
    grandTotal: "Grand Total",
    
    // Split Result
    splitResult: "Split Result",
    shareResult: "Share Result",
    
    // Popup & Actions
    processingOCR: "Processing OCR...",
    ocrError: "Failed to connect to OCR server",
    noItemsFound: "No items found on the receipt",
    scanFailed: "Failed to scan receipt.",
    cameraScanner: "Camera Scanner",
    loadingCamera: "Loading camera...",
    cameraError: "Failed to load camera. Ensure camera permission is granted or use Upload File.",
    takePhoto: "Take Photo",
    aiWarningTitle: "AI Result Warning",
    aiWarningDesc: "AI found items from the receipt. AI results may not be 100% accurate. <strong>Please double check and edit if necessary.</strong>",
    gotItCheck: "Got It, I Will Check",
    saveShareResult: "Save & Share Result",
    copyToClipboard: "Copy to Clipboard",
    shareToWhatsApp: "Share to WhatsApp",
    gotItStart: "Got It, Let's Start!",
    copiedSuccess: "Successfully copied to clipboard!",
    resetAllConfirmTitle: "Reset All Data?",
    resetAllConfirmDesc: "This action will delete all participants, items, and cost settings. Are you sure you want to continue?",
    deleteItemConfirmTitle: "Delete This Item?",
    deleteItemConfirmDesc: "Are you sure you want to delete this item?",
    tagParticipantTitle: "Tag Participant for Item:",
    tagParticipantLimit: "Select up to <strong>{qty} participants</strong> (based on item quantity).",
    saveTag: "Save Tags",
    aiWarningCount: "Number of items:",
    openCamera: "Open Camera",
    uploadReceipt: "Upload Receipt File",
    restoreSessionTitle: "Continue Previous Session?",
    restoreSessionDesc: "We found unfinished bill data from your previous session. Would you like to continue or start fresh?",
    startFresh: "Start Fresh",
    continueSession: "Continue",
    
    // Toasts and notifications
    toastAllFieldsRequired: "All fields must be filled correctly.",
    toastAdded: "\"{name}\" successfully added.",
    toastItemsAdded: "{count} items successfully added.",
    toastLinesFailed: "{count} lines failed to process. Check preview for details.",
    toastItemUpdated: "Item successfully updated.",
    toastFailCopy: "Failed to copy to clipboard.",
    toastSuccessTitle: "Success!",
    toastFailTitle: "Failed",
    toastCopiedDetail: "Details successfully copied to clipboard.",
    
    // Result Text Generator
    resTitle: "🧾 *Split Bill Details - Kalkulator Receh* 🧾",
    resPerPerson: "*👤 Payment Details Per Person:*",
    resDebtDetails: "*💳 Debt Details (Simplified):*",
    resSharedCost: "*Shared Cost Summary:*",
    resSubtotal: "Order Subtotal:",
    resTax: "Tax & Service Charge:",
    resDelivery: "Delivery Fee:",
    resDiscount: "Total Discount:",
    resTotalBill: "*Total Bill: {amount}*",
    resFooter: "_Calculated with Kalkulator Receh ✨_",
    mustPay: "must pay",
    
    // UI General
    saveShareResultDialogTitle: "Share Calculation Result",
    saveShareResultDialogDesc: "Copy the text below to share with your friends via WhatsApp or other apps.",
    copyTextWA: "Copy Text for WhatsApp",
    choosePayer: "Select Payer",
    chooseRounding: "Select Rounding",
    totalTip: "Total excess (tip): ",
    totalShortfall: "Total shortfall: ",
    shareOfPPN: "Tax Share",
    shareOfServiceTax: "Service Tax Share",
    shareOfDeliveryFee: "Delivery Fee Share",
    shareOfDiscount: "Discount Share",
    contactBook: "Contact Book",
    contactDesc: "Select a contact to add to this session or add a new contact.",
    newContactName: "New Contact Name",
    noContacts: "No contacts saved yet.",
    discountFor: "Discount for Item:",
    percent: "Percent (%)",
    amount: "Amount",
    discountValue: "Discount Value",
    saveDiscount: "Save Discount",
    editOrder: "Edit the order details below.",
    itemName: "Item Name",
    qty: "Quantity",
    price: "Unit Price",
    tutorialTitle: "Complete Guide",
    tutorialHeader: "How to Use",
    tutorialDesc: "This app uses a strict sequential workflow to prevent split bill errors. Follow these steps:",
    tutStep1Desc: "Type the names of your friends sharing the bill, or pick from Contacts. <strong>You must register at least 2 participants</strong> to unlock Step 2.",
    tutStep2Desc: "Once Step 1 is done, input the orders. Use <strong>Scan Receipt</strong> (Camera/Upload) for AI to auto-fill. For manual, type: <code>Qty Item_Name Total_Price (Ex: 2 Iced Tea 10000)</code>. Add <strong>at least 2 orders</strong>.",
    tutStep3Desc: "In this list, click the <strong>Assign (User Icon)</strong> button on each order to select who consumed it. Unassigned orders will turn red. <strong>Step 4 remains locked as long as there are red items!</strong>",
    tutStep4Desc: "Once all orders in Step 3 are fully assigned, this step opens. Add Tax (e.g. 11%), Delivery, etc. The final split is precisely calculated and ready to be copied to WhatsApp!",
  }
};

type DictionaryKey = keyof typeof dictionaries['id'];

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: DictionaryKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('id');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang') as Language;
    if (savedLang && (savedLang === 'id' || savedLang === 'en')) {
      setLang(savedLang);
    }
  }, []);

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  const t = (key: DictionaryKey): string => {
    return dictionaries[lang][key] || dictionaries['id'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
