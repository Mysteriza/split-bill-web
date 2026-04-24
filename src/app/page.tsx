"use client";

import { BillSplitter } from "@/components/bill-splitter";
import { LanguageProvider, useLanguage } from "@/lib/i18n";
import { motion } from "framer-motion";

function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  
  return (
    <button 
      className="flex items-center bg-muted/50 hover:bg-muted/80 backdrop-blur-md rounded-full p-1 cursor-pointer border border-border/50 shadow-sm transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
      aria-label="Toggle Language"
    >
      <div className="relative flex items-center w-28">
        <motion.div
          className="absolute inset-y-0 rounded-full bg-background shadow-md border border-border/50"
          layout
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          style={{ width: '50%' }}
          initial={false}
          animate={{ x: lang === 'id' ? 0 : '100%' }}
        />
        <div className={`relative z-10 w-1/2 flex justify-center py-1.5 text-xs font-bold items-center gap-1.5 transition-colors duration-300 ${lang === 'id' ? 'text-primary' : 'text-muted-foreground'}`}>
          ID
        </div>
        <div className={`relative z-10 w-1/2 flex justify-center py-1.5 text-xs font-bold items-center gap-1.5 transition-colors duration-300 ${lang === 'en' ? 'text-primary' : 'text-muted-foreground'}`}>
          EN
        </div>
      </div>
    </button>
  );
}

function AppContent() {
  const { lang, t } = useLanguage();
  return (
    <main className="container mx-auto max-w-7xl p-4 md:p-8 relative">
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-10">
        <LanguageSwitcher />
      </div>
      {/* Bagian Header yang Ditambahkan Kembali */}
      <header className="mb-8 text-center mt-12 md:mt-0">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          {t('appTitle')}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t('appSubtitle')}
        </p>
      </header>
      
      <BillSplitter />
    </main>
  );
}

export default function Home() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}