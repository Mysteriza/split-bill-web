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
import { useLanguage } from '@/lib/i18n';
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
  const { t } = useLanguage();
  
  const generateTxtContent = () => {
    if (!summary) return '';
    
    let content = `${t('resTitle')}\n\n`;
    content += `====================================\n`;
    content += `${t('resPerPerson')}\n\n`;

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
        content += `${t('resDebtDetails')}\n\n`;
        summary.transactions.forEach(tData => {
            content += `  - *${tData.from}* ${t('mustPay')} *${formatRupiah(tData.amount)}* ${t('to')} *${tData.to}*\n`;
        });
        content += `\n`;
    }

    content += `====================================\n`;
    content += `${t('resSharedCost')}\n\n`;
    content += `${t('resSubtotal')} ${formatRupiah(summary.totalItemExpenses)}\n`;
    content += `${t('resTax')} ${formatRupiah(summary.ppnAmount + summary.serviceTaxAmount)}\n`;
    content += `${t('resDelivery')} ${formatRupiah(summary.deliveryFee)}\n`;
    content += `${t('resDiscount')} -${formatRupiah(summary.totalDiscount)}\n`;
    content += `------------------------------------\n`;
    content += `${t('resTotalBill').replace('{amount}', formatRupiah(summary.grandTotal))}\n`;
    content += `====================================\n\n`;
    content += `${t('resFooter')}`;
    
    return content;
  };
  
  const generateHtmlPreview = () => {
    const textContent = generateTxtContent();
    return { __html: textContent.replace(/\n/g, '<br />').replace(/\*(.*?)\*/g, '<strong>$1</strong>').replace(/_(.*?)_/g, '<em>$1</em>') };
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateTxtContent());
      toast({ title: t('toastSuccessTitle'), description: t('toastCopiedDetail') });
    } catch (err) {
      toast({ variant: 'destructive', title: t('toastFailTitle'), description: t('toastFailCopy') });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[94vw] sm:max-w-[600px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t('saveShareResultDialogTitle')}</DialogTitle>
          <DialogDescription>
            {t('saveShareResultDialogDesc')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="p-4 border rounded-md bg-muted/50 max-h-60 overflow-y-auto">
              <div className="text-xs whitespace-pre-wrap font-sans" dangerouslySetInnerHTML={generateHtmlPreview()} />
          </div>
          <Button onClick={handleCopyToClipboard}>{t('copyTextWA')}</Button>
        </div>
        <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">{t('cancel')}</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}