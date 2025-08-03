"use client";

import React, { useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import DOMPurify from 'dompurify';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Summary, BillItem, SessionParticipant } from '@/types';

// Helper to format currency
const formatRupiah = (amount: number) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
}).format(Math.round(amount));

export function SaveResultDialog({
  summary,
  items,
  participants,
  children
}: {
  summary: Summary | null;
  items: BillItem[];
  participants: SessionParticipant[];
  children: React.ReactNode;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    const element = printRef.current;
    if (!element || !summary) return;

    const canvas = await html2canvas(element, { scale: 2 });
    const data = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    const newWidth = pdfWidth - 20; // with margin
    const newHeight = newWidth / ratio;

    let heightLeft = newHeight;
    let position = 10; // top margin

    pdf.addImage(data, 'PNG', 10, position, newWidth, newHeight);
    heightLeft -= (pdfHeight - 20); // minus margin

    while (heightLeft > 0) {
      position = heightLeft - newHeight;
      pdf.addPage();
      pdf.addImage(data, 'PNG', 10, position, newWidth, newHeight);
      heightLeft -= (pdfHeight - 20);
    }
    
    pdf.save(`hasil-patungan-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (!summary) return <>{children}</>;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Simpan Hasil Perhitungan</DialogTitle>
          <DialogDescription>
            Anda dapat menyimpan hasil ini sebagai file PDF. Periksa pratinjau di bawah ini.
          </DialogDescription>
        </DialogHeader>
        
        {/* Printable Area */}
        <div ref={printRef} className="p-6 bg-white text-black max-h-[60vh] overflow-y-auto">
          <header className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-1">Hasil Perhitungan Patungan</h1>
            <p className="text-sm text-gray-500">Dibuat pada: {new Date().toLocaleString('id-ID')}</p>
          </header>

          <main>
            <section className="mb-6">
              <h2 className="text-lg font-semibold border-b pb-2 mb-2">Total Patungan per Orang</h2>
              <table className="w-full text-sm">
                <tbody>
                  {summary.participants.map(p => (
                    <tr key={p.id} className="border-b">
                      <td className="py-2" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(p.name) }}></td>
                      <td className="py-2 text-right font-bold">{formatRupiah(p.totalToPay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            
            {summary.transactions.length > 0 && (
              <section className="mb-6">
                <h2 className="text-lg font-semibold border-b pb-2 mb-2">Rincian Pembayaran</h2>
                <div className="space-y-1 text-sm">
                  {summary.transactions.map((t, index) => (
                    <p key={index}>
                      <span className="font-semibold" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t.from) }}></span>
                      {' harus bayar '}
                      <span className="font-semibold">{formatRupiah(t.amount)}</span>
                      {' ke '}
                      <span className="font-semibold" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t.to) }}></span>.
                    </p>
                  ))}
                </div>
              </section>
            )}

            <section className="mb-6">
              <h2 className="text-lg font-semibold border-b pb-2 mb-2">Ringkasan Tagihan</h2>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Subtotal Item</span><span>{formatRupiah(summary.totalItemExpenses)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Pajak & Service</span><span>{formatRupiah(summary.ppnAmount + summary.serviceTaxAmount)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Ongkos Kirim</span><span>{formatRupiah(summary.deliveryFee)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Diskon Global</span><span className="text-red-600">-{formatRupiah(summary.totalDiscount)}</span></div>
                <hr className="my-2"/>
                <div className="flex justify-between font-bold text-base"><span >Total Tagihan Asli</span><span>{formatRupiah(summary.totalBill)}</span></div>
                {summary.roundingDifference !== 0 && (
                   <div className="flex justify-between font-bold text-base"><span >Grand Total (Dibulatkan)</span><span>{formatRupiah(summary.grandTotal)}</span></div>
                )}
              </div>
            </section>
          </main>
        </div>
        
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="secondary">Tutup</Button></DialogClose>
          <Button onClick={handleDownload}>Unduh PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}