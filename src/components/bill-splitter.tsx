
"use client";

import { useState, useMemo, useCallback } from 'react';
import {
  UserPlus,
  Trash2,
  PlusCircle,
  Calculator,
  ArrowRight,
  X,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Participant, Expense, Summary } from '@/types';
import { calculateSplit } from '@/lib/calculator';

export default function BillSplitter() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newExpenses, setNewExpenses] = useState<{
    [key: string]: { description: string; amount: string };
  }>({});
  const [tax, setTax] = useState('0');
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [summary, setSummary] = useState<Summary | null>(null);

  const formatRupiah = useCallback((amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  }, []);

  const totalItemExpenses = useMemo(() => {
    return participants.reduce(
      (total, p) => total + p.expenses.reduce((sum, exp) => sum + exp.amount, 0),
      0
    );
  }, [participants]);

  const totalBill = useMemo(() => {
    const taxValue = parseFloat(tax) || 0;
    const deliveryFeeValue = parseFloat(deliveryFee) || 0;
    const discountValue = parseFloat(discount) || 0;
    return totalItemExpenses + taxValue + deliveryFeeValue - discountValue;
  }, [totalItemExpenses, tax, deliveryFee, discount]);


  const addParticipant = () => {
    if (newParticipantName.trim() !== '') {
      const newParticipant: Participant = {
        id: crypto.randomUUID(),
        name: newParticipantName.trim(),
        expenses: [],
      };
      setParticipants([...participants, newParticipant]);
      setNewParticipantName('');
      setNewExpenses((prev) => ({
        ...prev,
        [newParticipant.id]: { description: '', amount: '' },
      }));
       setSummary(null);
    }
  };

  const removeParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    setNewExpenses((prev) => {
        const newExp = {...prev};
        delete newExp[id];
        return newExp;
    })
    setSummary(null);
  };
  
  const resetParticipants = () => {
    setParticipants([]);
    setNewExpenses({});
    setSummary(null);
  }

  const addExpense = (participantId: string) => {
    const expenseInput = newExpenses[participantId];
    if (
      expenseInput &&
      expenseInput.description.trim() !== '' &&
      parseFloat(expenseInput.amount) > 0
    ) {
      const newExpense: Expense = {
        id: crypto.randomUUID(),
        description: expenseInput.description.trim(),
        amount: parseFloat(expenseInput.amount),
      };
      setParticipants(
        participants.map((p) =>
          p.id === participantId
            ? { ...p, expenses: [...p.expenses, newExpense] }
            : p
        )
      );
      setNewExpenses((prev) => ({
        ...prev,
        [participantId]: { description: '', amount: '' },
      }));
      setSummary(null);
    }
  };

  const removeExpense = (participantId: string, expenseId: string) => {
    setParticipants(
      participants.map((p) =>
        p.id === participantId
          ? { ...p, expenses: p.expenses.filter((e) => e.id !== expenseId) }
          : p
      )
    );
    setSummary(null);
  };

  const handleCalculate = () => {
    const taxValue = parseFloat(tax) || 0;
    const deliveryFeeValue = parseFloat(deliveryFee) || 0;
    const discountValue = parseFloat(discount) || 0;
    const result = calculateSplit(
      participants,
      taxValue,
      deliveryFeeValue,
      discountValue
    );
    setSummary(result);
  };

  const participantTotals = useMemo(() => {
    return participants.reduce((acc, p) => {
      acc[p.id] = p.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      return acc;
    }, {} as { [key: string]: number });
  }, [participants]);

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
          Kalkulator Gotong Royong
        </h1>
        <p className="text-muted-foreground mt-2">
          Bagi tagihan dengan mudah, cepat, dan rapi.
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>1. Masukkan Peserta & Pesanan</CardTitle>
               <CardDescription>
                Tambahkan temanmu dan apa saja yang mereka pesan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Nama Peserta Baru"
                  value={newParticipantName}
                  onChange={(e) => setNewParticipantName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
                />
                <Button onClick={addParticipant} aria-label="Tambah Peserta" className="px-3">
                  <UserPlus />
                </Button>
              </div>
            </CardContent>

            {participants.length > 0 && (
              <Accordion type="multiple" className="w-full px-6 pb-2">
                {participants.map((p) => (
                  <AccordionItem value={p.id} key={p.id}>
                    <AccordionTrigger>
                       <div className="flex justify-between w-full items-center pr-4">
                        <span className="font-bold truncate">{p.name}</span>
                        <span className="text-muted-foreground font-medium text-sm whitespace-nowrap">
                          {formatRupiah(participantTotals[p.id] || 0)}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      <ul className="space-y-2">
                          {p.expenses.map((exp) => (
                            <li
                              key={exp.id}
                              className="flex justify-between items-center text-sm bg-background/50 p-2 rounded-md"
                            >
                              <span className='truncate pr-2'>{exp.description}</span>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className='font-medium'>{formatRupiah(exp.amount)}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => removeExpense(p.id, exp.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      <div className="flex gap-2 items-end">
                        <Input
                            placeholder="Cth: Nasi Goreng"
                            value={newExpenses[p.id]?.description || ''}
                            onChange={(e) =>
                              setNewExpenses({
                                ...newExpenses,
                                [p.id]: { ...newExpenses[p.id], description: e.target.value, },
                              })
                            }
                          />
                        <Input
                            type="number"
                            className='w-32 flex-shrink-0'
                            placeholder="25000"
                            value={newExpenses[p.id]?.amount || ''}
                            onChange={(e) =>
                              setNewExpenses({
                                ...newExpenses,
                                [p.id]: { ...newExpenses[p.id], amount: e.target.value,},
                              })
                            }
                            onKeyDown={(e) => e.key === 'Enter' && addExpense(p.id)}
                          />
                        <Button
                          size="icon"
                          onClick={() => addExpense(p.id)}
                          aria-label="Tambah Pengeluaran"
                        >
                          <PlusCircle className="h-5 w-5" />
                        </Button>
                      </div>
                      <Button variant="destructive" size="sm" className='w-full' onClick={() => removeParticipant(p.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Hapus {p.name}
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
            {participants.length > 0 && 
             <CardFooter className="flex justify-end pt-4">
                <Button variant="destructive" onClick={resetParticipants}>
                    <Trash2 className="mr-2 h-4 w-4" /> Reset Semua
                </Button>
            </CardFooter>
            }
          </Card>
        </div>

        <div className="space-y-6 sticky top-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>2. Biaya Tambahan & Total</CardTitle>
                    <CardDescription>
                        Biaya atau potongan yang berlaku untuk semua.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="tax">Pajak (Rp)</Label>
                            <Input id="tax" type="number" placeholder="Contoh: 15000" value={tax} onChange={(e) => setTax(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="deliveryFee">Ongkos Kirim (Rp)</Label>
                            <Input id="deliveryFee" type="number" placeholder="Contoh: 20000" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="discount">Diskon (Rp)</Label>
                            <Input id="discount" type="number" placeholder="Contoh: 10000" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                        </div>
                    </div>
                     <div className="bg-primary/10 p-4 rounded-lg flex justify-between items-center">
                        <span className="font-semibold text-primary">Total Tagihan</span>
                        <span className="text-2xl font-bold text-primary">{formatRupiah(totalBill)}</span>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleCalculate} className="w-full text-lg py-6" disabled={participants.length < 2}>
                        <Calculator className="mr-2 h-5 w-5" /> Hitung Pembagian
                    </Button>
                </CardFooter>
            </Card>

          {summary ? (
            <Card className="shadow-lg animate-fade-in">
              <CardHeader>
                <CardTitle>3. Hasil Patungan</CardTitle>
                 <CardDescription>
                    Berikut adalah rincian pembagian dan transaksi yang diperlukan.
                 </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="bg-background/50 p-3 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">
                      Bagian Per Orang
                    </p>
                    <p className="text-2xl font-bold">
                      {formatRupiah(summary.sharePerPerson)}
                    </p>
                  </div>

                <div>
                  <h4 className="font-semibold mb-2 text-center">Rincian Saldo Peserta</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead className="text-right">Total Bayar</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.participants.map((p) => (
                        <TableRow key={p.name}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-right">
                            {formatRupiah(p.totalSpent)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-semibold ${
                              p.balance < 0
                                ? 'text-destructive'
                                : 'text-green-600'
                            }`}
                          >
                            {formatRupiah(p.balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {summary.transactions.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-center">
                      Transaksi Penyelesaian
                    </h4>
                    <ul className="space-y-2">
                      {summary.transactions.map((t, i) => (
                        <li key={i} className="flex items-center justify-center bg-background/50 p-3 rounded-lg text-sm sm:text-base">
                            <span className="font-bold text-destructive">{t.from}</span>
                            <ArrowRight className='mx-2 h-4 w-4 text-muted-foreground flex-shrink-0' />
                            <span className="font-bold text-green-600">{t.to}</span>
                            <span className='mx-2 text-muted-foreground'>sebesar</span>
                            <span className='font-semibold'>{formatRupiah(t.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
             <Card className="text-center p-8 border-dashed flex flex-col items-center justify-center">
                <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                <CardContent>
                    <p className="text-muted-foreground">
                    Hasil perhitungan akan muncul di sini setelah kamu menekan tombol "Hitung Pembagian".
                    </p>
                </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
