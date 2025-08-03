"use client";

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Summary, SessionParticipant, BillItem } from '@/types';

interface SaveResultDialogProps {
  children: React.ReactNode;
  summary: Summary;
  participants: SessionParticipant[];
  items: BillItem[];
}

// Helper to format currency
const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(amount));
};

export function SaveResultDialog({ children, summary, items, participants }: SaveResultDialogProps) {
  const { toast } = useToast();
  
  // Function to generate text for WhatsApp/Clipboard
  const generateTxtContent = () => {
    if (!summary) return '';
    let content = `🧾 *Rincian Patungan - Kalkulator Receh* 🧾\n\n`;
    content += `====================================\n`;
    content += `*Ringkasan Biaya Bersama:*\n\n`;
    content += `Subtotal Pesanan: ${formatRupiah(summary.totalItemExpenses)}\n`;
    content += `PPN & Service Tax: ${formatRupiah(summary.ppnAmount + summary.serviceTaxAmount)}\n`;
    content += `Ongkir: ${formatRupiah(summary.deliveryFee)}\n`;
    content += `Total Diskon: -${formatRupiah(summary.totalDiscount)}\n`;
    content += `------------------------------------\n`;
    content += `*Total Tagihan (Sebelum Pembulatan): ${formatRupiah(summary.totalBill)}*\n`;
    if (summary.roundingDifference !== 0) {
      content += `*Total Akhir (Setelah Pembulatan): ${formatRupiah(summary.grandTotal)}*\n`;
    }
    content += `\n`;
    
    content += `====================================\n`;
    content += `*👤 Rincian Bayar Per Orang:*\n\n`;
    summary.participants.forEach(p => {
      content += `• *${p.name}* » *${formatRupiah(p.totalToPay)}*\n`;
    });
    content += `\n`;

    if (summary.transactions.length > 0) {
        content += `====================================\n`;
        content += `*💳 Rincian Utang (Sudah Disederhanakan):*\n\n`;
        summary.transactions.forEach(t => {
            content += `  - *${t.from}* harus bayar *${formatRupiah(t.amount)}* ke *${t.to}*\n`;
        });
        content += `\n`;
    }

    content += `====================================\n`;
    content += `_Dihitung dengan Kalkulator Receh ✨_`;
    return content;
  };
  
  const generateHtmlPreview = () => {
    const textContent = generateTxtContent();
    return { __html: textContent.replace(/\n/g, '<br />').replace(/\*(.*?)\*/g, '<strong>$1</strong>').replace(/_(.*?)_/g, '<em>$1</em>') };
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateTxtContent());
      toast({ title: 'Berhasil!', description: 'Rincian berhasil disalin ke clipboard.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Tidak dapat menyalin ke clipboard.' });
    }
  };

  // --- START: Rewritten PDF Generation Logic ---
  const handleDownloadPdf = () => {
    if (!summary) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Hasil Perhitungan Patungan', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dibuat pada: ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, 26, { align: 'center' });

    // Table: Totals per Person
    autoTable(doc, {
      startY: 35,
      head: [['Total Patungan per Orang', '']],
      body: summary.participants.map(p => [p.name, formatRupiah(p.totalToPay)]),
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
      bodyStyles: { cellPadding: 2 },
      foot: [[{content: 'Grand Total (Dibulatkan)', styles: {fontStyle: 'bold'}}, {content: formatRupiah(summary.grandTotal), styles: {fontStyle: 'bold'}}]],
      showFoot: 'lastPage',
    });

    let lastY = (doc as any).lastAutoTable.finalY;

    // Table: Debt Details (if any)
    if (summary.transactions.length > 0) {
      autoTable(doc, {
        startY: lastY + 10,
        head: [['Rincian Pembayaran (Utang)', '']],
        body: summary.transactions.map(t => [
            `${t.from} bayar ke ${t.to}`,
            formatRupiah(t.amount)
        ]),
        theme: 'striped',
        headStyles: { fillColor: [22, 160, 133], fontStyle: 'bold' }
      });
      lastY = (doc as any).lastAutoTable.finalY;
    }

    // Table: Bill Summary
    autoTable(doc, {
      startY: lastY + 10,
      head: [['Ringkasan Tagihan', '']],
      body: [
        ['Subtotal Item', formatRupiah(summary.totalItemExpenses)],
        ['PPN & Service Tax', formatRupiah(summary.ppnAmount + summary.serviceTaxAmount)],
        ['Ongkos Kirim', formatRupiah(summary.deliveryFee)],
        ['Diskon Global', `-${formatRupiah(summary.totalDiscount)}`],
        [{content: 'Total Tagihan Asli', styles: {fontStyle: 'bold'}}, {content: formatRupiah(summary.totalBill), styles: {fontStyle: 'bold'}}]
      ],
      theme: 'grid',
      headStyles: { fillColor: [80, 80, 80] },
    });

    doc.save(`hasil-patungan-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast({ description: "PDF berhasil dibuat." });
  };
  // --- END: Rewritten PDF Generation Logic ---

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Simpan Hasil Perhitungan</DialogTitle>
          <DialogDescription>
            Pilih format untuk menyimpan atau membagikan hasil perhitungan ini.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="p-4 border rounded-md bg-muted/50 max-h-48 overflow-y-auto">
              <div className="text-xs whitespace-pre-wrap font-sans" dangerouslySetInnerHTML={generateHtmlPreview()} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button onClick={handleCopyToClipboard}>Salin Teks untuk WhatsApp</Button>
            <Button onClick={handleDownloadPdf} variant="secondary">Unduh sebagai PDF</Button>
          </div>
        </div>
        <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Tutup</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}