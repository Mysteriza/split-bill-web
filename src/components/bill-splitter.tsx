"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
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
  Receipt,
  Sparkles,
  Wallet,
  Percent,
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
  CardFooter,
  CardDescription
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator";
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SessionParticipant, BillItem, Summary, ServiceTaxDetails, DiscountDetails } from '@/types';
import { calculateSplit } from '@/lib/calculator';
import { SaveResultDialog } from './save-result-dialog'; 

// Helper Components
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
                <p className="text-muted-foreground">Di bagian "Daftar Pesanan", masukkan semua item, kuantitas, dan harganya, lalu tekan `+`.</p>
            </div>
            <div>
                <h4 className="font-semibold mb-1">3. Tandai Pemilik & Diskon Item</h4>
                <p className="text-muted-foreground">Di samping setiap item, klik tombol <span className="font-semibold text-primary inline-flex items-center"><UserPlus className="h-4 w-4" /></span> untuk menandai siapa saja yang memesan. Klik tombol <span className="font-semibold text-primary inline-flex items-center"><Percent className="h-4 w-4" /></span> jika ada diskon khusus untuk item tersebut.</p>
            </div>
             <div>
                <h4 className="font-semibold mb-1">4. Atur Biaya & Opsi Tambahan</h4>
                <p className="text-muted-foreground">Isi PPN, Service Tax, Ongkir, dan Diskon umum. Anda juga bisa mengatur pembulatan dan memilih siapa yang membayar tagihan.</p>
            </div>
             <div>
                <h4 className="font-semibold mb-1">5. Selesai!</h4>
                <p className="text-muted-foreground">Semua perhitungan terjadi secara real-time. Anda bisa langsung melihat rincian utang, visualisasi, dan hasil akhirnya untuk disimpan.</p>
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

function ItemDiscountDialog({ item, onSave, children }: { item: BillItem; onSave: (itemId: string, discount: DiscountDetails) => void; children: React.ReactNode }) {
    const [type, setType] = useState<DiscountDetails['type']>(item.discount.type);
    const [value, setValue] = useState(item.discount.value.toString());
    const handleSave = () => onSave(item.id, { type, value: parseFloat(value) || 0 });
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Diskon untuk Item:</DialogTitle>
                    <DialogDescription dangerouslySetInnerHTML={{ __html: item.description }}/>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <RadioGroup value={type} onValueChange={(v: DiscountDetails['type']) => setType(v)} className="flex">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="percentage" id="d-percentage" /><Label htmlFor="d-percentage">Persen (%)</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="amount" id="d-amount" /><Label htmlFor="d-amount">Jumlah (Rp)</Label></div>
                    </RadioGroup>
                    <Input placeholder="Nilai Diskon" type="number" value={value} onChange={e => setValue(e.target.value)} />
                </div>
                <DialogFooter><DialogClose asChild><Button onClick={handleSave}>Simpan Diskon</Button></DialogClose></DialogFooter>
            </DialogContent>
        </Dialog>
    );
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

