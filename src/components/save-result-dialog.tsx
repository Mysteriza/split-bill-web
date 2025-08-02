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

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(amount));
};

export function SaveResultDialog({ children, summary, items }: SaveResultDialogProps) {
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
    content += `*💰 Rincian Bayar Per Orang (Super Detail):*\n\n`;
    summary.participants.forEach(p => {
      content += `👤 *${p.name}*\n`;
      
      const participantItems = items.filter(item => item.sharedBy.includes(p.id));
      if (participantItems.length > 0) {
        content += `  *Pesanan:*\n`;
        participantItems.forEach(item => {
          const cost = item.amount / item.sharedBy.length;
          content += `    - ${item.description}: ${formatRupiah(cost)}\n`;
        });
      }
      
      content += `  *Rincian Biaya:*\n`;
      content += `    - Subtotal Pribadi: ${formatRupiah(p.subtotal)}\n`;
      content += `    - Bagian PPN (${p.ppnPercentageShare.toFixed(2)}%): +${formatRupiah(p.ppnShare)}\n`;
      if (p.serviceTaxShare > 0) {
        content += `    - Bagian Service Tax ${p.serviceTaxPercentageShare > 0 ? `(${p.serviceTaxPercentageShare.toFixed(2)}%)` : ''}: +${formatRupiah(p.serviceTaxShare)}\n`;
      }
      content += `    - Bagian Ongkir: +${formatRupiah(p.deliveryFeeShare)}\n`;
      content += `    - Bagian Diskon: -${formatRupiah(p.discountShare)}\n`;
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
      head: [['Ringkasan Biaya Bersama', '']],
      body: [
        ['Subtotal Pesanan', formatRupiah(summary.totalItemExpenses)],
        ['PPN', formatRupiah(summary.ppnAmount)],
        ['Service Tax', formatRupiah(summary.serviceTaxAmount)],
        ['Ongkir', formatRupiah(summary.deliveryFee)],
        ['Diskon', `-${formatRupiah(summary.discount)}`],
        // Perbaikan TypeScript: Menambahkan 'as const'
        [{ content: 'Total Tagihan', styles: { fontStyle: 'bold' as const, fillColor: '#f2f2f2' } }, { content: formatRupiah(summary.totalBill), styles: { fontStyle: 'bold' as const, fillColor: '#f2f2f2' } }],
      ],
      theme: 'grid',
    });
    
    let lastY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFontSize(16);
    doc.text('Rincian Detail per Orang', 14, lastY);
    lastY += 5;

    summary.participants.forEach(p => {
        const participantItems = items.filter(item => item.sharedBy.includes(p.id));
        const bodyData: any[] = []; // Menggunakan 'any[]' untuk fleksibilitas

        if (participantItems.length > 0) {
            // Perbaikan TypeScript: Menambahkan 'as const'
            bodyData.push([{ content: 'Pesanan:', colSpan: 2, styles: { fontStyle: 'bold' as const } }]);
            participantItems.forEach(item => {
                const cost = item.amount / item.sharedBy.length;
                bodyData.push([`  - ${item.description}`, formatRupiah(cost)]);
            });
        }
        
        bodyData.push(
            // Perbaikan TypeScript: Menambahkan 'as const'
            [{ content: 'Rincian Biaya:', colSpan: 2, styles: { fontStyle: 'bold' as const } }],
            ['  - Subtotal Pribadi', formatRupiah(p.subtotal)],
            [`  - Bagian PPN (${p.ppnPercentageShare.toFixed(2)}%)`, `+${formatRupiah(p.ppnShare)}`],
        );
        if (p.serviceTaxShare > 0) {
            const serviceLabel = p.serviceTaxPercentageShare > 0 ? `  - Bagian Service Tax (${p.serviceTaxPercentageShare.toFixed(2)}%)` : '  - Bagian Service Tax';
            bodyData.push([serviceLabel, `+${formatRupiah(p.serviceTaxShare)}`]);
        }
        bodyData.push(
            ['  - Bagian Ongkir', `+${formatRupiah(p.deliveryFeeShare)}`],
            ['  - Bagian Diskon', `-${formatRupiah(p.discountShare)}`],
        );

        autoTable(doc, {
            startY: lastY,
            // Perbaikan TypeScript: Menambahkan 'as const'
            head: [[{ content: p.name, colSpan: 2, styles: { fontStyle: 'bold' as const, fillColor: [22, 163, 74], textColor: [255, 255, 255] } }]],
            body: bodyData,
            // Perbaikan TypeScript: Menambahkan 'as const'
            foot: [[{ content: 'Total Bayar', styles: { fontStyle: 'bold' as const } }, { content: formatRupiah(p.totalToPay), styles: { fontStyle: 'bold' as const } }]],
            theme: 'striped',
            showFoot: 'lastPage',
        });
        lastY = (doc as any).lastAutoTable.finalY + 10;
    });

    doc.save('hasil-patungan-detail.pdf');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
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
          <Button onClick={handleCopyToClipboard}>Salin Teks untuk WhatsApp</Button>
          <Button onClick={handleDownloadPdf} variant="secondary">Unduh sebagai PDF</Button>
        </div>
        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Tutup</Button></DialogClose></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}