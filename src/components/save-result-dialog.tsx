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
import type { Summary, Participant } from '@/types';

interface SaveResultDialogProps {
  children: React.ReactNode;
  summary: Summary;
  participants: Participant[];
}

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
};

export function SaveResultDialog({ children, summary, participants }: SaveResultDialogProps) {
  const { toast } = useToast();
  
  // Fungsi ini tetap sama, untuk menghasilkan teks mentah ke clipboard
  const generateTxtContent = () => {
    let content = `🧾 *Rincian Patungan - Kalkulator Receh* 🧾\n\n`;
    content += `====================================\n`;
    content += `*Detail Pesanan per Orang:*\n\n`;
    participants.forEach(p => {
      content += `👤 *${p.name}*\n`;
      if (p.expenses.length > 0) {
        p.expenses.forEach(exp => {
          content += `  - ${exp.description}: ${formatRupiah(exp.amount)}\n`;
        });
      } else {
        content += `  - (Tidak ada pesanan)\n`;
      }
      const summaryParticipant = summary.participants.find(sp => sp.name === p.name);
      if (summaryParticipant) {
        content += `  _Subtotal: ${formatRupiah(summaryParticipant.totalItems)}_\n`;
      }
      content += `\n`;
    });
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
    content += `*💰 Total Bayar Per Orang:*\n\n`;
    summary.participants.forEach(p => {
      content += `*${p.name}* 👉 *${formatRupiah(p.totalToPay)}*\n`;
    });
    content += `\n====================================\n`;
    content += `_Dihitung dengan Kalkulator Receh ✨_`;
    return content;
  };

  // -- BARU: Fungsi untuk mengubah teks mentah menjadi HTML untuk pratinjau --
  const generateHtmlPreview = () => {
    const textContent = generateTxtContent();
    const htmlContent = textContent
      .replace(/\n/g, '<br />') // Ubah baris baru menjadi tag <br>
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>') // Ubah *teks* menjadi <strong>teks</strong> (tebal)
      .replace(/_(.*?)_/g, '<em>$1</em>'); // Ubah _teks_ menjadi <em>teks</em> (miring)
    
    return { __html: htmlContent };
  };

  const handleCopyToClipboard = async () => {
    const content = generateTxtContent();
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: 'Berhasil!',
        description: 'Rincian berhasil disalin ke clipboard.',
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Tidak dapat menyalin ke clipboard.',
      });
    }
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Rincian Patungan', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Dihitung dengan Kalkulator Receh', doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });
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
    doc.text('Total Bayar Per Orang', 14, finalPaymentY);
    autoTable(doc, {
        startY: finalPaymentY + 5,
        head: [['Nama', 'Total Bayar']],
        body: summary.participants.map(p => [p.name, formatRupiah(p.totalToPay)]),
        theme: 'striped',
    });
    const detailedExpensesY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Rincian Pesanan per Orang', 14, detailedExpensesY);
     autoTable(doc, {
        startY: detailedExpensesY + 5,
        head: [['Nama', 'Pesanan', 'Harga']],
        body: participants.flatMap(p => 
            p.expenses.length > 0 
            ? p.expenses.map((exp, index) => [ index === 0 ? p.name : '', exp.description, formatRupiah(exp.amount) ])
            : [[p.name, '(Tidak ada pesanan)', '-']]
        ),
        theme: 'grid',
    });
    doc.save('hasil-patungan.pdf');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Simpan Hasil Perhitungan</DialogTitle>
          <DialogDescription>
            Pilih format untuk menyimpan atau membagikan hasil perhitungan patunganmu.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Penyesuaian: Menggunakan div dengan dangerouslySetInnerHTML untuk pratinjau */}
          <div className="p-4 border rounded-md bg-muted/50 max-h-48 overflow-y-auto">
              <div 
                className="text-xs whitespace-pre-wrap font-sans"
                dangerouslySetInnerHTML={generateHtmlPreview()}
              />
          </div>
          <Button onClick={handleCopyToClipboard}>
            Salin Teks untuk WhatsApp
          </Button>
          <Button onClick={handleDownloadPdf} variant="secondary">
            Unduh sebagai PDF
          </Button>
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">
                    Tutup
                </Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}