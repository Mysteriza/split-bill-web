
"use client";

import { useState } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
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
  
  const generateTxtContent = () => {
    let content = `*Rincian Patungan - Kalkulator Gotong Royong*\n\n`;
    content += `====================================\n\n`;
    
    participants.forEach(p => {
      content += `*${p.name}*\n`;
      if (p.expenses.length > 0) {
        p.expenses.forEach(exp => {
          content += `- ${exp.description}: ${formatRupiah(exp.amount)}\n`;
        });
      } else {
        content += `- (Tidak ada pesanan)\n`
      }
      const summaryParticipant = summary.participants.find(sp => sp.name === p.name);
      if (summaryParticipant) {
        content += `_Subtotal: ${formatRupiah(summaryParticipant.totalItems)}_\n`;
      }
      content += `\n`;
    });

    content += `====================================\n`;
    content += `*Ringkasan Biaya Bersama*\n\n`;
    content += `Subtotal Pesanan: ${formatRupiah(summary.totalItemExpenses)}\n`;
    content += `Pajak: ${formatRupiah(summary.taxAmount)}\n`;
    content += `Ongkir: ${formatRupiah(summary.deliveryFee)}\n`;
    content += `Diskon: -${formatRupiah(summary.discount)}\n`;
    content += `*Total Tagihan: ${formatRupiah(summary.totalBill)}*\n\n`;
    
    content += `====================================\n`;
    content += `*Total Bayar Per Orang*\n\n`;
    summary.participants.forEach(p => {
      content += `*${p.name}*: *${formatRupiah(p.totalToPay)}*\n`;
    });
    content += `\n====================================\n`;
    content += `_Dihitung dengan Kalkulator Gotong Royong_`;

    return content;
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
    const tableStartY = 70;

    // Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Rincian Patungan', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Dihitung dengan Kalkulator Gotong Royong', doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });


    // Summary Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Ringkasan Biaya', 14, 40);
    (doc as any).autoTable({
      startY: 45,
      head: [['Deskripsi', 'Jumlah']],
      body: [
        ['Subtotal Pesanan', formatRupiah(summary.totalItemExpenses)],
        ['Pajak', formatRupiah(summary.taxAmount)],
        ['Ongkir', formatRupiah(summary.deliveryFee)],
        ['Diskon', `-${formatRupiah(summary.discount)}`],
        [{ content: 'Total Tagihan', styles: { fontStyle: 'bold' } }, { content: formatRupiah(summary.totalBill), styles: { fontStyle: 'bold' } }],
      ],
      theme: 'grid',
      headStyles: { fillColor: [229, 149, 84] },
    });


    // Final Payment Table
    const finalPaymentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Bayar Per Orang', 14, finalPaymentY);
    (doc as any).autoTable({
        startY: finalPaymentY + 5,
        head: [['Nama', 'Total Bayar']],
        body: summary.participants.map(p => [p.name, formatRupiah(p.totalToPay)]),
        theme: 'striped',
        headStyles: { fillColor: [229, 149, 84] },
    });


    // Detailed Expenses
    const detailedExpensesY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Rincian Pesanan per Orang', 14, detailedExpensesY);
     (doc as any).autoTable({
        startY: detailedExpensesY + 5,
        head: [['Nama', 'Pesanan', 'Harga']],
        body: participants.flatMap(p => 
            p.expenses.length > 0 
            ? p.expenses.map((exp, index) => [
                index === 0 ? p.name : '', 
                exp.description, 
                formatRupiah(exp.amount)
            ])
            : [[p.name, '(Tidak ada pesanan)', '-']]
        ),
        theme: 'grid',
        headStyles: { fillColor: [229, 149, 84] },
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
          <div className="p-4 border rounded-md bg-muted/50 max-h-48 overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap font-sans">
                  {generateTxtContent()}
              </pre>
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
