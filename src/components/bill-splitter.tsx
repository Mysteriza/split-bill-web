"use client";

import { useState, useMemo } from 'react';
import {
  UserPlus,
  Trash2,
  PlusCircle,
  Calculator,
  ArrowRight,
  X,
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
  const [tax, setTax] = useState('11');
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [summary, setSummary] = useState<Summary | null>(null);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  };

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
    }
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id));
    setSummary(null);
  };

  const addExpense = (participantId: string) => {
    const expenseInput = newExpenses[participantId];
    if (
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
          Bagi tagihan dengan mudah, cepat, dan bergaya retro.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>1. Konfigurasi Bersama</CardTitle>
              <CardDescription>
                Masukkan biaya atau potongan yang berlaku untuk semua.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax">Pajak (%)</Label>
                <Input
                  id="tax"
                  type="number"
                  placeholder="Contoh: 11"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryFee">Ongkos Kirim (Rp)</Label>
                <Input
                  id="deliveryFee"
                  type="number"
                  placeholder="Contoh: 20000"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Diskon (Rp)</Label>
                <Input
                  id="discount"
                  type="number"
                  placeholder="Contoh: 10000"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>2. Tambah Peserta & Pengeluaran</CardTitle>
              <CardDescription>
                Masukkan nama teman-temanmu dan apa saja yang mereka bayar.
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
                <Button onClick={addParticipant} aria-label="Tambah Peserta">
                  <UserPlus />
                </Button>
              </div>
            </CardContent>

            {participants.length > 0 && (
              <Accordion type="multiple" className="w-full px-6 pb-6">
                {participants.map((p) => (
                  <AccordionItem value={p.id} key={p.id}>
                    <AccordionTrigger className="font-bold">
                      <div className="flex justify-between w-full items-center pr-4">
                        <span>{p.name}</span>
                        <span className="text-muted-foreground font-medium">
                          {formatRupiah(participantTotals[p.id] || 0)}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      {p.expenses.length > 0 ? (
                        <ul className="space-y-2">
                          {p.expenses.map((exp) => (
                            <li
                              key={exp.id}
                              className="flex justify-between items-center text-sm bg-background/50 p-2 rounded-md"
                            >
                              <span>{exp.description}</span>
                              <div className="flex items-center gap-2">
                                <span>{formatRupiah(exp.amount)}</span>
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
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          Belum ada pengeluaran.
                        </p>
                      )}
                      <div className="flex gap-2 items-end">
                        <div className="flex-grow space-y-1">
                          <Label
                            htmlFor={`desc-${p.id}`}
                            className="text-xs"
                          >
                            Deskripsi Item
                          </Label>
                          <Input
                            id={`desc-${p.id}`}
                            placeholder="Cth: Nasi Goreng"
                            value={newExpenses[p.id]?.description || ''}
                            onChange={(e) =>
                              setNewExpenses({
                                ...newExpenses,
                                [p.id]: {
                                  ...newExpenses[p.id],
                                  description: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="w-32 space-y-1">
                          <Label
                            htmlFor={`amount-${p.id}`}
                            className="text-xs"
                          >
                            Jumlah (Rp)
                          </Label>
                          <Input
                            id={`amount-${p.id}`}
                            type="number"
                            placeholder="25000"
                            value={newExpenses[p.id]?.amount || ''}
                            onChange={(e) =>
                              setNewExpenses({
                                ...newExpenses,
                                [p.id]: {
                                  ...newExpenses[p.id],
                                  amount: e.target.value,
                                },
                              })
                            }
                            onKeyDown={(e) =>
                              e.key === 'Enter' && addExpense(p.id)
                            }
                          />
                        </div>
                        <Button
                          size="icon"
                          onClick={() => addExpense(p.id)}
                          aria-label="Tambah Pengeluaran"
                        >
                          <PlusCircle className="h-5 w-5" />
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
             <CardFooter className="flex justify-end">
                <Button variant="destructive" onClick={() => setParticipants([])} disabled={participants.length === 0}>
                    <Trash2 className="mr-2 h-4 w-4" /> Reset Semua Peserta
                </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6 sticky top-8">
          <Button
            onClick={handleCalculate}
            className="w-full text-lg py-6"
            disabled={participants.length === 0}
          >
            <Calculator className="mr-2 h-5 w-5" /> Hitung Pembagian
          </Button>

          {summary ? (
            <Card className="shadow-lg animate-fade-in">
              <CardHeader>
                <CardTitle>3. Hasil Patungan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-background/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Total Tagihan
                    </p>
                    <p className="text-xl font-bold text-primary">
                      {formatRupiah(summary.totalBill)}
                    </p>
                  </div>
                  <div className="bg-background/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Bagian Per Orang
                    </p>
                    <p className="text-xl font-bold">
                      {formatRupiah(summary.sharePerPerson)}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Rincian Peserta</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead className="text-right">
                          Pengeluaran
                        </TableHead>
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
                    <h4 className="font-semibold mb-2">
                      Transaksi Penyelesaian
                    </h4>
                    <ul className="space-y-2">
                      {summary.transactions.map((t, i) => (
                        <li
                          key={i}
                          className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-background/50 p-3 rounded-lg"
                        >
                          <div className='flex items-center text-sm sm:text-base'>
                            <span className="font-bold text-primary">{t.from}</span>
                            <span className='mx-2 text-muted-foreground'>harus bayar ke</span>
                            <span className="font-bold text-green-600">{t.to}</span>
                            <ArrowRight className='mx-2 h-4 w-4 text-muted-foreground' />
                            <span className='font-semibold'>{formatRupiah(t.amount)}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="text-center p-8 border-dashed">
              <CardContent>
                <p className="text-muted-foreground">
                  Hasil perhitungan akan muncul di sini.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
