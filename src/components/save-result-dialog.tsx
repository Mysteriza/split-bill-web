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
  participants: SessionParticipant[]; // Tambahkan properti 'participants' di sini
  items: BillItem[];
}

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(amount));
};

export function SaveResultDialog({ children, summary }: SaveResultDialogProps) {
  const { toast } = useToast();
  
  const generateTxtContent = () => {
    let content = `🧾 *Rincian Patungan - Kalkulator Receh* 🧾\n\n`;
    content += `====================================\n`;
    content += `*Ringkasan Biaya Bersama:*\n\n`;
    content += `Subtotal Pesanan: ${formatRupiah(summary.totalItemExpenses)}\n`;
    content += `PPN: ${formatRupiah(summary.ppnAmount)}\n`;
    content += `Service Tax: ${formatRupiah(summary.serviceTaxAmount)}\n`;
    content += `Ongkir: ${formatRupiah(summary.deliveryFee)}\n`;
    content += `Diskon: -${formatRupiah(summary.discount)}\n`;
    content += `------------------------------------\n`;
    content += `*Total Tagihan: ${formatRupiah(summary.totalBill)}*\n\n`;
    
    content += `====================================\n`;
    content += `*💰 Rincian Bayar Per Orang:*\n\n`;
    summary.participants.forEach(p => {
      content += `👤 *${p.name}*\n`;
      content += `  - Subtotal Pesanan: ${formatRupiah(p.subtotal)}\n`;
      content += `  - Bagian PPN (${p.ppnPercentageShare.toFixed(2)}%): +${formatRupiah(p.ppnShare)}\n`;
      if (p.serviceTaxPercentageShare > 0) {
        content += `  - Bagian Service Tax (${p.serviceTaxPercentageShare.toFixed(2)}%): +${formatRupiah(p.serviceTaxShare)}\n`;
      } else if (p.serviceTaxShare > 0) {
        content += `  - Bagian Service Tax: +${formatRupiah(p.serviceTaxShare)}\n`;
      }
      content += `  - Bagian Ongkir: +${formatRupiah(p.deliveryFeeShare)}\n`;
      content += `  - Bagian Diskon: -${formatRupiah(p.discountShare)}\n`;
      content += `  ------------------\n`;
      content += `  *Total Bayar: ${formatRupiah(p.totalToPay)}*\n\n`;
    });
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

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Rincian Patungan', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    autoTable(doc, {
      startY: 40,
      head: [['Deskripsi', 'Jumlah']],
      body: [
        ['Subtotal Pesanan', formatRupiah(summary.totalItemExpenses)],
        ['PPN', formatRupiah(summary.ppnAmount)],
        ['Service Tax', formatRupiah(summary.serviceTaxAmount)],
        ['Ongkir', formatRupiah(summary.deliveryFee)],
        ['Diskon', `-${formatRupiah(summary.discount)}`],
        [{ content: 'Total Tagihan', styles: { fontStyle: 'bold' } }, { content: formatRupiah(summary.totalBill), styles: { fontStyle: 'bold' } }],
      ],
      theme: 'grid',
    });
    const finalPaymentY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Rincian Bayar Per Orang', 14, finalPaymentY);
    autoTable(doc, {
        startY: finalPaymentY + 5,
        head: [['Nama', 'Subtotal', 'PPN', 'Service', 'Ongkir', 'Diskon', 'Total Bayar']],
        body: summary.participants.map(p => [
            p.name, 
            formatRupiah(p.subtotal), 
            `${formatRupiah(p.ppnShare)} (${p.ppnPercentageShare.toFixed(1)}%)`,
            p.serviceTaxPercentageShare > 0 ? `${formatRupiah(p.serviceTaxShare)} (${p.serviceTaxPercentageShare.toFixed(1)}%)` : formatRupiah(p.serviceTaxShare),
            formatRupiah(p.deliveryFeeShare),
            `-${formatRupiah(p.discountShare)}`,
            formatRupiah(p.totalToPay)
        ]),
        theme: 'striped',
        headStyles: {fillColor: [22, 163, 74]},
        columnStyles: { 6: { fontStyle: 'bold' } }
    });
    doc.save('hasil-patungan.pdf');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader><DialogTitle>Simpan Hasil Perhitungan</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="p-4 border rounded-md bg-muted/50 max-h-48 overflow-y-auto">
              <div className="text-xs whitespace-pre-wrap font-sans" dangerouslySetInnerHTML={generateHtmlPreview()} />
          </div>
          <Button onClick={handleCopyToClipboard}>Salin Teks untuk WhatsApp</Button>
          <Button onClick={handleDownloadPdf} variant="secondary">Unduh sebagai PDF</Button>
        </div>
        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Tutup</Button></DialogClose></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}