import { BillSplitter } from "@/components/bill-splitter";

export default function Home() {
  return (
    <main className="container mx-auto max-w-7xl p-4 md:p-8">
      {/* Bagian Header yang Ditambahkan Kembali */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Kalkulator Receh
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Aplikasi patungan untuk membagi tagihan dengan mudah.
        </p>
      </header>
      
      <BillSplitter />
    </main>
  );
}