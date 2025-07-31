
"use client";

import { useState, useMemo, useCallback } from 'react';
import {
  UserPlus,
  Trash2,
  PlusCircle,
  Calculator,
  X,
  FileText,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { Separator } from "@/components/ui/separator";
import type { Participant, Expense, Summary, TaxDetails } from '@/types';
import { calculateSplit } from '@/lib/calculator';
import { SaveResultDialog } from './save-result-dialog';

export default function BillSplitter() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newExpenses, setNewExpenses] = useState<{
    [key: string]: { description: string; amount: string };
  }>({});
  
  const [taxType, setTaxType] = useState<'amount' | 'percentage'>('amount');
  const [taxValueInput, setTaxValueInput] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [discount, setDiscount] = useState('');
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

  const taxDetails: TaxDetails = useMemo(() => ({
    type: taxType,
    value: parseFloat(taxValueInput) || 0,
  }), [taxType, taxValueInput]);

  const deliveryFeeValue = useMemo(() => parseFloat(deliveryFee) || 0, [deliveryFee]);
  const discountValue = useMemo(() => parseFloat(discount) || 0, [discount]);

  const calculatedTaxAmount = useMemo(() => {
     if (taxDetails.type === 'percentage') {
        return (totalItemExpenses * taxDetails.value) / 100;
     }
     return taxDetails.value;
  }, [taxDetails, totalItemExpenses]);

  const totalBill = useMemo(() => {
    return totalItemExpenses + calculatedTaxAmount + deliveryFeeValue - discountValue;
  }, [totalItemExpenses, calculatedTaxAmount, deliveryFeeValue, discountValue]);


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
  
  const resetState = () => {
    setParticipants([]);
    setNewExpenses({});
    setTaxType('amount');
    setTaxValueInput('');
    setDeliveryFee('');
    setDiscount('');
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
    const result = calculateSplit(
      participants,
      taxDetails,
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
        <h1 className="text-2xl md:text-4xl font-bold font-headline text-primary animate-fade-in">
          Kalkulator Receh
        </h1>
        <p className="text-muted-foreground mt-2 text-xs md:text-sm animate-fade-in animation-delay-200">
          Bagi tagihan dengan mudah, cepat, dan rapi.
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <Card className="shadow-lg transform hover:scale-[1.01] transition-transform duration-300">
            <CardHeader>
              <CardTitle className="text-lg">1. Peserta & Pesanan</CardTitle>
               <CardDescription className="text-xs">
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
                        <span className="font-bold truncate text-sm">{p.name}</span>
                        <span className="text-muted-foreground font-medium text-xs whitespace-nowrap">
                          {formatRupiah(participantTotals[p.id] || 0)}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      <ul className="space-y-2">
                          {p.expenses.map((exp) => (
                            <li
                              key={exp.id}
                              className="flex justify-between items-center text-xs bg-background/50 p-2 rounded-md"
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
                      <div className="flex flex-col sm:flex-row gap-2 items-start">
                         <div className="flex-grow">
                            <Label htmlFor={`desc-${p.id}`} className="sr-only">Deskripsi</Label>
                            <Input
                                id={`desc-${p.id}`}
                                placeholder="Cth: Nasi Goreng"
                                value={newExpenses[p.id]?.description || ''}
                                onChange={(e) =>
                                  setNewExpenses({
                                    ...newExpenses,
                                    [p.id]: { ...newExpenses[p.id], description: e.target.value, },
                                  })
                                }
                              />
                         </div>
                        <div className="flex w-full sm:w-auto gap-2">
                           <div className='flex-grow'>
                             <Label htmlFor={`amount-${p.id}`} className="sr-only">Jumlah</Label>
                            <Input
                                id={`amount-${p.id}`}
                                type="number"
                                className='w-full sm:w-32 flex-shrink-0'
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
                           </div>
                            <Button
                              size="icon"
                              onClick={() => addExpense(p.id)}
                              aria-label="Tambah Pengeluaran"
                            >
                              <PlusCircle className="h-5 w-5" />
                            </Button>
                        </div>
                      </div>
                      <Button variant="destructive" size="sm" className='w-full text-xs' onClick={() => removeParticipant(p.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Hapus {p.name}
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
            {participants.length > 0 && 
             <CardFooter className="flex justify-end pt-4">
                <Button variant="destructive" onClick={resetState} size="sm" className="text-xs">
                    <Trash2 className="mr-2 h-4 w-4" /> Reset Semua
                </Button>
            </CardFooter>
            }
          </Card>
        </div>

        <div className="space-y-6 sticky top-8">
            <Card className="shadow-lg transform hover:scale-[1.01] transition-transform duration-300">
                <CardHeader>
                    <CardTitle className="text-lg">2. Biaya Tambahan</CardTitle>
                    <CardDescription className="text-xs">
                        Biaya atau potongan yang berlaku untuk semua.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                       <div className="space-y-2 sm:col-span-2">
                            <Label className="text-xs">Pajak</Label>
                            <div className="flex items-center gap-4">
                                <RadioGroup defaultValue="amount" value={taxType} onValueChange={(value: 'amount' | 'percentage') => setTaxType(value)} className="flex">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="amount" id="tax-amount" />
                                        <Label htmlFor="tax-amount" className="text-xs font-normal">Rp</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="percentage" id="tax-percentage" />
                                        <Label htmlFor="tax-percentage" className="text-xs font-normal">%</Label>
                                    </div>
                                </RadioGroup>
                                <Input id="taxValue" type="number" placeholder={taxType === 'amount' ? '15000' : '10'} value={taxValueInput} onChange={(e) => setTaxValueInput(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="deliveryFee" className="text-xs">Ongkir (Rp)</Label>
                            <Input id="deliveryFee" type="number" placeholder="20000" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="discount" className="text-xs">Diskon (Rp)</Label>
                            <Input id="discount" type="number" placeholder="10000" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                        </div>
                    </div>
                    <Separator />
                    <div className='space-y-2 text-sm'>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal Pesanan</span>
                            <span>{formatRupiah(totalItemExpenses)}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Pajak ({taxDetails.type === 'percentage' ? `${taxDetails.value}%` : 'Rp'})</span>
                            <span>{formatRupiah(calculatedTaxAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Ongkir</span>
                            <span>{formatRupiah(deliveryFeeValue)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Diskon</span>
                            <span className='text-destructive'>-{formatRupiah(discountValue)}</span>
                        </div>
                        <Separator />
                         <div className="flex justify-between items-center font-bold text-primary">
                            <span className="text-base">Total Tagihan</span>
                            <span className="text-xl">{formatRupiah(totalBill)}</span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleCalculate} className="w-full text-base py-6" disabled={participants.length < 1}>
                        <Calculator className="mr-2 h-5 w-5" /> Hitung Patungan
                    </Button>
                </CardFooter>
            </Card>

          {summary ? (
            <Card className="shadow-lg animate-fade-in">
              <CardHeader className="flex flex-row justify-between items-center">
                <div>
                  <CardTitle className="text-lg">3. Hasil Patungan</CardTitle>
                   <CardDescription className="text-xs">
                      Berikut adalah rincian total bayar per orang.
                   </CardDescription>
                </div>
                <SaveResultDialog summary={summary} participants={participants}>
                   <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" /> Simpan
                   </Button>
                </SaveResultDialog>
              </CardHeader>
              <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Nama</TableHead>
                        <TableHead className="text-right text-xs">Total Bayar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.participants.map((p) => (
                        <TableRow key={p.name}>
                          <TableCell className="font-medium text-sm">{p.name}</TableCell>
                          <TableCell className="text-right font-bold text-base text-primary">
                            {formatRupiah(p.totalToPay)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              </CardContent>
            </Card>
          ) : (
             <Card className="text-center p-8 border-dashed flex flex-col items-center justify-center animate-pulse">
                <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                <CardContent>
                    <p className="text-muted-foreground text-xs">
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
