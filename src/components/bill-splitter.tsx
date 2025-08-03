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
  Info,
  BookUser,
  HelpCircle,
  Users,
  AlertTriangle,
  Receipt,
  Sparkles,
  Wallet,
  Percent,
  Pencil,
  ChevronsRight,
  Upload,
  Save,
  RotateCcw,
  Copy,
  MoreVertical,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SessionParticipant, BillItem, Summary, ServiceTaxDetails, DiscountDetails, SessionState } from '@/types';
import { calculateSplit } from '@/lib/calculator';
import { SaveResultDialog } from './save-result-dialog';

const useIsMobile = (breakpoint = 640) => {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkScreenSize = () => { setIsMobile(window.innerWidth < breakpoint); };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, [breakpoint]);
    return isMobile;
};

// --- START: Updated TagParticipantDialog with Quantity Limit Logic ---
function TagParticipantDialog({ item, sessionParticipants, onTag, children }: { item: BillItem, sessionParticipants: SessionParticipant[], onTag: (itemId: string, participantIds: string[]) => void, children: React.ReactNode }) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(item.sharedBy));
    
    const isLimitReached = selectedIds.size >= item.quantity;

    const handleCheckChange = (participantId: string, checked: boolean) => {
        const newIds = new Set(selectedIds);
        if (checked) {
            // Only add if limit is not reached
            if (newIds.size < item.quantity) {
                newIds.add(participantId);
            }
        } else {
            newIds.delete(participantId);
        }
        setSelectedIds(newIds);
    };

    const handleSave = () => onTag(item.id, Array.from(selectedIds));
    
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Tandai Peserta untuk Item:</DialogTitle>
                    <DialogDescription>
                        <span dangerouslySetInnerHTML={{ __html: item.description }}/>
                        <br/>
                        Pilih hingga <strong>{item.quantity} peserta</strong> (sesuai kuantitas item).
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                    {sessionParticipants.map(p => {
                        const isSelected = selectedIds.has(p.id);
                        const isDisabled = !isSelected && isLimitReached;

                        return (
                            <div 
                                key={p.id} 
                                className={`flex items-center space-x-3 p-2 rounded-md transition-opacity ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/50 cursor-pointer'}`}
                                onClick={() => !isDisabled && handleCheckChange(p.id, !isSelected)}
                            >
                                <Checkbox 
                                    id={`p-${p.id}`} 
                                    checked={isSelected}
                                    disabled={isDisabled}
                                />
                                <Label 
                                    htmlFor={`p-${p.id}`} 
                                    className={`flex-1 font-normal text-sm ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                    dangerouslySetInnerHTML={{ __html: p.name }}
                                />
                            </div>
                        );
                    })}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button onClick={handleSave}>Simpan Tanda</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
// --- END: Updated TagParticipantDialog ---

function ConfirmationDialog({ title, description, onConfirm, children }: { title: string; description: string; onConfirm: () => void; children: React.ReactNode; }) {
  return (<Dialog><DialogTrigger asChild>{children}</DialogTrigger><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><DialogFooter><DialogClose asChild><Button variant="outline">Batal</Button></DialogClose><DialogClose asChild><Button variant="destructive" onClick={onConfirm}>Konfirmasi</Button></DialogClose></DialogFooter></DialogContent></Dialog>);
}
function EditItemDialog({ item, onSave, children }: { item: BillItem; onSave: (itemId: string, newDesc: string, newQty: number, newPrice: number) => void; children: React.ReactNode;}) {
    const [description, setDescription] = useState(item.description);
    const [quantity, setQuantity] = useState(item.quantity.toString());
    const [price, setPrice] = useState(item.price.toString());
    const [formattedPrice, setFormattedPrice] = useState('');
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => { const numericValue = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10); const newPrice = isNaN(numericValue) ? '0' : String(numericValue); const newFormattedPrice = isNaN(numericValue) ? '' : new Intl.NumberFormat('id-ID').format(numericValue); setPrice(newPrice); setFormattedPrice(newFormattedPrice); };
    useEffect(() => { setPrice(item.price.toString()); setFormattedPrice(new Intl.NumberFormat('id-ID').format(item.price)); }, [item]);
    const { toast } = useToast();
    const handleSave = () => { const qty = parseInt(quantity, 10); const prc = parseFloat(price); if (!description.trim() || isNaN(qty) || qty <= 0 || isNaN(prc) || prc < 0) { toast({ variant: 'destructive', description: "Semua field harus diisi dengan benar." }); return; } onSave(item.id, description, qty, prc); };
    return (<Dialog><DialogTrigger asChild>{children}</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Edit Item</DialogTitle><DialogDescription>Ubah detail pesanan di bawah ini.</DialogDescription></DialogHeader><div className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="edit-desc">Nama Item</Label><Input id="edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="edit-qty">Kuantitas</Label><Input id="edit-qty" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="edit-price">Harga Satuan</Label><Input id="edit-price" type="text" value={formattedPrice} onChange={handleAmountChange} /></div></div></div><DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Batal</Button></DialogClose><DialogClose asChild><Button type="button" onClick={handleSave}>Simpan Perubahan</Button></DialogClose></DialogFooter></DialogContent></Dialog>);
}
function TutorialDialog() {
    return (<Dialog><DialogTrigger asChild><Button variant="link" className="p-0 h-auto text-muted-foreground gap-1"><HelpCircle className="h-4 w-4" /> Tutorial</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2"><HelpCircle/> Panduan Cepat Kalkulator Receh</DialogTitle><DialogDescription>Ikuti langkah-langkah ini untuk membagi tagihan secara efisien.</DialogDescription></DialogHeader><div className="text-sm space-y-4 max-h-[70vh] overflow-y-auto pr-4 pt-2"><div><h4 className="font-semibold mb-1 flex items-center gap-2"><Users className="h-4 w-4"/> 1. Kelola Peserta & Sesi</h4><p className="text-muted-foreground pl-6">Tambahkan peserta secara manual, dari kontak, atau impor sesi dari file JSON. Anda juga bisa mengekspor sesi saat ini atau mereset semua data.</p></div><div><h4 className="font-semibold mb-1 flex items-center gap-2"><ChevronsRight className="h-4 w-4"/> 2. Input Pesanan (Cara Cepat)</h4><p className="text-muted-foreground pl-6">Gunakan fitur <strong>Input Massal</strong>. Salin-tempel beberapa baris dari struk dengan format <strong>Qty Nama Item HargaTotal</strong> untuk menambahkan semua pesanan sekaligus.</p></div><div><h4 className="font-semibold mb-1 flex items-center gap-2"><Receipt className="h-4 w-4"/> 3. Kelola Setiap Item</h4><p className="text-muted-foreground pl-6">Setelah item ditambahkan, gunakan tombol aksi untuk:</p><ul className="list-disc pl-12 text-muted-foreground space-y-1 mt-1"><li><strong className="text-foreground">Tandai Peserta (<UserPlus size={14} className="inline-block"/>):</strong> Pilih siapa saja yang ikut memesan item tersebut.</li><li><strong className="text-foreground">Beri Diskon (<Percent size={14} className="inline-block"/>):</strong> Tambahkan diskon khusus untuk item itu.</li><li><strong className="text-foreground">Edit & Hapus (<Pencil size={14} className="inline-block"/> / <Trash2 size={14} className="inline-block"/>):</strong> Ubah atau hapus item jika ada kesalahan.</li></ul></div><div><h4 className="font-semibold mb-1 flex items-center gap-2"><Info className="h-4 w-4"/> 4. Atur Biaya Tambahan</h4><p className="text-muted-foreground pl-6">Masukkan PPN, Pajak Jasa, Ongkos Kirim, dan Diskon Global yang berlaku untuk seluruh tagihan.</p></div><div><h4 className="font-semibold mb-1 flex items-center gap-2"><Sparkles className="h-4 w-4"/> 5. Lihat Hasil & Bagikan</h4><p className="text-muted-foreground pl-6">Atur pembulatan dan pilih siapa yang membayar. Hasilnya akan terhitung otomatis dan siap dibagikan ke teman-teman Anda.</p></div></div><DialogFooter><DialogClose asChild><Button>Mengerti!</Button></DialogClose></DialogFooter></DialogContent></Dialog>);
}
function ContactsDialog({ onSelect, contacts, setContacts }: { onSelect: (contact: Pick<SessionParticipant, 'id' | 'name'>) => void; contacts: Pick<SessionParticipant, 'id' | 'name'>[]; setContacts: React.Dispatch<React.SetStateAction<Pick<SessionParticipant, 'id' | 'name'>[]>>;}) {
    const [newContactName, setNewContactName] = useState('');
    const { toast } = useToast();
    const CONTACTS_KEY = 'kalkulatorReceh_contacts';
    const addContact = () => { const sanitizedName = DOMPurify.sanitize(newContactName.trim()); if (sanitizedName && !contacts.some(c => c.name === sanitizedName)) { const newContact = { id: crypto.randomUUID(), name: sanitizedName }; const updatedContacts = [...contacts, newContact]; setContacts(updatedContacts); localStorage.setItem(CONTACTS_KEY, JSON.stringify(updatedContacts)); setNewContactName(''); } };
    const removeContact = (id: string) => { const updatedContacts = contacts.filter(c => c.id !== id); setContacts(updatedContacts); localStorage.setItem(CONTACTS_KEY, JSON.stringify(updatedContacts)); toast({ description: "Kontak telah dihapus." }); };
    return (<Dialog><DialogTrigger asChild><Button variant="outline" size="sm"><BookUser className="mr-2 h-4 w-4" /> Kontak</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Buku Kontak</DialogTitle><DialogDescription>Pilih kontak untuk ditambahkan ke sesi ini atau tambah kontak baru.</DialogDescription></DialogHeader><div className="flex gap-2 my-4"><Input placeholder="Nama Kontak Baru" value={newContactName} onChange={e => setNewContactName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addContact()} /><Button onClick={addContact}><PlusCircle className="h-4 w-4" /></Button></div><div className="max-h-64 space-y-2 overflow-y-auto">{contacts.length > 0 ? contacts.map(contact => (<div key={contact.id} className="flex items-center justify-between rounded-md border p-2"><span className="font-medium text-sm" dangerouslySetInnerHTML={{ __html: contact.name }}></span><div className="flex gap-1"><Button size="sm" variant="secondary" onClick={() => onSelect(contact)}>Tambah</Button><Button size="icon" variant="ghost" onClick={() => removeContact(contact.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></div>)) : <p className="text-sm text-center text-muted-foreground">Belum ada kontak tersimpan.</p>}</div></DialogContent></Dialog>);
}
function ItemDiscountDialog({ item, onSave, children }: { item: BillItem; onSave: (itemId: string, discount: DiscountDetails) => void; children: React.ReactNode }) {
    const [type, setType] = useState<DiscountDetails['type']>(item.discount.type);
    const [value, setValue] = useState(item.discount.value.toString());
    const handleSave = () => onSave(item.id, { type, value: parseFloat(value) || 0 });
    return (<Dialog><DialogTrigger asChild>{children}</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Diskon untuk Item:</DialogTitle><DialogDescription dangerouslySetInnerHTML={{ __html: item.description }}/></DialogHeader><div className="grid gap-4 py-4"><RadioGroup value={type} onValueChange={(v: DiscountDetails['type']) => setType(v)} className="flex"><div className="flex items-center space-x-2"><RadioGroupItem value="percentage" id="d-percentage" /><Label htmlFor="d-percentage">Persen (%)</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="amount" id="d-amount" /><Label htmlFor="d-amount">Jumlah (Rp)</Label></div></RadioGroup><Input placeholder="Nilai Diskon" type="number" value={value} onChange={e => setValue(e.target.value)} /></div><DialogFooter><DialogClose asChild><Button onClick={handleSave}>Simpan Diskon</Button></DialogClose></DialogFooter></DialogContent></Dialog>);
}
function ParticipantTagList({ item, sessionParticipants }: { item: BillItem; sessionParticipants: SessionParticipant[] }) {
    if (item.sharedBy.length === 0) { return (<TooltipProvider delayDuration={100}><Tooltip><TooltipTrigger><AlertTriangle className="h-4 w-4 text-amber-500" /></TooltipTrigger><TooltipContent><p>Item ini belum ditandai.</p></TooltipContent></Tooltip></TooltipProvider>); }
    const taggedParticipants = sessionParticipants.filter(p => item.sharedBy.includes(p.id));
    return (<div className="flex items-center gap-1 text-xs text-muted-foreground">{taggedParticipants.slice(0, 3).map(p => (<span key={p.id} className="bg-muted px-2 py-0.5 rounded-full" dangerouslySetInnerHTML={{ __html: p.name.substring(0, 3) }}></span>))}{taggedParticipants.length > 3 && ( <span className="font-bold">+{taggedParticipants.length - 3}</span> )}</div>);
}

const INITIAL_STATE = { sessionParticipants: [], items: [], ppn: '', serviceTaxType: 'percentage' as 'amount' | 'percentage', serviceTaxValue: '', deliveryFee: '', globalDiscountType: 'amount' as 'amount' | 'percentage', globalDiscountValue: '', rounding: 0, payerId: undefined as string | undefined };

export function BillSplitter() {
  const { toast } = useToast();
  const [sessionParticipants, setSessionParticipants] = useState<SessionParticipant[]>(INITIAL_STATE.sessionParticipants);
  const [items, setItems] = useState<BillItem[]>(INITIAL_STATE.items);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [ppn, setPpn] = useState(INITIAL_STATE.ppn);
  const [serviceTaxType, setServiceTaxType] = useState<'amount' | 'percentage'>(INITIAL_STATE.serviceTaxType);
  const [serviceTaxValue, setServiceTaxValue] = useState(INITIAL_STATE.serviceTaxValue);
  const [deliveryFee, setDeliveryFee] = useState(INITIAL_STATE.deliveryFee);
  const [globalDiscountType, setGlobalDiscountType] = useState<'amount' | 'percentage'>(INITIAL_STATE.globalDiscountType);
  const [globalDiscountValue, setGlobalDiscountValue] = useState(INITIAL_STATE.globalDiscountValue);
  const [rounding, setRounding] = useState(INITIAL_STATE.rounding);
  const [payerId, setPayerId] = useState<string | undefined>(INITIAL_STATE.payerId);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [contacts, setContacts] = useState<Pick<SessionParticipant, 'id' | 'name'>[]>([]);
  const CONTACTS_KEY = 'kalkulatorReceh_contacts';
  const importFileRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => { try { const savedContacts = localStorage.getItem(CONTACTS_KEY); if (savedContacts) setContacts(JSON.parse(savedContacts)); } catch (error) { console.error("Failed to load contacts", error); } }, []);
  const parseFormattedNumber = (value: string): number => Number(value.replace(/[^0-9]/g, '')) || 0;
  const formatRupiah = useCallback((amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(amount)), []);
  const ppnValue = useMemo(() => parseFloat(ppn) || 0, [ppn]);
  const deliveryFeeValue = useMemo(() => parseFormattedNumber(deliveryFee), [deliveryFee]);
  const serviceTaxDetails: ServiceTaxDetails = useMemo(() => ({ type: serviceTaxType, value: serviceTaxType === 'percentage' ? parseFloat(serviceTaxValue) || 0 : parseFormattedNumber(serviceTaxValue) }), [serviceTaxType, serviceTaxValue]);
  const globalDiscountDetails: DiscountDetails = useMemo(() => ({ type: globalDiscountType, value: globalDiscountType === 'percentage' ? parseFloat(globalDiscountValue) || 0 : parseFormattedNumber(globalDiscountValue) }), [globalDiscountType, globalDiscountValue]);

  useEffect(() => { const result = calculateSplit(sessionParticipants, items, ppnValue, serviceTaxDetails, deliveryFeeValue, globalDiscountDetails, rounding, payerId); setSummary(result); }, [sessionParticipants, items, ppnValue, serviceTaxDetails, deliveryFeeValue, globalDiscountDetails, rounding, payerId]);

  const addParticipant = (name: string, id: string = crypto.randomUUID()) => { const sanitizedName = DOMPurify.sanitize(name.trim()); if (sanitizedName && !sessionParticipants.some(p => p.name === sanitizedName)) { setSessionParticipants(prev => [...prev, { id, name: sanitizedName }]); if (!contacts.some(c => c.name === sanitizedName)) { const updatedContacts = [...contacts, { id, name: sanitizedName }]; setContacts(updatedContacts); localStorage.setItem(CONTACTS_KEY, JSON.stringify(updatedContacts)); } toast({ description: `"${sanitizedName}" berhasil ditambahkan.` }); } };
  const handleAddParticipant = () => { addParticipant(newParticipantName); setNewParticipantName(''); };
  const removeParticipant = (id: string) => { setSessionParticipants(prev => prev.filter(p => p.id !== id)); setItems(prev => prev.map(item => ({ ...item, sharedBy: item.sharedBy.filter(pId => pId !== id) }))); };
  
  const handleBulkAdd = () => { const lines = bulkText.trim().split('\n'); const newItems: BillItem[] = []; let failedLines = 0; lines.forEach(line => { const parts = line.trim().split(/\s+/); if (parts.length < 3) { failedLines++; return; } const qty = parseInt(parts[0], 10); const totalItemPrice = parseInt(parts[parts.length - 1], 10); const description = parts.slice(1, -1).join(' '); if (!isNaN(qty) && qty > 0 && !isNaN(totalItemPrice) && totalItemPrice >= 0 && description) { newItems.push({ id: crypto.randomUUID(), description, price: totalItemPrice / qty, quantity: qty, discount: { type: 'amount', value: 0 }, sharedBy: [] }); } else { failedLines++; } }); if (newItems.length > 0) { setItems(prev => [...prev, ...newItems]); toast({ description: `${newItems.length} item berhasil ditambahkan.` }); } if (failedLines > 0) { toast({ variant: 'destructive', description: `${failedLines} baris gagal diproses. Pastikan formatnya benar.` }); } setBulkText(''); };
  const handleEditItem = (itemId: string, newDesc: string, newQty: number, newPrice: number) => { setItems(prev => prev.map(item => item.id === itemId ? { ...item, description: newDesc, quantity: newQty, price: newPrice } : item)); toast({ description: "Item berhasil diperbarui." }); };
  const removeItem = (id: string) => setItems(prev => prev.filter(item => item.id !== id));
  const handleTagParticipant = (itemId: string, participantIds: string[]) => setItems(prev => prev.map(item => item.id === itemId ? {...item, sharedBy: participantIds} : item));
  const handleItemDiscount = (itemId: string, discount: DiscountDetails) => setItems(prev => prev.map(item => item.id === itemId ? {...item, discount} : item));
  const handleAmountChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => { const numericValue = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10); setter(isNaN(numericValue) ? '' : new Intl.NumberFormat('id-ID').format(numericValue)); };
  
  const handleExport = () => { const sessionState: SessionState = { sessionParticipants, items, ppn, serviceTaxType, serviceTaxValue, deliveryFee, globalDiscountType, globalDiscountValue, rounding, payerId }; const dataStr = JSON.stringify(sessionState, null, 2); const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr); const exportFileDefaultName = `kalkulator-receh-sesi-${new Date().toISOString().slice(0,10)}.json`; const linkElement = document.createElement('a'); linkElement.setAttribute('href', dataUri); linkElement.setAttribute('download', exportFileDefaultName); linkElement.click(); toast({ description: "Sesi berhasil diekspor!" }); };
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => { const fileReader = new FileReader(); const { files } = event.target; if (!files || files.length === 0) return; fileReader.readAsText(files[0], "UTF-8"); fileReader.onload = e => { try { const result = e.target?.result; if (typeof result !== 'string') throw new Error("File content is not a string"); const sessionState: SessionState = JSON.parse(result); setSessionParticipants(sessionState.sessionParticipants); setItems(sessionState.items); setPpn(sessionState.ppn); setServiceTaxType(sessionState.serviceTaxType); setServiceTaxValue(sessionState.serviceTaxValue); setDeliveryFee(sessionState.deliveryFee); setGlobalDiscountType(sessionState.globalDiscountType); setGlobalDiscountValue(sessionState.globalDiscountValue); setRounding(sessionState.rounding); setPayerId(sessionState.payerId); toast({ description: "Sesi berhasil diimpor." }); } catch (error) { toast({ variant: 'destructive', description: "Gagal mengimpor file. Pastikan file JSON valid." }); console.error("Import error:", error); } }; if(importFileRef.current) importFileRef.current.value = ""; };
  
  const handleResetAll = () => { setSessionParticipants(INITIAL_STATE.sessionParticipants); setItems(INITIAL_STATE.items); setPpn(INITIAL_STATE.ppn); setServiceTaxType(INITIAL_STATE.serviceTaxType); setServiceTaxValue(INITIAL_STATE.serviceTaxValue); setDeliveryFee(INITIAL_STATE.deliveryFee); setGlobalDiscountType(INITIAL_STATE.globalDiscountType); setGlobalDiscountValue(INITIAL_STATE.globalDiscountValue); setRounding(INITIAL_STATE.rounding); setPayerId(INITIAL_STATE.payerId); setBulkText(''); setNewParticipantName(''); toast({ description: "Semua data telah direset." }); }
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1975'];

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center"><CardTitle className="flex items-center gap-3"><Users className="h-6 w-6" /> Peserta & Sesi</CardTitle><TutorialDialog /></div>
          <div className="flex flex-col sm:flex-row-reverse gap-2 pt-2">
            <div className="flex-grow flex gap-2"><Input placeholder="Nama Peserta Baru..." value={newParticipantName} onChange={(e) => setNewParticipantName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddParticipant()} /><Button onClick={handleAddParticipant}><PlusCircle className="h-4 w-4" /></Button></div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:flex-wrap">
              <ContactsDialog onSelect={(c) => addParticipant(c.name, c.id)} contacts={contacts} setContacts={setContacts}/>
              <input type="file" ref={importFileRef} className="hidden" accept=".json" onChange={handleImport} />
              <Button variant="outline" size="sm" onClick={() => importFileRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Impor</Button>
              <Button variant="outline" size="sm" onClick={handleExport}><Save className="mr-2 h-4 w-4" /> Ekspor</Button>
              <ConfirmationDialog title="Reset Semua Data?" description="Aksi ini akan menghapus semua peserta, item, dan pengaturan biaya. Anda yakin ingin melanjutkan?" onConfirm={handleResetAll}><Button variant="destructive" size="sm"><RotateCcw className="mr-2 h-4 w-4"/> Reset</Button></ConfirmationDialog>
            </div>
          </div>
        </CardHeader>
        {sessionParticipants.length > 0 && (<CardContent className="flex flex-wrap gap-2"><AnimatePresence>{sessionParticipants.map(p => (<motion.div key={p.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}><div className="flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full bg-muted text-sm font-medium"><span dangerouslySetInnerHTML={{ __html: p.name }} /><Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => removeParticipant(p.id)}><X className="h-4 w-4" /></Button></div></motion.div>))}</AnimatePresence></CardContent>)}
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-3"><Receipt className="h-6 w-6" /> Daftar Pesanan</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <AnimatePresence>{items.map(item => (
            <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20, transition: {duration: 0.2} }}>
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate" dangerouslySetInnerHTML={{__html: `${item.description} (x${item.quantity})`}}></p><p className="text-sm font-mono text-muted-foreground">{formatRupiah(item.price * item.quantity)}</p></div>
                <div className="flex items-center gap-1 ml-2">
                  <ParticipantTagList item={item} sessionParticipants={sessionParticipants} />
                  {isMobile ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}><TagParticipantDialog item={item} sessionParticipants={sessionParticipants} onTag={handleTagParticipant}><div className="flex items-center w-full"><UserPlus className="mr-2 h-4 w-4"/> Tandai Peserta</div></TagParticipantDialog></DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}><ItemDiscountDialog item={item} onSave={handleItemDiscount}><div className="flex items-center w-full"><Percent className="mr-2 h-4 w-4"/> Beri Diskon</div></ItemDiscountDialog></DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}><EditItemDialog item={item} onSave={handleEditItem}><div className="flex items-center w-full"><Pencil className="mr-2 h-4 w-4"/> Edit Item</div></EditItemDialog></DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive"><ConfirmationDialog title="Hapus Item Ini?" description={`Anda yakin ingin menghapus item "${item.description}"?`} onConfirm={() => removeItem(item.id)}><div className="flex items-center w-full"><Trash2 className="mr-2 h-4 w-4"/> Hapus Item</div></ConfirmationDialog></DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <><ItemDiscountDialog item={item} onSave={handleItemDiscount}><Button variant={item.discount.value > 0 ? "secondary" : "ghost"} size="icon" className="h-8 w-8"><Percent className="h-4 w-4" /></Button></ItemDiscountDialog><TagParticipantDialog item={item} sessionParticipants={sessionParticipants} onTag={handleTagParticipant}><Button variant="outline" size="sm" className="h-8"><UserPlus className="h-4 w-4" /></Button></TagParticipantDialog><EditItemDialog item={item} onSave={handleEditItem}><Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4 text-blue-600" /></Button></EditItemDialog><ConfirmationDialog title="Hapus Item Ini?" description={`Anda yakin ingin menghapus item "${item.description}"?`} onConfirm={() => removeItem(item.id)}><Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4 text-destructive" /></Button></ConfirmationDialog></>
                  )}
                </div>
              </div>
            </motion.div>
          ))}</AnimatePresence>
        </CardContent>
        <CardFooter className="p-4 pt-0 border-t">
            <div className="w-full space-y-3 mt-4"><Label htmlFor="bulk-input" className="font-semibold flex items-center gap-2"><ChevronsRight className="h-4 w-4"/> Input Massal (Cara Cepat)</Label><Textarea id="bulk-input" placeholder={`1 Nasi Goreng Spesial 25000\n2 Es Teh Manis 10000\n1 Kerupuk 2000`} value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={5} /><p className="text-xs text-muted-foreground">Format: <strong>Kuantitas</strong> &lt;spasi&gt; <strong>Nama Item</strong> &lt;spasi&gt; <strong>Harga Total</strong> per baris.<br/>Contoh: <code className="bg-muted px-1 rounded">2 Udang Keju 23836</code></p><Button onClick={handleBulkAdd} className="w-full">Tambahkan Semua Item dari Teks</Button></div>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-3"><Info className="h-6 w-6"/> Biaya Tambahan</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><div className="space-y-2"><Label htmlFor="ppn" className="text-xs">PPN (%)</Label><Input id="ppn" type="number" placeholder="0" value={ppn} onChange={e => setPpn(e.target.value)} /></div><div className="space-y-2"><Label className="text-xs">Service Tax</Label><div className="flex items-center gap-2"><RadioGroup value={serviceTaxType} onValueChange={(v: 'amount' | 'percentage') => setServiceTaxType(v)} className="flex"><div className="flex items-center space-x-1.5"><RadioGroupItem value="percentage" id="st-percentage" /><Label htmlFor="st-percentage" className="text-xs font-normal">%</Label></div><div className="flex items-center space-x-1.5"><RadioGroupItem value="amount" id="st-amount" /><Label htmlFor="st-amount" className="text-xs font-normal">Rp</Label></div></RadioGroup><Input type={serviceTaxType === 'percentage' ? 'number' : 'text'} inputMode="decimal" placeholder="0" value={serviceTaxValue} onChange={serviceTaxType === 'percentage' ? e => setServiceTaxValue(e.target.value) : handleAmountChange(setServiceTaxValue)} /></div></div><div className="space-y-2"><Label htmlFor="deliveryFee" className="text-xs">Ongkir (Rp)</Label><Input id="deliveryFee" type="text" inputMode="decimal" placeholder="0" value={deliveryFee} onChange={handleAmountChange(setDeliveryFee)} /></div><div className="space-y-2"><Label className="text-xs">Diskon Global</Label><div className="flex items-center gap-2"><RadioGroup value={globalDiscountType} onValueChange={(v: 'amount' | 'percentage') => setGlobalDiscountType(v)} className="flex"><div className="flex items-center space-x-1.5"><RadioGroupItem value="percentage" id="gd-percentage" /><Label htmlFor="gd-percentage" className="text-xs font-normal">%</Label></div><div className="flex items-center space-x-1.5"><RadioGroupItem value="amount" id="gd-amount" /><Label htmlFor="gd-amount" className="text-xs font-normal">Rp</Label></div></RadioGroup><Input type={globalDiscountType === 'percentage' ? 'number' : 'text'} inputMode="decimal" placeholder="0" value={globalDiscountValue} onChange={globalDiscountType === 'percentage' ? e => setGlobalDiscountValue(e.target.value) : handleAmountChange(setGlobalDiscountValue)} /></div></div></CardContent>
      </Card>
      {summary && sessionParticipants.length > 0 && (
      <div className="space-y-4">
        <Card><CardHeader><CardTitle>Visualisasi Porsi Bayar</CardTitle></CardHeader><CardContent className="h-80 w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={summary.participants} dataKey="totalToPay" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => { const RADIAN = Math.PI / 180; const radius = innerRadius + (outerRadius - innerRadius) * 1.2; const x = cx + radius * Math.cos(-midAngle * RADIAN); const y = cy + radius * Math.sin(-midAngle * RADIAN); return ( <text x={x} y={y} fill="black" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs"> {`${summary.participants[index].name} (${(percent * 100).toFixed(0)}%)`} </text> ); }}>{summary.participants.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><RechartsTooltip formatter={(value) => formatRupiah(value as number)} /><Legend /></PieChart></ResponsiveContainer></CardContent></Card>
        <div className="grid lg:grid-cols-2 gap-4">
            <div className="space-y-4"><Card><CardHeader><CardTitle className="flex items-center gap-3"><Sparkles className="h-6 w-6"/> Penyederhanaan</CardTitle></CardHeader><CardContent className="grid sm:grid-cols-2 gap-4"><div className="space-y-2"><Label>Pembulatan</Label><Select onValueChange={(val) => setRounding(parseInt(val))} defaultValue="0"><SelectTrigger><SelectValue placeholder="Pilih Pembulatan" /></SelectTrigger><SelectContent><SelectItem value="0">Tidak ada</SelectItem><SelectItem value="100">Ke atas (Rp 100)</SelectItem><SelectItem value="500">Ke atas (Rp 500)</SelectItem><SelectItem value="1000">Ke atas (Rp 1.000)</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Siapa yang Bayar?</Label><Select onValueChange={(id) => setPayerId(id === 'none' ? undefined : id)} value={payerId}><SelectTrigger><SelectValue placeholder="Pilih Pembayar" /></SelectTrigger><SelectContent><SelectItem value="none">Belum Ditentukan</SelectItem>{sessionParticipants.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>{summary.roundingDifference !== 0 && (<p className="sm:col-span-2 text-sm text-muted-foreground">{summary.roundingDifference > 0 ? 'Total kelebihan (tip): ' : 'Total kekurangan: '}<span className="font-bold text-primary">{formatRupiah(Math.abs(summary.roundingDifference))}</span></p>)}</CardContent></Card>{summary.transactions.length > 0 && (<Card><CardHeader><CardTitle className="flex items-center gap-3"><Wallet className="h-6 w-6"/> Rincian Utang</CardTitle></CardHeader><CardContent>{summary.transactions.map(t => (<p key={t.from} className="text-sm"><span className="font-bold" dangerouslySetInnerHTML={{__html: t.from}}></span> harus bayar <span className="font-bold text-primary">{formatRupiah(t.amount)}</span> ke <span className="font-bold" dangerouslySetInnerHTML={{__html: t.to}}></span></p>))}</CardContent></Card>)}</div>
            <div className="space-y-4">
                 <Card><CardHeader><CardTitle className="flex items-center gap-3"><Info className="h-6 w-6"/> Total Keseluruhan</CardTitle></CardHeader><CardContent className='space-y-2 text-sm'><div className="flex justify-between"><span className="text-muted-foreground">Subtotal Item</span><span>{formatRupiah(summary.totalItemExpenses)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">PPN ({ppnValue}%)</span><span>{formatRupiah(summary.ppnAmount)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Service Tax</span><span>{formatRupiah(summary.serviceTaxAmount)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Ongkir</span><span>{formatRupiah(summary.deliveryFee)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Diskon Global</span><span className='text-destructive'>-{formatRupiah(globalDiscountDetails.type === 'percentage' ? summary.totalItemExpenses * (globalDiscountDetails.value/100) : globalDiscountDetails.value)}</span></div><Separator /><div className="flex justify-between items-center font-bold"><span className="text-base">Total Tagihan</span><span className="text-xl">{formatRupiah(summary.totalBill)}</span></div>{summary.roundingDifference !== 0 && (<div className="flex justify-between items-center font-bold text-primary"><span className="text-base">Grand Total</span><span className="text-xl">{formatRupiah(summary.grandTotal)}</span></div>)}</CardContent></Card>
                <Card className="shadow-lg"><CardHeader className="flex flex-row justify-between items-center"><CardTitle className="flex items-center gap-3 text-lg"><FileText className="h-5 w-5"/> Hasil Patungan</CardTitle>
                <SaveResultDialog summary={summary} items={items}><Button variant="outline" size="sm"><Copy className="mr-2 h-4 w-4" /> Bagikan Hasil</Button></SaveResultDialog>
                </CardHeader><CardContent><Accordion type="multiple" className="w-full">{summary.participants.map(p => (<AccordionItem value={p.id} key={p.id}><AccordionTrigger><div className="flex w-full justify-between items-center pr-4"><span className="font-medium text-sm" dangerouslySetInnerHTML={{ __html: p.name }}></span><span className="font-bold text-base text-primary">{formatRupiah(p.totalToPay)}</span></div></AccordionTrigger><AccordionContent className="text-xs space-y-1 pr-4"><div className="flex justify-between"><span className="text-muted-foreground">Subtotal Pesanan</span><span>{formatRupiah(p.subtotal)}</span></div><Separator className="my-1" /><div className="flex justify-between"><span className="text-muted-foreground">Bagian PPN ({ppnValue}%)</span><span className="text-green-600">+{formatRupiah(p.ppnShare)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Bagian Service Tax {serviceTaxDetails.type === 'percentage' ? `(${serviceTaxDetails.value}%)` : ''}</span><span className="text-green-600">+{formatRupiah(p.serviceTaxShare)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Bagian Ongkir</span><span className="text-green-600">+{formatRupiah(p.deliveryFeeShare)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Bagian Diskon</span><span className="text-destructive">-{formatRupiah(p.globalDiscountShare + items.filter(i => i.sharedBy.includes(p.id)).reduce((acc, i) => acc + (i.discount.type === 'amount' ? i.discount.value / (i.sharedBy.length || 1) : (i.price * i.quantity * i.discount.value / 100) / (i.sharedBy.length || 1)), 0))}</span></div></AccordionContent></AccordionItem>))}</Accordion></CardContent></Card>
            </div>
        </div>
      </div>
      )}
    </div>
  );
}