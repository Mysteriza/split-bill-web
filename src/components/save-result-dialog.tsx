"use client";

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
import type { Summary, BillItem } from '@/types';

interface SaveResultDialogProps {
  children: React.ReactNode;
  summary: Summary;
  items: BillItem[];
}

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(amount));
};

export function SaveResultDialog({ children, summary, items }: SaveResultDialogProps) {
  const { toast } = useToast();
  
  const generateTxtContent = () => {
    if (!summary) return '';
    
    let content = `🧾 *Rincian Patungan - Kalkulator Receh* 🧾\n\n`;
    content += `====================================\n`;
    content += `*👤 Rincian Bayar Per Orang:*\n\n`;

    summary.participants.forEach(p => {
      content += `• *${p.name}* » *${formatRupiah(p.totalToPay)}*\n`;
      const participantItems = items.filter(item => item.sharedBy.includes(p.id));
      if (participantItems.length > 0) {
        participantItems.forEach(item => {
          const effectiveQty = item.quantity / (item.sharedBy.length || 1);
          const displayQty = effectiveQty % 1 === 0 ? effectiveQty : effectiveQty.toFixed(1);
          content += `  - (${displayQty}x) ${item.description} @ ${formatRupiah(item.price)}\n`;
        });
      }
      content += `\n`;
    });

    if (summary.transactions.length > 0) {
        content += `====================================\n`;
        content += `*💳 Rincian Utang (Sudah Disederhanakan):*\n\n`;
        summary.transactions.forEach(t => {
            content += `  - *${t.from}* harus bayar *${formatRupiah(t.amount)}* ke *${t.to}*\n`;
        });
        content += `\n`;
    }

    content += `====================================\n`;
    content += `*Ringkasan Biaya Bersama:*\n\n`;
    content += `Subtotal Pesanan: ${formatRupiah(summary.totalItemExpenses)}\n`;
    content += `PPN & Service Tax: ${formatRupiah(summary.ppnAmount + summary.serviceTaxAmount)}\n`;
    content += `Ongkir: ${formatRupiah(summary.deliveryFee)}\n`;
    content += `Total Diskon: -${formatRupiah(summary.totalDiscount)}\n`;
    content += `------------------------------------\n`;
    content += `*Total Tagihan: ${formatRupiah(summary.grandTotal)}*\n`;
    content += `====================================\n\n`;
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

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bagikan Hasil Perhitungan</DialogTitle>
          <DialogDescription>
            Salin teks di bawah ini untuk dibagikan ke teman-teman Anda melalui WhatsApp atau aplikasi lain.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="p-4 border rounded-md bg-muted/50 max-h-60 overflow-y-auto">
              <div className="text-xs whitespace-pre-wrap font-sans" dangerouslySetInnerHTML={generateHtmlPreview()} />
          </div>
          <Button onClick={handleCopyToClipboard}>Salin Teks untuk WhatsApp</Button>
        </div>
        <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Tutup</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}