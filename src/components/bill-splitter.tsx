"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import {
  UserPlus,
  Trash2,
  PlusCircle,
  X,
  FileText,
  Download,
  Info,
  BookUser,
  HelpCircle,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
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
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator";
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SessionParticipant, BillItem, Summary, ServiceTaxDetails } from '@/types';
import { calculateSplit } from '@/lib/calculator';
import { SaveResultDialog } from './save-result-dialog';

function TutorialDialog() {
    return (
    <Dialog>
      <DialogTrigger asChild><Button variant="link" className="p-0 h-auto text-muted-foreground gap-1"><HelpCircle className="h-4 w-4" /> Tutorial</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="flex items-center gap-2"><HelpCircle/> Cara Menggunakan Kalkulator Receh</DialogTitle></DialogHeader>
        <div className="text-sm space-y-4 max-h-[70vh] overflow-y-auto pr-4">
            <p>Selamat datang! Berikut alur kerja baru yang lebih cepat:</p>
            <div>
                <h4 className="font-semibold mb-1">1. Tambahkan Semua Peserta</h4>
                <p className="text-muted-foreground">Masukkan semua nama teman yang ikut patungan di bagian atas. Anda juga bisa menambahkan dari "Buku Kontak".</p>
            </div>
             <div>
                <h4 className="font-semibold mb-1">2. Catat Semua Item dari Struk</h4>
                <p className="text-muted-foreground">Di bagian "Daftar Pesanan", masukkan semua item dan harganya satu per satu. Tekan `Enter` setelah mengisi harga untuk pindah ke baris item baru secara otomatis.</p>
            </div>
            <div>
                <h4 className="font-semibold mb-1">3. Tandai Pemilik Item</h4>
                <p className="text-muted-foreground">Di samping setiap item, klik tombol <span className="font-semibold text-primary">"Tandai"</span>. Centang nama teman yang memesan item tersebut. Jika di-sharing, centang semua nama yang ikut patungan.</p>
            </div>
             <div>
                <h4 className="font-semibold mb-1">4. Atur Biaya Tambahan</h4>
                <p className="text-muted-foreground">Isi PPN, Service Tax, Ongkir, dan Diskon di kolom sebelah kanan.</p>
            </div>
             <div>
                <h4 className="font-semibold mb-1">5. Selesai!</h4>
                <p className="text-muted-foreground">Semua perhitungan terjadi secara real-time. Anda bisa langsung melihat hasilnya dan menyimpannya.</p>
            </div>
        </div>
        <DialogFooter><DialogClose asChild><Button>Mengerti!</Button></DialogClose></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContactsDialog({ onSelect, contacts, setContacts }: {
  onSelect: (contact: Pick<SessionParticipant, 'id' | 'name'>) => void;
  contacts: Pick<SessionParticipant, 'id' | 'name'>[];
  setContacts: React.Dispatch<React.SetStateAction<Pick<SessionParticipant, 'id' | 'name'>[]>>;
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
      <DialogTrigger asChild><Button variant="outline" size="sm"><BookUser className="mr-2 h-4 w-4" /> Kontak</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buku Kontak</DialogTitle>
          <DialogDescription>Pilih kontak untuk ditambahkan ke sesi ini.</DialogDescription>
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

function TagParticipantDialog({ item, sessionParticipants, onTag, children }: { item: BillItem, sessionParticipants: SessionParticipant[], onTag: (itemId: string, participantIds: string[]) => void, children: React.ReactNode }) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(item.sharedBy));
    const handleCheckChange = (participantId: string, checked: boolean) => {
        const newIds = new Set(selectedIds);
        if (checked) newIds.add(participantId);
        else newIds.delete(participantId);
        setSelectedIds(newIds);
    };
    const handleSave = () => onTag(item.id, Array.from(selectedIds));
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Tandai Peserta untuk Item:</DialogTitle>
                    <DialogDescription dangerouslySetInnerHTML={{ __html: item.description }}/>
                </DialogHeader>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                    {sessionParticipants.map(p => (
                        <div key={p.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer" onClick={() => handleCheckChange(p.id, !selectedIds.has(p.id))}>
                            <Checkbox id={`p-${p.id}`} checked={selectedIds.has(p.id)} />
                            <Label htmlFor={`p-${p.id}`} className="flex-1 font-normal text-sm cursor-pointer" dangerouslySetInnerHTML={{ __html: p.name }}></Label>
                        </div>
                    ))}
                </div>
                <DialogFooter><DialogClose asChild><Button onClick={handleSave}>Simpan Tanda</Button></DialogClose></DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ParticipantTagList({ item, sessionParticipants }: { item: BillItem; sessionParticipants: SessionParticipant[] }) {
    if (item.sharedBy.length === 0) {
        return (
            <TooltipProvider delayDuration={100}>
                <Tooltip>
                    <TooltipTrigger><AlertTriangle className="h-4 w-4 text-amber-500" /></TooltipTrigger>
                    <TooltipContent><p>Item ini belum ditandai oleh siapa pun.</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }
    const taggedParticipants = sessionParticipants.filter(p => item.sharedBy.includes(p.id));
    return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {taggedParticipants.slice(0, 3).map(p => (
                <span key={p.id} className="bg-muted px-2 py-0.5 rounded-full" dangerouslySetInnerHTML={{ __html: p.name.substring(0, 3) }}></span>
            ))}
            {taggedParticipants.length > 3 && ( <span className="font-bold">+{taggedParticipants.length - 3}</span> )}
        </div>
    );
}

export function BillSplitter() {
  const { toast } = useToast();
  const [sessionParticipants, setSessionParticipants] = useState<SessionParticipant[]>([]);
  const [items, setItems] = useState<BillItem[]>([]);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [ppn, setPpn] = useState('');
  const [serviceTaxType, setServiceTaxType] = useState<'amount' | 'percentage'>('percentage');
  const [serviceTaxValue, setServiceTaxValue] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [discount, setDiscount] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [contacts, setContacts] = useState<Pick<SessionParticipant, 'id' | 'name'>[]>([]);
  const CONTACTS_KEY = 'kalkulatorReceh_contacts';
  const newItemDescRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const savedContacts = localStorage.getItem(CONTACTS_KEY);
      if (savedContacts) setContacts(JSON.parse(savedContacts));
    } catch (error) { console.error("Failed to load contacts", error); }
  }, []);
  
  const parseFormattedNumber = (value: string): number => Number(value.replace(/[^0-9]/g, '')) || 0;
  
  const formatRupiah = useCallback((amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(amount));
  }, []);

  const ppnValue = useMemo(() => parseFloat(ppn) || 0, [ppn]);
  const deliveryFeeValue = useMemo(() => parseFormattedNumber(deliveryFee), [deliveryFee]);
  const discountValue = useMemo(() => parseFormattedNumber(discount), [discount]);
  const serviceTaxDetails: ServiceTaxDetails = useMemo(() => ({
    type: serviceTaxType,
    value: serviceTaxType === 'percentage' ? parseFloat(serviceTaxValue) || 0 : parseFormattedNumber(serviceTaxValue),
  }), [serviceTaxType, serviceTaxValue]);

  useEffect(() => {
    const result = calculateSplit(sessionParticipants, items, ppnValue, serviceTaxDetails, deliveryFeeValue, discountValue);
    setSummary(result);
  }, [sessionParticipants, items, ppnValue, serviceTaxDetails, deliveryFeeValue, discountValue]);

  const addParticipant = (name: string, id: string = crypto.randomUUID()) => {
    const sanitizedName = DOMPurify.sanitize(name.trim());
    if (sanitizedName && !sessionParticipants.some(p => p.name === sanitizedName)) {
      setSessionParticipants(prev => [...prev, { id, name: sanitizedName }]);
      if (!contacts.some(c => c.name === sanitizedName)) {
          const updatedContacts = [...contacts, { id, name: sanitizedName }];
          setContacts(updatedContacts);
          localStorage.setItem(CONTACTS_KEY, JSON.stringify(updatedContacts));
      }
    }
  };
  
  const handleAddParticipant = () => { addParticipant(newParticipantName); setNewParticipantName(''); };
  const removeParticipant = (id: string) => {
    setSessionParticipants(prev => prev.filter(p => p.id !== id));
    setItems(prev => prev.map(item => ({ ...item, sharedBy: item.sharedBy.filter(pId => pId !== id) })));
  };
  
  const handleAddItem = () => {
    const sanitizedDesc = DOMPurify.sanitize(newItemDesc.trim());
    const numericAmount = parseFormattedNumber(newItemAmount);
    if (sanitizedDesc && numericAmount > 0) {
      setItems(prev => [...prev, {id: crypto.randomUUID(), description: sanitizedDesc, amount: numericAmount, sharedBy: []}]);
      setNewItemDesc('');
      setNewItemAmount('');
      newItemDescRef.current?.focus();
    }
  };
  
  const removeItem = (id: string) => setItems(prev => prev.filter(item => item.id !== id));
  const handleTagParticipant = (itemId: string, participantIds: string[]) => setItems(prev => prev.map(item => item.id === itemId ? {...item, sharedBy: participantIds} : item));

  const handleAmountChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
    setter(isNaN(numericValue) ? '' : new Intl.NumberFormat('id-ID').format(numericValue));
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center"><CardTitle className="flex items-center gap-3"><Users className="h-6 w-6" /> Peserta Sesi Ini</CardTitle><TutorialDialog /></div>
              <div className="flex flex-col sm:flex-row-reverse gap-2 pt-2">
                <div className="flex-grow flex gap-2"><Input placeholder="Nama Peserta Baru..." value={newParticipantName} onChange={(e) => setNewParticipantName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddParticipant()} /><Button onClick={handleAddParticipant}><PlusCircle className="h-4 w-4" /></Button></div>
                <div className="sm:mb-0 mb-2"><ContactsDialog onSelect={(c) => addParticipant(c.name, c.id)} contacts={contacts} setContacts={setContacts}/></div>
              </div>
            </CardHeader>
            {sessionParticipants.length > 0 && (
              <CardContent className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {sessionParticipants.map(p => (
                    <motion.div key={p.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                       <div className="flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full bg-muted text-sm font-medium">
                          <span dangerouslySetInnerHTML={{ __html: p.name }} /><Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => removeParticipant(p.id)}><X className="h-4 w-4" /></Button>
                       </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </CardContent>
            )}
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-3"><FileText className="h-6 w-6" /> Daftar Pesanan</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                <AnimatePresence>
                  {items.map(item => (
                    <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20, transition: {duration: 0.2} }}>
                        <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                            <div>
                                <p className="font-medium text-sm" dangerouslySetInnerHTML={{__html: item.description}}></p>
                                <p className="text-sm font-mono text-muted-foreground">{formatRupiah(item.amount)}</p>
                            </div>
                            <div className="flex items-center gap-1">
                               <ParticipantTagList item={item} sessionParticipants={sessionParticipants} />
                               <TagParticipantDialog item={item} sessionParticipants={sessionParticipants} onTag={handleTagParticipant}><Button variant="outline" size="sm"><UserPlus className="h-4 w-4" /></Button></TagParticipantDialog>
                               <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                        </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
            </CardContent>
            <CardFooter className="bg-muted/30 p-3">
                 <div className="flex w-full gap-2 items-center">
                    <Input ref={newItemDescRef} placeholder="Nama item..." value={newItemDesc} onChange={(e) => setNewItemDesc(e.target.value)} />
                    <Input placeholder="Harga..." value={newItemAmount} onChange={handleAmountChange(setNewItemAmount)} onKeyDown={(e) => {if (e.key === 'Enter') handleAddItem();}} />
                    <Button className="px-4" onClick={handleAddItem}><PlusCircle className="h-5 w-5" /></Button>
                 </div>
            </CardFooter>
          </Card>
        </div>
        <div className="space-y-4 sticky top-6">
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-3"><Info className="h-6 w-6"/> Biaya Tambahan & Total</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="ppn" className="text-xs">PPN (%)</Label><Input id="ppn" type="number" placeholder="0" value={ppn} onChange={e => setPpn(e.target.value)} /></div>
                        <div className="space-y-2">
                            <Label className="text-xs">Service Tax</Label>
                            <div className="flex items-center gap-2">
                                <RadioGroup value={serviceTaxType} onValueChange={(v: 'amount' | 'percentage') => setServiceTaxType(v)} className="flex">
                                    <div className="flex items-center space-x-1.5"><RadioGroupItem value="percentage" id="st-percentage" /><Label htmlFor="st-percentage" className="text-xs font-normal">%</Label></div>
                                    <div className="flex items-center space-x-1.5"><RadioGroupItem value="amount" id="st-amount" /><Label htmlFor="st-amount" className="text-xs font-normal">Rp</Label></div>
                                </RadioGroup>
                                <Input type={serviceTaxType === 'percentage' ? 'number' : 'text'} inputMode="decimal" placeholder="0" value={serviceTaxValue} onChange={serviceTaxType === 'percentage' ? e => setServiceTaxValue(e.target.value) : handleAmountChange(setServiceTaxValue)} />
                            </div>
                        </div>
                        <div className="space-y-2"><Label htmlFor="deliveryFee" className="text-xs">Ongkir (Rp)</Label><Input id="deliveryFee" type="text" inputMode="decimal" placeholder="0" value={deliveryFee} onChange={handleAmountChange(setDeliveryFee)} /></div>
                         <div className="space-y-2"><Label htmlFor="discount" className="text-xs">Diskon (Rp)</Label><Input id="discount" type="text" inputMode="decimal" placeholder="0" value={discount} onChange={handleAmountChange(setDiscount)} /></div>
                    </div>
                    {summary && <Separator />}
                    {summary && (
                      <div className='space-y-2 text-sm'>
                           <div className="flex justify-between"><span className="text-muted-foreground">Subtotal Pesanan</span><span>{formatRupiah(summary.totalItemExpenses)}</span></div>
                           <div className="flex justify-between"><span className="text-muted-foreground">PPN ({ppnValue}%)</span><span>{formatRupiah(summary.ppnAmount)}</span></div>
                           <div className="flex justify-between"><span className="text-muted-foreground">Service Tax</span><span>{formatRupiah(summary.serviceTaxAmount)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Ongkir</span><span>{formatRupiah(summary.deliveryFee)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Diskon</span><span className='text-destructive'>-{formatRupiah(summary.discount)}</span></div>
                          <Separator />
                           <div className="flex justify-between items-center font-bold text-primary"><span className="text-base">Total Tagihan</span><span className="text-xl">{formatRupiah(summary.totalBill)}</span></div>
                      </div>
                    )}
                </CardContent>
            </Card>
          {summary && sessionParticipants.length > 0 ? (
            <motion.div><Card className="shadow-lg">
                  <CardHeader className="flex flex-row justify-between items-center">
                    <div><CardTitle className="flex items-center gap-3 text-lg"><FileText className="h-5 w-5"/> Hasil Patungan</CardTitle></div>
                    {/* Perbaikan: Tambahkan prop 'items' yang hilang */}
                    <SaveResultDialog summary={summary} items={items} participants={sessionParticipants}>
                        <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Simpan</Button>
                    </SaveResultDialog>
                  </CardHeader>
                  <CardContent>
                      <Accordion type="multiple" className="w-full">
                        {summary.participants.map(p => (
                          <AccordionItem value={p.id} key={p.id}>
                            <AccordionTrigger>
                               <div className="flex w-full justify-between items-center pr-4">
                                <span className="font-medium text-sm" dangerouslySetInnerHTML={{ __html: p.name }}></span>
                                <span className="font-bold text-base text-primary">{formatRupiah(p.totalToPay)}</span>
                               </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-xs space-y-1 pr-4">
                               <div className="flex justify-between">
                                 <span className="text-muted-foreground">Subtotal Pesanan</span>
                                 <span>{formatRupiah(p.subtotal)}</span>
                               </div>
                               <Separator className="my-1" />
                               <div className="flex justify-between">
                                 <span className="text-muted-foreground">Bagian PPN ({p.ppnPercentageShare.toFixed(2)}%)</span>
                                 <span className="text-green-600">+{formatRupiah(p.ppnShare)}</span>
                               </div>
                               {p.serviceTaxShare > 0 &&
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Bagian Service Tax {p.serviceTaxPercentageShare > 0 && `(${p.serviceTaxPercentageShare.toFixed(2)}%)`}
                                  </span>
                                  <span className="text-green-600">+{formatRupiah(p.serviceTaxShare)}</span>
                                </div>
                               }
                               <div className="flex justify-between">
                                 <span className="text-muted-foreground">Bagian Ongkir</span>
                                 <span className="text-green-600">+{formatRupiah(p.deliveryFeeShare)}</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-muted-foreground">Bagian Diskon</span>
                                 <span className="text-destructive">-{formatRupiah(p.discountShare)}</span>
                               </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                  </CardContent>
                </Card></motion.div>
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