"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import {
  UserPlus,
  Trash2,
  PlusCircle,
  X,
  FileText,
  Download,
  Save,
  FolderDown,
  Info,
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
import { useToast } from '@/hooks/use-toast';
import type { Participant, Expense, Summary, TaxDetails } from '@/types';
import { calculateSplit } from '@/lib/calculator';
import { SaveResultDialog } from './save-result-dialog';

export function BillSplitter() {
  const { toast } = useToast();
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
  
  // -- PERBAIKAN: Pindahkan definisi fungsi ke atas --
  const parseFormattedNumber = (value: string): number => {
    return Number(value.replace(/[^0-9]/g, '')) || 0;
  }
  
  const formatRupiah = useCallback((amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  }, []);

  // -- Fitur 3: Simpan & Lanjutkan Sesi (localStorage) --
  const SAVED_PARTICIPANTS_KEY = 'kalkulatorReceh_savedParticipants';

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_PARTICIPANTS_KEY);
      if (saved) {
        const savedParticipants: Pick<Participant, 'id' | 'name'>[] = JSON.parse(saved);
        if (Array.isArray(savedParticipants)) {
          const loadedParticipants = savedParticipants.map(p => ({
            ...p,
            expenses: []
          }));
          setParticipants(loadedParticipants);
        }
      }
    } catch (error) {
      console.error("Failed to load participants from localStorage", error);
    }
  }, []);

  const saveParticipants = () => {
    try {
      const participantsToSave = participants.map(({ id, name }) => ({ id, name }));
      localStorage.setItem(SAVED_PARTICIPANTS_KEY, JSON.stringify(participantsToSave));
      toast({
        title: 'Berhasil!',
        description: `Daftar ${participants.length} peserta telah disimpan.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Tidak dapat menyimpan daftar peserta.',
      });
    }
  };
  
  // -- Fitur 4: Perhitungan Real-time --
  const taxDetails: TaxDetails = useMemo(() => ({
    type: taxType,
    value: taxType === 'percentage' ? parseFloat(taxValueInput) || 0 : parseFormattedNumber(taxValueInput),
  }), [taxType, taxValueInput]);

  const deliveryFeeValue = useMemo(() => parseFormattedNumber(deliveryFee), [deliveryFee]);
  const discountValue = useMemo(() => parseFormattedNumber(discount), [discount]);

  useEffect(() => {
    if (participants.length > 0) {
      const result = calculateSplit(
        participants,
        taxDetails,
        deliveryFeeValue,
        discountValue
      );
      setSummary(result);
    } else {
      setSummary(null);
    }
  }, [participants, taxDetails, deliveryFeeValue, discountValue]);

  const handleNumericInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const numericValue = parseFormattedNumber(e.target.value);
      setter(isNaN(numericValue) ? '' : new Intl.NumberFormat('id-ID').format(numericValue));
  }
  
  const handleExpenseAmountChange = (participantId: string, value: string) => {
    const numericValue = parseFormattedNumber(value);
     const formattedValue = isNaN(numericValue) ? '' : new Intl.NumberFormat('id-ID').format(numericValue);
     setNewExpenses(prev => ({
        ...prev,
        [participantId]: { ...prev[participantId], amount: formattedValue },
      }));
  }

  const addParticipant = () => {
    const sanitizedName = DOMPurify.sanitize(newParticipantName.trim());
    if (sanitizedName !== '') {
      const newParticipant: Participant = {
        id: crypto.randomUUID(),
        name: sanitizedName,
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
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    setNewExpenses((prev) => {
        const newExp = {...prev};
        delete newExp[id];
        return newExp;
    })
  };

  const addExpense = (participantId: string) => {
    const expenseInput = newExpenses[participantId];
    const sanitizedDescription = DOMPurify.sanitize(expenseInput.description.trim());
    const amount = parseFormattedNumber(expenseInput.amount);
    
    if (sanitizedDescription !== '' && amount > 0) {
      const newExpense: Expense = {
        id: crypto.randomUUID(),
        description: sanitizedDescription,
        amount: amount,
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
  };

  const participantTotals = useMemo(() => {
    return participants.reduce((acc, p) => {
      acc[p.id] = p.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      return acc;
    }, {} as { [key: string]: number });
  }, [participants]);

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-6 w-6" /> Peserta & Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="new-participant-input">Tambahkan temanmu satu per satu.</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="new-participant-input"
                  placeholder="Nama Peserta Baru"
                  value={newParticipantName}
                  onChange={(e) => setNewParticipantName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
                />
                <Button onClick={addParticipant} aria-label="Tambah Peserta" className="px-3">
                  <PlusCircle />
                </Button>
              </div>
            </CardContent>
            
            <Accordion type="multiple" className="w-full px-6 pb-2">
              <AnimatePresence>
                {participants.map((p) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                  >
                    <AccordionItem value={p.id} className="my-2 border rounded-md">
                      <AccordionTrigger className="px-4 hover:no-underline">
                         <div className="flex justify-between w-full items-center">
                          <span className="font-bold truncate text-sm" dangerouslySetInnerHTML={{ __html: p.name }}></span>
                          <span className="text-muted-foreground font-medium text-xs whitespace-nowrap">
                            {formatRupiah(participantTotals[p.id] || 0)}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2 px-4">
                        <ul className="space-y-2">
                            <AnimatePresence>
                              {p.expenses.map((exp) => (
                                <motion.li
                                  key={exp.id}
                                  layout
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 10, transition: { duration: 0.2 } }}
                                  className="flex justify-between items-center text-xs bg-background/50 p-2 rounded-md"
                                >
                                  <span className='truncate pr-2' dangerouslySetInnerHTML={{ __html: exp.description }}></span>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className='font-medium'>{formatRupiah(exp.amount)}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeExpense(p.id, exp.id)} aria-label="Hapus item">
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </motion.li>
                              ))}
                            </AnimatePresence>
                          </ul>
                        <div className="flex flex-col sm:flex-row gap-2 items-start">
                           <div className="flex-grow">
                              <Label htmlFor={`desc-${p.id}`} className="sr-only">Deskripsi</Label>
                              <Input id={`desc-${p.id}`} placeholder="Cth: Nasi Goreng" value={newExpenses[p.id]?.description || ''} onChange={(e) => setNewExpenses({ ...newExpenses, [p.id]: { ...newExpenses[p.id], description: e.target.value, }, })} />
                           </div>
                          <div className="flex w-full sm:w-auto gap-2">
                             <div className='flex-grow'>
                               <Label htmlFor={`amount-${p.id}`} className="sr-only">Jumlah</Label>
                              <Input id={`amount-${p.id}`} type="text" inputMode="decimal" className='w-full sm:w-32 flex-shrink-0' placeholder="0" value={newExpenses[p.id]?.amount || ''} onChange={(e) => handleExpenseAmountChange(p.id, e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addExpense(p.id)} />
                             </div>
                              <Button size="icon" onClick={() => addExpense(p.id)} aria-label="Tambah item">
                                <PlusCircle className="h-5 w-5" />
                              </Button>
                          </div>
                        </div>
                        <Button variant="destructive" size="sm" className='w-full text-xs' onClick={() => removeParticipant(p.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Hapus {p.name}
                        </Button>
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </AnimatePresence>
            </Accordion>

            {participants.length > 0 && 
             <CardFooter className="flex justify-end pt-4">
                <Button variant="secondary" onClick={saveParticipants} size="sm" className="text-xs">
                    <Save className="mr-2 h-4 w-4" /> Simpan Daftar Peserta
                </Button>
            </CardFooter>
            }
          </Card>
        </div>

        <div className="space-y-6 sticky top-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-6 w-6"/> Biaya Tambahan & Total
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                       <div className="space-y-2 sm:col-span-2">
                            <Label className="text-xs">Pajak</Label>
                            <div className="flex items-center gap-4">
                                <RadioGroup defaultValue="amount" value={taxType} onValueChange={(value: 'amount' | 'percentage') => setTaxType(value)} className="flex">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="amount" id="tax-amount" /><Label htmlFor="tax-amount" className="text-xs font-normal">Rp</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="percentage" id="tax-percentage" /><Label htmlFor="tax-percentage" className="text-xs font-normal">%</Label></div>
                                </RadioGroup>
                                <Input id="taxValue" type={taxType === 'percentage' ? 'number' : 'text'} inputMode="decimal" placeholder="0" value={taxValueInput} onChange={taxType === 'percentage' ? (e) => setTaxValueInput(e.target.value) : handleNumericInputChange(setTaxValueInput)} />
                            </div>
                        </div>
                        <div className="space-y-2"><Label htmlFor="deliveryFee" className="text-xs">Ongkir (Rp)</Label><Input id="deliveryFee" type="text" inputMode="decimal" placeholder="0" value={deliveryFee} onChange={handleNumericInputChange(setDeliveryFee)} /></div>
                        <div className="space-y-2"><Label htmlFor="discount" className="text-xs">Diskon (Rp)</Label><Input id="discount" type="text" inputMode="decimal" placeholder="0" value={discount} onChange={handleNumericInputChange(setDiscount)} /></div>
                    </div>
                    <Separator />
                    {summary && (
                      <div className='space-y-2 text-sm'>
                           <div className="flex justify-between"><span className="text-muted-foreground">Subtotal Pesanan</span><span>{formatRupiah(summary.totalItemExpenses)}</span></div>
                           <div className="flex justify-between"><span className="text-muted-foreground">Pajak</span><span>{formatRupiah(summary.taxAmount)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Ongkir</span><span>{formatRupiah(summary.deliveryFee)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Diskon</span><span className='text-destructive'>-{formatRupiah(summary.discount)}</span></div>
                          <Separator />
                           <div className="flex justify-between items-center font-bold text-primary">
                              <span className="text-base">Total Tagihan</span>
                              <span className="text-xl">{formatRupiah(summary.totalBill)}</span>
                          </div>
                      </div>
                    )}
                </CardContent>
            </Card>

          {summary ? (
            <Card className="shadow-lg animate-fade-in">
              <CardHeader className="flex flex-row justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5"/> Hasil Patungan
                  </CardTitle>
                </div>
                <SaveResultDialog summary={summary} participants={participants}>
                   <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" /> Simpan
                   </Button>
                </SaveResultDialog>
              </CardHeader>
              <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead className="text-xs">Nama</TableHead><TableHead className="text-right text-xs">Total Bayar</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {summary.participants.map((p) => (
                        <TableRow key={p.name}>
                          <TableCell className="font-medium text-sm" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(p.name) }}></TableCell>
                          <TableCell className="text-right font-bold text-base text-primary">{formatRupiah(p.totalToPay)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              </CardContent>
            </Card>
          ) : (
             <Card className="text-center p-8 border-dashed flex flex-col items-center justify-center">
                <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                <CardContent><p className="text-muted-foreground text-xs">Hasil perhitungan akan muncul di sini.</p></CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}