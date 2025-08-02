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

export function SaveResultDialog({ children, summary, items, participants }: SaveResultDialogProps) {
  const { toast } = useToast();
  
  const generateTxtContent = () => {
    let content = `🧾 *Rincian Patungan - Kalkulator Receh* 🧾\n\n`;
    content += `====================================\n`;
    content += `*Ringkasan Biaya Bersama:*\n\n`;
    content += `Subtotal Pesanan: ${formatRupiah(summary.totalItemExpenses)}\n`;
    content += `PPN: ${formatRupiah(summary.ppnAmount)}\n`;
    content += `Service Tax: ${formatRupiah(summary.serviceTaxAmount)}\n`;
    content += `Ongkir: ${formatRupiah(summary.deliveryFee)}\n`;
    content += `Total Diskon: -${formatRupiah(summary.totalDiscount)}\n`;
    content += `------------------------------------\n`;
    content += `*Total Tagihan (Sebelum Pembulatan): ${formatRupiah(summary.totalBill)}*\n`;
    if (summary.roundingDifference !== 0) {
      content += `*Total Akhir (Setelah Pembulatan): ${formatRupiah(summary.grandTotal)}*\n`;
    }
    content += `\n`;
    
    content += `====================================\n`;
    content += `*💰 Rincian Bayar Per Orang (Super Detail):*\n\n`;
    summary.participants.forEach(p => {
      // Defensive check to prevent error
      const ppnShare = p.ppnPercentageShare ?? 0;
      const serviceTaxSharePercent = p.serviceTaxPercentageShare ?? 0;

      content += `👤 *${p.name}*\n`;
      
      const participantItems = items.filter(item => item.sharedBy.includes(p.id));
      if (participantItems.length > 0) {
        content += `  *Pesanan:*\n`;
        participantItems.forEach(item => {
          const cost = item.price * item.quantity / item.sharedBy.length;
          const discountPerPerson = (item.discount.type === 'amount' ? item.discount.value / item.sharedBy.length : (item.price * item.quantity * item.discount.value / 100) / item.sharedBy.length);
          content += `    - ${item.description} (x${item.quantity > 1 ? `${item.quantity}, ` : ''}Bagian): ${formatRupiah(cost)}\n`;
          if (discountPerPerson > 0) {
             content += `      (Diskon: -${formatRupiah(discountPerPerson)})\n`;
          }
        });
      }
      
      content += `  *Rincian Biaya:*\n`;
      content += `    - Subtotal Pribadi: ${formatRupiah(p.subtotal)}\n`;
      content += `    - Bagian PPN (${ppnShare.toFixed(2)}%): +${formatRupiah(p.ppnShare)}\n`;
      if (p.serviceTaxShare > 0) {
        content += `    - Bagian Service Tax ${serviceTaxSharePercent > 0 ? `(${serviceTaxSharePercent.toFixed(2)}%)` : ''}: +${formatRupiah(p.serviceTaxShare)}\n`;
      }
      content += `    - Bagian Ongkir: +${formatRupiah(p.deliveryFeeShare)}\n`;
      content += `    - Bagian Diskon Global: -${formatRupiah(p.globalDiscountShare)}\n`;
      content += `  ------------------\n`;
      content += `  *Total Bayar: ${formatRupiah(p.totalToPay)}*\n\n`;
    });

    if (summary.transactions.length > 0) {
        content += `====================================\n`;
        content += `*💳 Rincian Utang:*\n\n`;
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
        ['Total Diskon', `-${formatRupiah(summary.totalDiscount)}`],
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
        const bodyData: any[] = []; 

        if (participantItems.length > 0) {
            bodyData.push([{ content: 'Pesanan:', colSpan: 2, styles: { fontStyle: 'bold' as const } }]);
            participantItems.forEach(item => {
                const cost = (item.price * item.quantity) / item.sharedBy.length;
                bodyData.push([`  - ${item.description}`, formatRupiah(cost)]);
            });
        }
        
        bodyData.push(
            [{ content: 'Rincian Biaya:', colSpan: 2, styles: { fontStyle: 'bold' as const } }],
            ['  - Subtotal Pribadi', formatRupiah(p.subtotal)],
            [`  - Bagian PPN`, `+${formatRupiah(p.ppnShare)}`],
            ['  - Bagian Service Tax', `+${formatRupiah(p.serviceTaxShare)}`],
            ['  - Bagian Ongkir', `+${formatRupiah(p.deliveryFeeShare)}`],
            ['  - Bagian Diskon', `-${formatRupiah(p.globalDiscountShare)}`],
        );

        autoTable(doc, {
            startY: lastY,
            head: [[{ content: p.name, colSpan: 2, styles: { fontStyle: 'bold' as const, fillColor: [22, 163, 74], textColor: [255, 255, 255] } }]],
            body: bodyData,
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