// Main Component
export function BillSplitter() {
  const { toast } = useToast();
  const [sessionParticipants, setSessionParticipants] = useState<SessionParticipant[]>([]);
  const [items, setItems] = useState<BillItem[]>([]);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [ppn, setPpn] = useState('');
  const [serviceTaxType, setServiceTaxType] = useState<'amount' | 'percentage'>('percentage');
  const [serviceTaxValue, setServiceTaxValue] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [globalDiscountType, setGlobalDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [globalDiscountValue, setGlobalDiscountValue] = useState('');
  const [rounding, setRounding] = useState(0);
  const [payerId, setPayerId] = useState<string | undefined>(undefined);
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
  const serviceTaxDetails: ServiceTaxDetails = useMemo(() => ({ type: serviceTaxType, value: serviceTaxType === 'percentage' ? parseFloat(serviceTaxValue) || 0 : parseFormattedNumber(serviceTaxValue) }), [serviceTaxType, serviceTaxValue]);
  const globalDiscountDetails: DiscountDetails = useMemo(() => ({ type: globalDiscountType, value: globalDiscountType === 'percentage' ? parseFloat(globalDiscountValue) || 0 : parseFormattedNumber(globalDiscountValue) }), [globalDiscountType, globalDiscountValue]);

  useEffect(() => {
    const result = calculateSplit(sessionParticipants, items, ppnValue, serviceTaxDetails, deliveryFeeValue, globalDiscountDetails, rounding, payerId);
    setSummary(result);
  }, [sessionParticipants, items, ppnValue, serviceTaxDetails, deliveryFeeValue, globalDiscountDetails, rounding, payerId]);

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
    const numericPrice = parseFormattedNumber(newItemPrice);
    const quantity = parseInt(newItemQty) || 1;
    if (sanitizedDesc && numericPrice > 0) {
      setItems(prev => [...prev, {id: crypto.randomUUID(), description: sanitizedDesc, price: numericPrice, quantity, discount: { type: 'amount', value: 0 }, sharedBy: []}]);
      setNewItemDesc('');
      setNewItemPrice('');
      setNewItemQty('1');
      newItemDescRef.current?.focus();
    }
  };
  
  const removeItem = (id: string) => setItems(prev => prev.filter(item => item.id !== id));
  const handleTagParticipant = (itemId: string, participantIds: string[]) => setItems(prev => prev.map(item => item.id === itemId ? {...item, sharedBy: participantIds} : item));
  const handleItemDiscount = (itemId: string, discount: DiscountDetails) => setItems(prev => prev.map(item => item.id === itemId ? {...item, discount} : item));
  const handleAmountChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
    setter(isNaN(numericValue) ? '' : new Intl.NumberFormat('id-ID').format(numericValue));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1975'];

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-3"><Users className="h-6 w-6" /> Peserta Sesi Ini</CardTitle>
            <TutorialDialog />
          </div>
          <div className="flex flex-col sm:flex-row-reverse gap-2 pt-2">
            <div className="flex-grow flex gap-2">
              <Input placeholder="Nama Peserta Baru..." value={newParticipantName} onChange={(e) => setNewParticipantName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddParticipant()} />
              <Button onClick={handleAddParticipant}><PlusCircle className="h-4 w-4" /></Button>
            </div>
            <div className="sm:mb-0 mb-2">
              <ContactsDialog onSelect={(c) => addParticipant(c.name, c.id)} contacts={contacts} setContacts={setContacts}/>
            </div>
          </div>
        </CardHeader>
        {sessionParticipants.length > 0 && (
          <CardContent className="flex flex-wrap gap-2">
            <AnimatePresence>
              {sessionParticipants.map(p => (
                <motion.div key={p.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                   <div className="flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full bg-muted text-sm font-medium">
                      <span dangerouslySetInnerHTML={{ __html: p.name }} />
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => removeParticipant(p.id)}><X className="h-4 w-4" /></Button>
                   </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        )}
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-3"><Receipt className="h-6 w-6" /> Daftar Pesanan</CardTitle></CardHeader>
        <CardContent className="space-y-2">
            <AnimatePresence>
              {items.map(item => (
                <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20, transition: {duration: 0.2} }}>
                    <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                        <div>
                            <p className="font-medium text-sm" dangerouslySetInnerHTML={{__html: `${item.description} (x${item.quantity})`}}></p>
                            <p className="text-sm font-mono text-muted-foreground">{formatRupiah(item.price * item.quantity)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                           <ParticipantTagList item={item} sessionParticipants={sessionParticipants} />
                           <ItemDiscountDialog item={item} onSave={handleItemDiscount}>
                               <Button variant={item.discount.value > 0 ? "secondary" : "ghost"} size="icon" className="h-8 w-8"><Percent className="h-4 w-4" /></Button>
                           </ItemDiscountDialog>
                           <TagParticipantDialog item={item} sessionParticipants={sessionParticipants} onTag={handleTagParticipant}><Button variant="outline" size="sm" className="h-8"><UserPlus className="h-4 w-4" /></Button></TagParticipantDialog>
                           <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-8 w-8"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                    </div>
                </motion.div>
              ))}
            </AnimatePresence>
        </CardContent>
        <CardFooter className="bg-muted/30 p-3">
             <div className="flex flex-col sm:flex-row w-full gap-2 items-center">
                <Input ref={newItemDescRef} placeholder="Nama item..." value={newItemDesc} onChange={(e) => setNewItemDesc(e.target.value)} className="flex-grow" />
                <div className="flex w-full sm:w-auto gap-2">
                    <Input placeholder="Qty" type="number" value={newItemQty} onChange={(e) => setNewItemQty(e.target.value)} className="w-16 flex-shrink-0" />
                    <Input placeholder="Harga..." value={newItemPrice} onChange={handleAmountChange(setNewItemPrice)} onKeyDown={(e) => {if (e.key === 'Enter') handleAddItem();}} className="flex-grow" />
                    <Button className="px-4" onClick={handleAddItem}><PlusCircle className="h-5 w-5" /></Button>
                </div>
             </div>
        </CardFooter>
      </Card>
      <Card>
          <CardHeader><CardTitle className="flex items-center gap-3"><Info className="h-6 w-6"/> Biaya Tambahan</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
               <div className="space-y-2">
                  <Label className="text-xs">Diskon Global</Label>
                   <div className="flex items-center gap-2">
                       <RadioGroup value={globalDiscountType} onValueChange={(v: 'amount' | 'percentage') => setGlobalDiscountType(v)} className="flex">
                           <div className="flex items-center space-x-1.5"><RadioGroupItem value="percentage" id="gd-percentage" /><Label htmlFor="gd-percentage" className="text-xs font-normal">%</Label></div>
                           <div className="flex items-center space-x-1.5"><RadioGroupItem value="amount" id="gd-amount" /><Label htmlFor="gd-amount" className="text-xs font-normal">Rp</Label></div>
                       </RadioGroup>
                       <Input type={globalDiscountType === 'percentage' ? 'number' : 'text'} inputMode="decimal" placeholder="0" value={globalDiscountValue} onChange={globalDiscountType === 'percentage' ? e => setGlobalDiscountValue(e.target.value) : handleAmountChange(setGlobalDiscountValue)} />
                   </div>
              </div>
          </CardContent>
      </Card>
      
      {summary && sessionParticipants.length > 0 && (
      <div className="space-y-4">
        <div className="grid lg:grid-cols-2 gap-4">
            <div className="space-y-4">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-3"><Sparkles className="h-6 w-6"/> Penyederhanaan</CardTitle></CardHeader>
                    <CardContent className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Pembulatan</Label>
                            <Select onValueChange={(val) => setRounding(parseInt(val))} defaultValue="0">
                                <SelectTrigger><SelectValue placeholder="Pilih Pembulatan" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Tidak ada pembulatan</SelectItem>
                                    <SelectItem value="100">Bulatkan ke atas (Rp 100)</SelectItem>
                                    <SelectItem value="500">Bulatkan ke atas (Rp 500)</SelectItem>
                                    <SelectItem value="1000">Bulatkan ke atas (Rp 1.000)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Siapa yang Bayar?</Label>
                            <Select onValueChange={(id) => setPayerId(id)} value={payerId}>
                                <SelectTrigger><SelectValue placeholder="Pilih Pembayar" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Belum Ditentukan</SelectItem>
                                    {sessionParticipants.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {summary.roundingDifference !== 0 && (
                            <p className="sm:col-span-2 text-sm text-muted-foreground">
                                {summary.roundingDifference > 0 ? 'Total kelebihan bayar (tip) dari pembulatan: ' : 'Total kekurangan bayar dari pembulatan: '}
                                <span className="font-bold text-primary">{formatRupiah(Math.abs(summary.roundingDifference))}</span>
                            </p>
                        )}
                    </CardContent>
                </Card>
                {summary.transactions.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-3"><Wallet className="h-6 w-6"/> Rincian Utang</CardTitle></CardHeader>
                        <CardContent>
                            {summary.transactions.map(t => (
                                <p key={t.from} className="text-sm">
                                    <span className="font-bold" dangerouslySetInnerHTML={{__html: t.from}}></span> harus bayar <span className="font-bold text-primary">{formatRupiah(t.amount)}</span> ke <span className="font-bold" dangerouslySetInnerHTML={{__html: t.to}}></span>
                                </p>
                            ))}
                        </CardContent>
                    </Card>
                )}
                 <Card>
                    <CardHeader><CardTitle>Visualisasi</CardTitle></CardHeader>
                    <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={summary.participants} dataKey="totalToPay" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                    {summary.participants.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <RechartsTooltip formatter={(value) => formatRupiah(value as number)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-4">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><Info className="h-6 w-6"/> Total Keseluruhan</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-2 text-sm'>
                       <div className="flex justify-between"><span className="text-muted-foreground">Subtotal (Setelah Diskon Item)</span><span>{formatRupiah(summary.totalItemExpenses)}</span></div>
                       <div className="flex justify-between"><span className="text-muted-foreground">PPN ({ppnValue}%)</span><span>{formatRupiah(summary.ppnAmount)}</span></div>
                       <div className="flex justify-between"><span className="text-muted-foreground">Service Tax</span><span>{formatRupiah(summary.serviceTaxAmount)}</span></div>
                       <div className="flex justify-between"><span className="text-muted-foreground">Ongkir</span><span>{formatRupiah(summary.deliveryFee)}</span></div>
                       <div className="flex justify-between"><span className="text-muted-foreground">Diskon (Global)</span><span className='text-destructive'>-{formatRupiah(globalDiscountDetails.type === 'percentage' ? summary.totalItemExpenses * (globalDiscountDetails.value/100) : globalDiscountDetails.value)}</span></div>
                       <Separator />
                       <div className="flex justify-between items-center font-bold"><span className="text-base">Total Tagihan</span><span className="text-xl">{formatRupiah(summary.totalBill)}</span></div>
                        {summary.roundingDifference !== 0 && (
                             <div className="flex justify-between items-center font-bold text-primary"><span className="text-base">Grand Total (Dibulatkan)</span><span className="text-xl">{formatRupiah(summary.grandTotal)}</span></div>
                        )}
                    </CardContent>
                </Card>
                <Card className="shadow-lg">
                    <CardHeader className="flex flex-row justify-between items-center">
                        <CardTitle className="flex items-center gap-3 text-lg"><FileText className="h-5 w-5"/> Hasil Patungan</CardTitle>
                        <SaveResultDialog summary={summary} items={items} participants={sessionParticipants}><Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Simpan</Button></SaveResultDialog>
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
                                   <span className="text-muted-foreground">Bagian PPN</span>
                                   <span className="text-green-600">+{formatRupiah(p.ppnShare)}</span>
                                 </div>
                                 <div className="flex justify-between">
                                   <span className="text-muted-foreground">Bagian Service Tax</span>
                                   <span className="text-green-600">+{formatRupiah(p.serviceTaxShare)}</span>
                                 </div>
                                 <div className="flex justify-between">
                                   <span className="text-muted-foreground">Bagian Ongkir</span>
                                   <span className="text-green-600">+{formatRupiah(p.deliveryFeeShare)}</span>
                                 </div>
                                 <div className="flex justify-between">
                                   <span className="text-muted-foreground">Bagian Diskon</span>
                                   <span className="text-destructive">-{formatRupiah(p.globalDiscountShare + items.filter(i => i.sharedBy.includes(p.id)).reduce((acc, i) => acc + (i.discount.type === 'amount' ? i.discount.value / i.sharedBy.length : (i.price * i.quantity * i.discount.value / 100) / i.sharedBy.length), 0))}</span>
                                 </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
      )}
    </div>
  );
}