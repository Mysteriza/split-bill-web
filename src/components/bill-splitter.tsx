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
  Info,
  BookUser,
  Pencil,
  HelpCircle,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Separator } from "@/components/ui/separator";
import { useToast } from '@/hooks/use-toast';
import type { Participant, Expense, Summary } from '@/types';
import { calculateSplit } from '@/lib/calculator';
import { SaveResultDialog } from './save-result-dialog';

// -- Komponen Dialog Bantuan/Tutorial --
function TutorialDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {/* Penyesuaian: Menggunakan 'gap-1' untuk jarak yang pas */}
        <Button variant="link" className="p-0 h-auto text-muted-foreground gap-1">
          <HelpCircle className="h-4 w-4" /> Tutorial
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><HelpCircle/> Cara Menggunakan Kalkulator Receh</DialogTitle>
        </DialogHeader>
        <div className="text-sm space-y-4 max-h-[70vh] overflow-y-auto pr-4">
            <p>Selamat datang! Berikut panduan singkat untuk menggunakan aplikasi ini:</p>
            <div>
                <h4 className="font-semibold mb-1">1. Tambah Peserta</h4>
                <p className="text-muted-foreground">Ketik nama teman di kolom <span className="font-semibold text-primary">"Nama Peserta Baru"</span> lalu tekan Enter atau tombol `+`. Anda juga bisa menambahkan dari daftar kontak yang tersimpan melalui tombol <span className="font-semibold text-primary">"Kelola Kontak"</span>.</p>
            </div>
             <div>
                <h4 className="font-semibold mb-1">2. Masukkan Pesanan</h4>
                <p className="text-muted-foreground">Di dalam kartu setiap peserta, masukkan <span className="font-semibold text-primary">nama item</span> dan <span className="font-semibold text-primary">harganya</span>, lalu tekan `+`. Anda bisa mengedit atau menghapus item yang sudah ada.</p>
            </div>
             <div>
                <h4 className="font-semibold mb-1">3. Atur Biaya Tambahan</h4>
                <p className="text-muted-foreground">Di bagian kanan, masukkan biaya seperti <span className="font-semibold text-primary">PPN (%)</span>, <span className="font-semibold text-primary">Service Tax (%)</span>, Ongkir, dan Diskon jika ada.</p>
            </div>
             <div>
                <h4 className="font-semibold mb-1">4. Lihat Hasilnya</h4>
                <p className="text-muted-foreground">Semua perhitungan terjadi secara <span className="font-semibold text-primary">real-time</span>. Anda bisa langsung melihat total tagihan dan berapa yang harus dibayar setiap orang di kartu "Hasil Patungan".</p>
            </div>
             <div>
                <h4 className="font-semibold mb-1">5. Simpan & Bagikan</h4>
                <p className="text-muted-foreground">Gunakan tombol <span className="font-semibold text-primary">"Simpan"</span> untuk mengunduh PDF atau menyalin ringkasan teks yang rapi untuk dibagikan ke teman-teman Anda.</p>
            </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button>Mengerti!</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ContactsDialog({ onSelect, contacts, setContacts }: {
  onSelect: (contact: Pick<Participant, 'id' | 'name'>) => void;
  contacts: Pick<Participant, 'id' | 'name'>[];
  setContacts: React.Dispatch<React.SetStateAction<Pick<Participant, 'id' | 'name'>[]>>;
}) {
  const [newContactName, setNewContactName] = useState('');
  const { toast } = useToast();
  const CONTACTS_KEY = 'kalkulatorReceh_contacts';

  const addContact = () => {
    const sanitizedName = DOMPurify.sanitize(newContactName.trim());
    if (sanitizedName && !contacts.some(c => c.name === sanitizedName)) {
      const newContact = { id: crypto.randomUUID(), name: sanitizedName };
      const updatedContacts = [...contacts, newContact];
      setContacts(updatedContacts);
      localStorage.setItem(CONTACTS_KEY, JSON.stringify(updatedContacts));
      setNewContactName('');
    }
  };

  const removeContact = (id: string) => {
    const updatedContacts = contacts.filter(c => c.id !== id);
    setContacts(updatedContacts);
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(updatedContacts));
    toast({ description: "Kontak telah dihapus." });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><BookUser className="mr-2 h-4 w-4" /> Kelola Kontak</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buku Kontak</DialogTitle>
          <DialogDescription>
            Pilih kontak untuk ditambahkan ke sesi ini, atau kelola daftar kontak permanen Anda.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 my-4">
          <Input placeholder="Nama Kontak Baru" value={newContactName} onChange={e => setNewContactName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addContact()} />
          <Button onClick={addContact}><PlusCircle className="h-4 w-4" /></Button>
        </div>
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {contacts.length > 0 ? contacts.map(contact => (
            <div key={contact.id} className="flex items-center justify-between rounded-md border p-2">
              <span className="font-medium text-sm" dangerouslySetInnerHTML={{ __html: contact.name }}></span>
              <div className="flex gap-1">
                <Button size="sm" variant="secondary" onClick={() => onSelect(contact)}>Tambah</Button>
                <Button size="icon" variant="ghost" onClick={() => removeContact(contact.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          )) : <p className="text-sm text-center text-muted-foreground">Belum ada kontak tersimpan.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditExpenseDialog({ expense, onSave, children }: { expense: Expense, onSave: (updatedExpense: Expense) => void, children: React.ReactNode }) {
    const [description, setDescription] = useState(expense.description);
    const [amount, setAmount] = useState(new Intl.NumberFormat('id-ID').format(expense.amount));

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const numericValue = parseInt(rawValue.replace(/[^0-9]/g, ''), 10);
        if (isNaN(numericValue)) {
            setAmount('');
        } else {
            setAmount(new Intl.NumberFormat('id-ID').format(numericValue));
        }
    };

    const handleSave = () => {
        const sanitizedDescription = DOMPurify.sanitize(description.trim());
        const numericAmount = Number(amount.replace(/[^0-9]/g, '')) || 0;
        if (sanitizedDescription && numericAmount > 0) {
            onSave({ ...expense, description: sanitizedDescription, amount: numericAmount });
        }
    };
    
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Edit Item</DialogTitle></DialogHeader>
                <div className="space-y-4">
                    <Input placeholder="Nama Item" value={description} onChange={(e) => setDescription(e.target.value)} />
                    <Input placeholder="Harga" value={amount} onChange={handleAmountChange} />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Batal</Button></DialogClose>
                    <DialogClose asChild><Button onClick={handleSave}>Simpan Perubahan</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function BillSplitter() {
  const { toast } = useToast();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipantName, setNewParticipantName] = useState('');
  
  const [ppn, setPpn] = useState('');
  const [serviceTax, setServiceTax] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [discount, setDiscount] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);

  const [contacts, setContacts] = useState<Pick<Participant, 'id' | 'name'>[]>([]);
  const CONTACTS_KEY = 'kalkulatorReceh_contacts';
  
  useEffect(() => {
    try {
      const savedContacts = localStorage.getItem(CONTACTS_KEY);
      if (savedContacts) {
        setContacts(JSON.parse(savedContacts));
      }
    } catch (error) {
      console.error("Failed to load contacts", error);
    }
  }, []);

  const addParticipantFromContact = (contact: Pick<Participant, 'id' | 'name'>) => {
    if (!participants.some(p => p.name === contact.name)) {
        const newParticipant: Participant = { ...contact, expenses: [] };
        setParticipants(prev => [...prev, newParticipant]);
        toast({ description: `${contact.name} ditambahkan ke sesi.` });
    } else {
        toast({ variant: "destructive", description: `${contact.name} sudah ada di sesi.` });
    }
  };

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

  const ppnValue = useMemo(() => parseFloat(ppn) || 0, [ppn]);
  const serviceTaxValue = useMemo(() => parseFloat(serviceTax) || 0, [serviceTax]);
  const deliveryFeeValue = useMemo(() => parseFormattedNumber(deliveryFee), [deliveryFee]);
  const discountValue = useMemo(() => parseFormattedNumber(discount), [discount]);

  useEffect(() => {
    const result = calculateSplit(participants, ppnValue, serviceTaxValue, deliveryFeeValue, discountValue);
    setSummary(result);
  }, [participants, ppnValue, serviceTaxValue, deliveryFeeValue, discountValue]);

  const addParticipant = () => {
    const sanitizedName = DOMPurify.sanitize(newParticipantName.trim());
    if (sanitizedName && !participants.some(p => p.name === sanitizedName)) {
      const newParticipant: Participant = { id: crypto.randomUUID(), name: sanitizedName, expenses: [] };
      setParticipants([...participants, newParticipant]);
      
      if (!contacts.some(c => c.name === sanitizedName)) {
          const updatedContacts = [...contacts, { id: newParticipant.id, name: newParticipant.name }];
          setContacts(updatedContacts);
          localStorage.setItem(CONTACTS_KEY, JSON.stringify(updatedContacts));
      }

      setNewParticipantName('');
    }
  };

  const removeParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  const addExpense = (participantId: string, description: string, amount: number) => {
    const sanitizedDescription = DOMPurify.sanitize(description.trim());
    if (sanitizedDescription && amount > 0) {
      const newExpense: Expense = { id: crypto.randomUUID(), description: sanitizedDescription, amount };
      setParticipants(
        participants.map((p) =>
          p.id === participantId
            ? { ...p, expenses: [...p.expenses, newExpense] }
            : p
        )
      );
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
  
  const editExpense = (participantId: string, updatedExpense: Expense) => {
    setParticipants(participants.map(p => 
        p.id === participantId 
        ? { ...p, expenses: p.expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e) }
        : p
    ));
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <UserPlus className="h-6 w-6" /> Peserta & Pesanan
              </CardTitle>
              <TutorialDialog />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row-reverse gap-2">
                <div className="flex-grow flex gap-2">
                   <Input id="new-participant-input" placeholder="Nama Peserta Baru..." value={newParticipantName} onChange={(e) => setNewParticipantName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addParticipant()} />
                   <Button onClick={addParticipant} aria-label="Tambah Peserta"><PlusCircle className="h-4 w-4" /></Button>
                </div>
                <div className="sm:mb-0 mb-2">
                    <ContactsDialog onSelect={addParticipantFromContact} contacts={contacts} setContacts={setContacts}/>
                </div>
              </div>
            </CardContent>
          </Card>
          <AnimatePresence>
            {participants.map((p) => (
              <motion.div key={p.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                <ParticipantCard 
                    participant={p} 
                    onRemoveParticipant={removeParticipant}
                    onAddExpense={addExpense}
                    onRemoveExpense={removeExpense}
                    onEditExpense={editExpense}
                    formatRupiah={formatRupiah}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="space-y-4 sticky top-6">
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-3"><Info className="h-6 w-6"/> Biaya Tambahan & Total</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="ppn" className="text-xs">PPN (%)</Label>
                            <Input id="ppn" type="number" placeholder="11" value={ppn} onChange={e => setPpn(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="serviceTax" className="text-xs">Service Tax (%)</Label>
                            <Input id="serviceTax" type="number" placeholder="5" value={serviceTax} onChange={e => setServiceTax(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="deliveryFee" className="text-xs">Ongkir (Rp)</Label>
                            <Input id="deliveryFee" type="text" inputMode="decimal" placeholder="0" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="discount" className="text-xs">Diskon (Rp)</Label>
                            <Input id="discount" type="text" inputMode="decimal" placeholder="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                        </div>
                    </div>
                    {summary && <Separator />}
                    {summary && (
                      <div className='space-y-2 text-sm'>
                           <div className="flex justify-between"><span className="text-muted-foreground">Subtotal Pesanan</span><span>{formatRupiah(summary.totalItemExpenses)}</span></div>
                           <div className="flex justify-between"><span className="text-muted-foreground">PPN ({ppnValue}%)</span><span>{formatRupiah(summary.ppnAmount)}</span></div>
                           <div className="flex justify-between"><span className="text-muted-foreground">Service Tax ({serviceTaxValue}%)</span><span>{formatRupiah(summary.serviceTaxAmount)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Ongkir</span><span>{formatRupiah(summary.deliveryFee)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Diskon</span><span className='text-destructive'>-{formatRupiah(summary.discount)}</span></div>
                          <Separator />
                           <div className="flex justify-between items-center font-bold text-primary"><span className="text-base">Total Tagihan</span><span className="text-xl">{formatRupiah(summary.totalBill)}</span></div>
                      </div>
                    )}
                </CardContent>
            </Card>

          {summary && participants.length > 0 ? (
            <motion.div>
                <Card className="shadow-lg">
                  <CardHeader className="flex flex-row justify-between items-center">
                    <div><CardTitle className="flex items-center gap-3 text-lg"><FileText className="h-5 w-5"/> Hasil Patungan</CardTitle></div>
                    <SaveResultDialog summary={summary} participants={participants}>
                       <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Simpan</Button>
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
            </motion.div>
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

function ParticipantCard({ participant, onRemoveParticipant, onAddExpense, onRemoveExpense, onEditExpense, formatRupiah }: {
    participant: Participant,
    onRemoveParticipant: (id: string) => void,
    onAddExpense: (participantId: string, description: string, amount: number) => void,
    onRemoveExpense: (participantId: string, expenseId: string) => void,
    onEditExpense: (participantId: string, updatedExpense: Expense) => void,
    formatRupiah: (amount: number) => string,
}) {
    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const numericValue = parseInt(rawValue.replace(/[^0-9]/g, ''), 10);
        if (isNaN(numericValue)) {
            setAmount('');
        } else {
            setAmount(new Intl.NumberFormat('id-ID').format(numericValue));
        }
    };

    const handleAddExpense = () => {
        const numericAmount = Number(amount.replace(/[^0-9]/g, '')) || 0;
        onAddExpense(participant.id, desc, numericAmount);
        setDesc('');
        setAmount('');
    };

    const total = participant.expenses.reduce((sum, exp) => sum + exp.amount, 0);

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between p-4">
                <CardTitle className="text-lg" dangerouslySetInnerHTML={{ __html: participant.name }}></CardTitle>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-primary">{formatRupiah(total)}</span>
                    <Button size="icon" variant="ghost" onClick={() => onRemoveParticipant(participant.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
                <AnimatePresence>
                  {participant.expenses.map(exp => (
                    <motion.div key={exp.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}>
                        <div className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted/50">
                            <span dangerouslySetInnerHTML={{ __html: exp.description }}></span>
                            <div className="flex items-center gap-1">
                                <span className="font-mono">{formatRupiah(exp.amount)}</span>
                                <EditExpenseDialog expense={exp} onSave={(updated) => onEditExpense(participant.id, updated)}>
                                    <Button size="icon" variant="ghost"><Pencil className="h-3 w-3"/></Button>
                                </EditExpenseDialog>
                                <Button size="icon" variant="ghost" onClick={() => onRemoveExpense(participant.id, exp.id)}><X className="h-4 w-4"/></Button>
                            </div>
                        </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
            </CardContent>
            <CardFooter className="bg-muted/30 p-3">
                 <div className="flex w-full gap-2">
                    <Input placeholder="Nama item..." value={desc} onChange={(e) => setDesc(e.target.value)}/>
                    <Input placeholder="Harga..." value={amount} onChange={handleAmountChange} onKeyDown={e => e.key === 'Enter' && handleAddExpense()}/>
                    <Button className="px-4" onClick={handleAddExpense} aria-label="Tambah Item"><PlusCircle className="h-5 w-5"/></Button>
                 </div>
            </CardFooter>
        </Card>
    );
}