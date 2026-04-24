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
  CheckCircle2,
  XCircle,
  Camera,
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
import type { SessionParticipant, BillItem, Summary, ServiceTaxDetails, DiscountDetails, SessionState, Transaction } from '@/types';
import { calculateSplit } from '@/lib/calculator';
import { sessionStateSchema } from '@/types';
import { SaveResultDialog } from './save-result-dialog';
import { useIsMobile } from '@/hooks/use-is-mobile';

// --- START: Updated TagParticipantDialog with Clickable Row ---
function TagParticipantDialog({ item, sessionParticipants, onTag, children }: { item: BillItem, sessionParticipants: SessionParticipant[], onTag: (itemId: string, participantIds: string[]) => void, children: React.ReactNode }) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(item.sharedBy));
    
    const isLimitReached = selectedIds.size >= item.quantity;

    const handleCheckChange = (participantId: string) => {
        const newIds = new Set(selectedIds);
        // Toggle selection
        if (newIds.has(participantId)) {
            newIds.delete(participantId);
        } else {
            // Only add if limit is not reached
            if (newIds.size < item.quantity) {
                newIds.add(participantId);
            }
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
                    <DialogDescription className="truncate">
                        <span>{item.description}</span>
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
                                className={`flex items-center space-x-3 p-2 rounded-md transition-opacity ${isDisabled ? 'opacity-50' : 'hover:bg-muted/50 cursor-pointer'}`}
                                // The onClick handler is removed from here to let the Label handle it.
                            >
                                <Checkbox 
                                    id={`p-${p.id}-${item.id}`} // Use unique ID per item to avoid conflicts
                                    checked={isSelected}
                                    disabled={isDisabled}
                                    onCheckedChange={() => handleCheckChange(p.id)}
                                />
                                <Label 
                                    htmlFor={`p-${p.id}-${item.id}`} 
                                    className={`flex-1 font-normal text-sm w-full truncate ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    {p.name}
                                </Label>
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

function ScanButton({ onScanComplete }: { onScanComplete: (items: any[]) => void }) {
    const [isScanning, setIsScanning] = useState(false);
    const [statusText, setStatusText] = useState('');
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const streamRef = useRef<MediaStream | null>(null);
    const [warningOpen, setWarningOpen] = useState(false);
    const [scannedItemsCount, setScannedItemsCount] = useState(0);

    const processImage = async (file: File) => {
        setIsScanning(true);
        setStatusText('Memproses OCR...');
        
        try {
            const formData = new FormData();
            formData.append('receipt', file);
            
            const submitRes = await fetch('/api/ocr', {
                method: 'POST',
                body: formData
            });
            
            if (!submitRes.ok) {
                const err = await submitRes.json().catch(()=>({}));
                throw new Error(err.error || 'Gagal terhubung ke server OCR');
            }
            
            const submitData = await submitRes.json();
            if (submitData.error) throw new Error(submitData.error);
            
            const lineItems = submitData.lineItems || [];
            if (lineItems.length === 0) throw new Error('Tidak ada item yang ditemukan pada struk');
            
            onScanComplete(lineItems);
            setScannedItemsCount(lineItems.length);
            setWarningOpen(true);
            
        } catch (error: any) {
            console.error(error);
            toast({ variant: 'destructive', description: error.message || "Gagal memindai struk." });
        } finally {
            setIsScanning(false);
            setStatusText('');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processImage(e.target.files[0]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const openCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            streamRef.current = stream;
        } catch (err) {
            toast({ variant: 'destructive', description: "Gagal mengakses kamera. Pastikan izin kamera diberikan atau gunakan opsi Upload File." });
            setIsCameraOpen(false);
        }
    };

    const closeCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
    };

    const captureImage = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], "receipt.jpg", { type: "image/jpeg" });
                        processImage(file);
                        closeCamera();
                    }
                }, 'image/jpeg', 0.8);
            }
        }
    };

    return (
        <>
            <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
            />
            
            <Dialog open={isCameraOpen} onOpenChange={(open) => !open && closeCamera()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Kamera Pemindai</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="relative w-full aspect-[3/4] bg-black rounded-md overflow-hidden flex items-center justify-center">
                            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                            {!streamRef.current && <span className="text-white text-sm">Memuat kamera...</span>}
                        </div>
                        <Button onClick={captureImage} className="w-full h-12 text-lg">
                            <Camera className="mr-2 h-5 w-5" /> Ambil Foto Struk
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={warningOpen} onOpenChange={setWarningOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-500">
                            <AlertTriangle className="h-5 w-5" /> Perhatian: Cek Kembali Hasil AI
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-sm text-foreground">
                            AI telah memindai <strong>{scannedItemsCount} item</strong> dari struk Anda dan menyalinnya ke kotak Input Massal di bawah.
                            <br/><br/>
                            Teknologi pembacaan struk (OCR) tidak selalu 100% sempurna, apalagi jika struk buram atau lecek. <strong>Mohon periksa dan koreksi secara manual</strong> nama item, kuantitas, serta harga jika ada kesalahan baca (typo) sebelum Anda menekan tombol "Tambahkan Item".
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => setWarningOpen(false)}>Siap, Saya Mengerti</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="flex gap-2 w-full">
                <Button 
                    variant="secondary" 
                    className="flex-1"
                    disabled={isScanning}
                    onClick={openCamera}
                >
                    {isScanning ? (
                        <span className="flex items-center justify-center gap-2 w-full"><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div> {statusText}</span>
                    ) : (
                        <span className="flex items-center justify-center gap-2 w-full"><Camera className="h-4 w-4" /> Buka Kamera</span>
                    )}
                </Button>
                <Button 
                    variant="outline" 
                    className="flex-none px-3"
                    disabled={isScanning}
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload File Struk"
                >
                    <Upload className="h-4 w-4" />
                </Button>
            </div>
        </>
    );
}
// --- END: Updated TagParticipantDialog ---

// Other Helper Components (No changes below this line, assuming they are correct)
function ConfirmationDialog({ title, description, onConfirm, children }: { title: string; description: string; onConfirm: () => void; children: React.ReactNode; }) {
  return (<Dialog><DialogTrigger asChild>{children}</DialogTrigger><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><DialogFooter><DialogClose asChild><Button variant="outline">Batal</Button></DialogClose><DialogClose asChild><Button variant="destructive" onClick={onConfirm}>Konfirmasi</Button></DialogClose></DialogFooter></DialogContent></Dialog>);
}
function EditItemDialog({ item, onSave, children }: { item: BillItem; onSave: (itemId: string, newDesc: string, newQty: number, newPrice: number) => void; children: React.ReactNode;}) {
    const [description, setDescription] = useState(item.description);
    const [quantity, setQuantity] = useState(item.quantity.toString());
    const [price, setPrice] = useState(item.price.toString());
    const [formattedPrice, setFormattedPrice] = useState(() => new Intl.NumberFormat('id-ID').format(item.price));
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => { const numericValue = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10); setPrice(isNaN(numericValue) ? '0' : String(numericValue)); setFormattedPrice(isNaN(numericValue) ? '' : new Intl.NumberFormat('id-ID').format(numericValue)); };
    useEffect(() => { setPrice(item.price.toString()); setFormattedPrice(new Intl.NumberFormat('id-ID').format(item.price)); }, [item]);
    const { toast } = useToast();
    const handleSave = () => { const qty = parseInt(quantity, 10); const prc = parseFloat(price); if (!description.trim() || isNaN(qty) || qty <= 0 || isNaN(prc) || prc < 0) { toast({ variant: 'destructive', description: "Semua field harus diisi dengan benar." }); return; } onSave(item.id, description, qty, prc); };
    return (<Dialog><DialogTrigger asChild>{children}</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Edit Item</DialogTitle><DialogDescription>Ubah detail pesanan di bawah ini.</DialogDescription></DialogHeader><div className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="edit-desc">Nama Item</Label><Input id="edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="edit-qty">Kuantitas</Label><Input id="edit-qty" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="edit-price">Harga Satuan</Label><Input id="edit-price" type="text" value={formattedPrice} onChange={handleAmountChange} /></div></div></div><DialogFooter><DialogClose asChild><Button type="button" variant="secondary">Batal</Button></DialogClose><DialogClose asChild><Button type="button" onClick={handleSave}>Simpan Perubahan</Button></DialogClose></DialogFooter></DialogContent></Dialog>);
}
function TutorialDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild><Button variant="link" className="p-0 h-auto text-muted-foreground gap-1"><HelpCircle className="h-4 w-4" /> Panduan Lengkap</Button></DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl"><BookUser className="h-5 w-5 text-primary"/> Cara Pakai Kalkulator Receh</DialogTitle>
                    <DialogDescription>Ikuti langkah mudah ini untuk membagi tagihan dengan cepat dan akurat.</DialogDescription>
                </DialogHeader>
                <div className="text-sm space-y-5 max-h-[70vh] overflow-y-auto pr-4 pt-2">
                    <div>
                        <h4 className="font-semibold mb-1 flex items-center gap-2 text-foreground"><Users className="h-4 w-4 text-blue-500"/> 1. Masukkan Nama Peserta</h4>
                        <p className="text-muted-foreground pl-6">Ketik nama teman-teman Anda yang ikut patungan. Anda juga bisa memilih dari <strong>Buku Kontak</strong> agar tidak perlu mengetik ulang nama yang sama di masa depan.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-1 flex items-center gap-2 text-foreground"><Camera className="h-4 w-4 text-emerald-500"/> 2. Scan Struk Otomatis (Fitur AI)</h4>
                        <p className="text-muted-foreground pl-6">Tidak perlu ketik manual! Klik <strong>Buka Kamera</strong> untuk memfoto struk, atau <strong>Upload</strong> foto struk dari galeri. AI Pintar kami akan membaca struk dan menyalin isinya ke kotak Input Massal secara otomatis.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-1 flex items-center gap-2 text-foreground"><ChevronsRight className="h-4 w-4 text-orange-500"/> 3. Input Manual (Opsional)</h4>
                        <p className="text-muted-foreground pl-6">Jika tidak memfoto struk, Anda bisa mengetik langsung di kotak Input Massal dengan format: <strong>Qty Nama_Item Harga_Total</strong> (Contoh: <code className="bg-muted px-1 rounded">2 Es Teh 10000</code>). Pastikan semuanya valid lalu klik <strong>Tambahkan Item</strong>.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-1 flex items-center gap-2 text-foreground"><Receipt className="h-4 w-4 text-purple-500"/> 4. Siapa Pesan Apa?</h4>
                        <p className="text-muted-foreground pl-6">Pada Daftar Pesanan, klik tombol <strong className="text-foreground"><UserPlus size={14} className="inline-block"/> (Tandai Peserta)</strong> untuk memilih siapa saja yang ikut menikmati makanan tersebut. Harga akan dibagi rata sesuai jumlah orang.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-1 flex items-center gap-2 text-foreground"><Info className="h-4 w-4 text-amber-500"/> 5. Pajak, Diskon & Ongkir</h4>
                        <p className="text-muted-foreground pl-6">Jangan lupa masukkan <strong>PPN (misal 11%)</strong>, Pajak Layanan (Service), Ongkos Kirim (jika pesan ojol), dan Diskon Global jika ada. Sistem akan membaginya secara proporsional ke semua peserta.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-1 flex items-center gap-2 text-foreground"><Sparkles className="h-4 w-4 text-pink-500"/> 6. Bagikan Hasil Tagihan!</h4>
                        <p className="text-muted-foreground pl-6">Kalkulator akan menampilkan total rinci yang sangat presisi untuk tiap orang. Anda juga bisa mengatur pembulatan nominal, lalu klik <strong>Bagikan Hasil</strong> untuk di-<em>copy</em> ke WhatsApp!</p>
                    </div>
                </div>
                <DialogFooter><DialogClose asChild><Button className="w-full">Saya Mengerti, Ayo Mulai!</Button></DialogClose></DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
function ContactsDialog({ onSelect, contacts, setContacts }: { onSelect: (contact: Pick<SessionParticipant, 'id' | 'name'>) => void; contacts: Pick<SessionParticipant, 'id' | 'name'>[]; setContacts: React.Dispatch<React.SetStateAction<Pick<SessionParticipant, 'id' | 'name'>[]>>;}) {
    const [newContactName, setNewContactName] = useState('');
    const { toast } = useToast();
    const CONTACTS_KEY = 'kalkulatorReceh_contacts';
    const addContact = () => { const sanitizedName = DOMPurify.sanitize(newContactName.trim()); if (sanitizedName) { setContacts(prev => { if (prev.some(c => c.name === sanitizedName)) return prev; return [...prev, { id: crypto.randomUUID(), name: sanitizedName }]; }); setNewContactName(''); } };
    const removeContact = (id: string) => { setContacts(prev => prev.filter(c => c.id !== id)); toast({ description: "Kontak telah dihapus." }); };
    return (<Dialog><DialogTrigger asChild><Button variant="outline" size="sm"><BookUser className="mr-2 h-4 w-4" /> Kontak</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Buku Kontak</DialogTitle><DialogDescription>Pilih kontak untuk ditambahkan ke sesi ini atau tambah kontak baru.</DialogDescription></DialogHeader><div className="flex gap-2 my-4"><Input placeholder="Nama Kontak Baru" value={newContactName} onChange={e => setNewContactName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addContact()} /><Button onClick={addContact}><PlusCircle className="h-4 w-4" /></Button></div><div className="max-h-64 space-y-2 overflow-y-auto">{contacts.length > 0 ? contacts.map(contact => (<div key={contact.id} className="flex items-center justify-between rounded-md border p-2"><span className="font-medium text-sm truncate max-w-[200px]">{contact.name}</span><div className="flex gap-1"><Button size="sm" variant="secondary" onClick={() => onSelect(contact)}>Tambah</Button><Button size="icon" variant="ghost" onClick={() => removeContact(contact.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></div>)) : <p className="text-sm text-center text-muted-foreground">Belum ada kontak tersimpan.</p>}</div></DialogContent></Dialog>);
}
function ItemDiscountDialog({ item, onSave, children }: { item: BillItem; onSave: (itemId: string, discount: DiscountDetails) => void; children: React.ReactNode }) {
    const [type, setType] = useState<DiscountDetails['type']>(item.discount.type);
    const [value, setValue] = useState(item.discount.value.toString());
    const handleSave = () => onSave(item.id, { type, value: parseFloat(value) || 0 });
    return (<Dialog><DialogTrigger asChild>{children}</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Diskon untuk Item:</DialogTitle><DialogDescription className="truncate">{item.description}</DialogDescription></DialogHeader><div className="grid gap-4 py-4"><RadioGroup value={type} onValueChange={(v: DiscountDetails['type']) => setType(v)} className="flex"><div className="flex items-center space-x-2"><RadioGroupItem value="percentage" id="d-percentage" /><Label htmlFor="d-percentage">Persen (%)</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="amount" id="d-amount" /><Label htmlFor="d-amount">Jumlah (Rp)</Label></div></RadioGroup><Input placeholder="Nilai Diskon" type="number" value={value} onChange={e => setValue(e.target.value)} /></div><DialogFooter><DialogClose asChild><Button onClick={handleSave}>Simpan Diskon</Button></DialogClose></DialogFooter></DialogContent></Dialog>);
}
function ParticipantTagList({ item, sessionParticipants }: { item: BillItem; sessionParticipants: SessionParticipant[] }) {
    if (item.sharedBy.length === 0) { return (<TooltipProvider delayDuration={100}><Tooltip><TooltipTrigger><AlertTriangle className="h-4 w-4 text-amber-500" /></TooltipTrigger><TooltipContent><p>Item ini belum ditandai.</p></TooltipContent></Tooltip></TooltipProvider>); }
    const taggedParticipants = sessionParticipants.filter(p => item.sharedBy.includes(p.id));
    return (<div className="flex items-center gap-1 text-xs text-muted-foreground">{taggedParticipants.slice(0, 3).map(p => (<span key={p.id} className="bg-muted px-2 py-0.5 rounded-full truncate max-w-[60px] inline-block" title={p.name}>{p.name.substring(0, 3)}</span>))}{taggedParticipants.length > 3 && ( <span className="font-bold">+{taggedParticipants.length - 3}</span> )}</div>);
}

const INITIAL_STATE = { sessionParticipants: [], items: [], ppn: '', serviceTaxType: 'percentage' as 'amount' | 'percentage', serviceTaxValue: '', deliveryFee: '', globalDiscountType: 'amount' as 'amount' | 'percentage', globalDiscountValue: '', rounding: 0, payerId: undefined as string | undefined };
const SESSION_KEY = 'kalkulatorReceh_lastSession';

type ValidatedLine = { line: string; isValid: boolean; error?: string; data?: BillItem };

export function BillSplitter() {
  const { toast } = useToast();
  // All state declarations
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
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [paidTransactions, setPaidTransactions] = useState<Set<string>>(new Set());
  const [isRestored, setIsRestored] = useState(false);
  const [validatedLines, setValidatedLines] = useState<ValidatedLine[]>([]);

  // Refs and hooks
  const CONTACTS_KEY = 'kalkulatorReceh_contacts';
  const importFileRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  
  // Memoized values and calculations
  const parseFormattedNumber = (value: string): number => Number(value.replace(/[^0-9]/g, '')) || 0;
  const formatRupiah = useCallback((amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(amount)), []);
  const ppnValue = useMemo(() => parseFloat(ppn) || 0, [ppn]);
  const deliveryFeeValue = useMemo(() => parseFormattedNumber(deliveryFee), [deliveryFee]);
  const serviceTaxDetails: ServiceTaxDetails = useMemo(() => ({ type: serviceTaxType, value: serviceTaxType === 'percentage' ? parseFloat(serviceTaxValue) || 0 : parseFormattedNumber(serviceTaxValue) }), [serviceTaxType, serviceTaxValue]);
  const globalDiscountDetails: DiscountDetails = useMemo(() => ({ type: globalDiscountType, value: globalDiscountType === 'percentage' ? parseFloat(globalDiscountValue) || 0 : parseFormattedNumber(globalDiscountValue) }), [globalDiscountType, globalDiscountValue]);
  
  // Main calculation effect
  useEffect(() => { const result = calculateSplit(sessionParticipants, items, ppnValue, serviceTaxDetails, deliveryFeeValue, globalDiscountDetails, rounding, payerId); setSummary(result); }, [sessionParticipants, items, ppnValue, serviceTaxDetails, deliveryFeeValue, globalDiscountDetails, rounding, payerId]);

  // Autosave and Restore Logic
  const saveSession = () => { if(isRestored) { const sessionState: SessionState = { sessionParticipants, items, ppn, serviceTaxType, serviceTaxValue, deliveryFee, globalDiscountType, globalDiscountValue, rounding, payerId }; localStorage.setItem(SESSION_KEY, JSON.stringify(sessionState)); }};
  const loadSession = (sessionState: SessionState) => { setSessionParticipants(sessionState.sessionParticipants); setItems(sessionState.items); setPpn(sessionState.ppn); setServiceTaxType(sessionState.serviceTaxType); setServiceTaxValue(sessionState.serviceTaxValue); setDeliveryFee(sessionState.deliveryFee); setGlobalDiscountType(sessionState.globalDiscountType); setGlobalDiscountValue(sessionState.globalDiscountValue); setRounding(sessionState.rounding); setPayerId(sessionState.payerId || undefined); };
  
  useEffect(() => { saveSession(); }, [sessionParticipants, items, ppn, serviceTaxType, serviceTaxValue, deliveryFee, globalDiscountType, globalDiscountValue, rounding, payerId]);

  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(SESSION_KEY);
      if (savedSession) {
        const sessionData: SessionState = JSON.parse(savedSession);
        // --- START: Smarter Restore Logic ---
        if (sessionData.sessionParticipants.length > 0 || sessionData.items.length > 0) {
          if (window.confirm("Kami menemukan sesi yang belum selesai. Lanjutkan sesi terakhir?")) {
            loadSession(sessionData);
          }
        }
        // --- END: Smarter Restore Logic ---
      }
    } catch (e) { console.error("Could not restore session", e); } finally {
      setIsRestored(true);
    }
    try { const savedContacts = localStorage.getItem(CONTACTS_KEY); if (savedContacts) { setContacts(JSON.parse(savedContacts)); } } catch (error) { console.error("Failed to load contacts", error); } finally { setContactsLoaded(true); }
  }, []);

  useEffect(() => {
    if (contactsLoaded) {
      localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
    }
  }, [contacts, contactsLoaded]);
  
  // Interactive Bulk Input Validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const lines = bulkText.trim().split('\n');
      if (bulkText.trim() === '') { setValidatedLines([]); return; }
      const validations: ValidatedLine[] = lines.map(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 3) { return { line, isValid: false, error: 'Format tidak lengkap' }; }
        const qty = parseInt(parts[0], 10);
        const totalItemPrice = parseInt(parts[parts.length - 1], 10);
        const description = parts.slice(1, -1).join(' ');
        if (isNaN(qty) || qty <= 0) return { line, isValid: false, error: 'Qty tidak valid' };
        if (isNaN(totalItemPrice) || totalItemPrice < 0) return { line, isValid: false, error: 'Harga tidak valid' };
        if (!description) return { line, isValid: false, error: 'Nama item kosong' };
        return { line, isValid: true, data: { id: '', description, price: totalItemPrice / qty, quantity: qty, discount: { type: 'amount', value: 0 }, sharedBy: [] }};
      });
      setValidatedLines(validations);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [bulkText]);
  
  // All other handlers...
  const addParticipant = (name: string, id: string = crypto.randomUUID()) => { const sanitizedName = DOMPurify.sanitize(name.trim()); if (sanitizedName && !sessionParticipants.some(p => p.name === sanitizedName)) { setSessionParticipants(prev => [...prev, { id, name: sanitizedName }]); setContacts(prev => { if (prev.some(c => c.name === sanitizedName)) return prev; return [...prev, { id, name: sanitizedName }]; }); toast({ description: `"${sanitizedName}" berhasil ditambahkan.` }); } };
  const handleAddParticipant = () => { addParticipant(newParticipantName); setNewParticipantName(''); };
  const removeParticipant = (id: string) => { setSessionParticipants(prev => prev.filter(p => p.id !== id)); setItems(prev => prev.map(item => ({ ...item, sharedBy: item.sharedBy.filter(pId => pId !== id) }))); };
  const handleBulkAdd = () => { const newItems = validatedLines.filter(v => v.isValid && v.data).map(v => ({...v.data!, id: crypto.randomUUID()})); const failedCount = validatedLines.length - newItems.length; if (newItems.length > 0) { setItems(prev => [...prev, ...newItems]); toast({ description: `${newItems.length} item berhasil ditambahkan.` }); } if (failedCount > 0) { toast({ variant: 'destructive', description: `${failedCount} baris gagal diproses. Periksa pratinjau untuk detail.` }); } else { setBulkText(''); } };
  const handleScanComplete = (scannedItems: any[]) => { const newLines = scannedItems.map(item => `${item.qty} ${item.name} ${item.totalPrice}`).join('\n'); setBulkText(newLines); };
  const handleEditItem = (itemId: string, newDesc: string, newQty: number, newPrice: number) => { setItems(prev => prev.map(item => item.id === itemId ? { ...item, description: newDesc, quantity: newQty, price: newPrice } : item)); toast({ description: "Item berhasil diperbarui." }); };
  const removeItem = (id: string) => setItems(prev => prev.filter(item => item.id !== id));
  const handleTagParticipant = (itemId: string, participantIds: string[]) => setItems(prev => prev.map(item => item.id === itemId ? {...item, sharedBy: participantIds} : item));
  const handleItemDiscount = (itemId: string, discount: DiscountDetails) => setItems(prev => prev.map(item => item.id === itemId ? {...item, discount} : item));
  const handleAmountChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => { const numericValue = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10); setter(isNaN(numericValue) ? '' : new Intl.NumberFormat('id-ID').format(numericValue)); };
  const handleExport = () => { const sessionState: SessionState = { sessionParticipants, items, ppn, serviceTaxType, serviceTaxValue, deliveryFee, globalDiscountType, globalDiscountValue, rounding, payerId }; const dataStr = JSON.stringify(sessionState, null, 2); const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr); const exportFileDefaultName = `kalkulator-receh-sesi-${new Date().toISOString().slice(0,10)}.json`; const linkElement = document.createElement('a'); linkElement.setAttribute('href', dataUri); linkElement.setAttribute('download', exportFileDefaultName); linkElement.click(); toast({ description: "Sesi berhasil diekspor!" }); };
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => { const fileReader = new FileReader(); const { files } = event.target; if (!files || files.length === 0) return; fileReader.readAsText(files[0], "UTF-8"); fileReader.onload = e => { try { const result = e.target?.result; if (typeof result !== 'string') throw new Error("File content is not a string"); const jsonData = JSON.parse(result); const validatedData = sessionStateSchema.parse(jsonData); loadSession(validatedData); toast({ description: "Sesi berhasil diimpor." }); } catch (error) { toast({ variant: 'destructive', title: "Gagal Mengimpor", description: "Format file JSON tidak valid atau rusak." }); console.error("Import error:", error); } }; if(importFileRef.current) importFileRef.current.value = ""; };
  const handleResetAll = () => { loadSession(INITIAL_STATE); setBulkText(''); setNewParticipantName(''); localStorage.removeItem(SESSION_KEY); toast({ description: "Semua data telah direset." }); };
  const handleTogglePaidTransaction = (transactionKey: string) => { setPaidTransactions(prev => { const newSet = new Set(prev); if (newSet.has(transactionKey)) { newSet.delete(transactionKey); } else { newSet.add(transactionKey); } return newSet; }); };
  
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center"><CardTitle className="flex items-center gap-3"><Users className="h-6 w-6" /> Peserta & Sesi</CardTitle><TutorialDialog /></div>
            <div className="flex flex-col sm:flex-row-reverse gap-2 pt-2">
              <div className="flex-grow flex gap-2"><Input placeholder="Nama Peserta Baru..." value={newParticipantName} onChange={(e) => setNewParticipantName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddParticipant()} /><Button onClick={handleAddParticipant}><PlusCircle className="h-4 w-4" /></Button></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:flex sm:items-center sm:flex-wrap">
                <ContactsDialog onSelect={(c) => addParticipant(c.name, c.id)} contacts={contacts} setContacts={setContacts}/>
                <input type="file" ref={importFileRef} className="hidden" accept=".json" onChange={handleImport} />
                <Button variant="outline" size="sm" onClick={() => importFileRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Impor</Button>
                <Button variant="outline" size="sm" onClick={handleExport}><Save className="mr-2 h-4 w-4" /> Ekspor</Button>
                <ConfirmationDialog title="Reset Semua Data?" description="Aksi ini akan menghapus semua peserta, item, dan pengaturan biaya. Anda yakin ingin melanjutkan?" onConfirm={handleResetAll}><Button variant="destructive" size="sm"><RotateCcw className="mr-2 h-4 w-4"/> Reset</Button></ConfirmationDialog>
              </div>
            </div>
          </CardHeader>
          {sessionParticipants.length > 0 && (<CardContent className="flex flex-wrap gap-2"><AnimatePresence>{sessionParticipants.map(p => (<motion.div key={p.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}><div className="flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full bg-muted text-sm font-medium"><span className="truncate max-w-[150px]" title={p.name}>{p.name}</span><Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => removeParticipant(p.id)}><X className="h-4 w-4" /></Button></div></motion.div>))}</AnimatePresence></CardContent>)}
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-3"><Receipt className="h-6 w-6" /> Daftar Pesanan</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <AnimatePresence>{items.map(item => (<motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20, transition: {duration: 0.2} }}><div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"><div className="flex-1 min-w-0"><p className="font-medium text-sm truncate" title={`${item.description} (x${item.quantity})`}>{item.description} (x{item.quantity})</p><p className="text-sm font-mono text-muted-foreground">{formatRupiah(item.price * item.quantity)}</p></div><div className="flex items-center gap-1 ml-2"><ParticipantTagList item={item} sessionParticipants={sessionParticipants} />{isMobile ? (<DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={(e) => e.preventDefault()}><TagParticipantDialog item={item} sessionParticipants={sessionParticipants} onTag={handleTagParticipant}><div className="flex items-center w-full"><UserPlus className="mr-2 h-4 w-4"/> Tandai Peserta</div></TagParticipantDialog></DropdownMenuItem><DropdownMenuItem onSelect={(e) => e.preventDefault()}><ItemDiscountDialog item={item} onSave={handleItemDiscount}><div className="flex items-center w-full"><Percent className="mr-2 h-4 w-4"/> Beri Diskon</div></ItemDiscountDialog></DropdownMenuItem><DropdownMenuItem onSelect={(e) => e.preventDefault()}><EditItemDialog item={item} onSave={handleEditItem}><div className="flex items-center w-full"><Pencil className="mr-2 h-4 w-4"/> Edit Item</div></EditItemDialog></DropdownMenuItem><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive"><ConfirmationDialog title="Hapus Item Ini?" description={`Anda yakin ingin menghapus item "${item.description}"?`} onConfirm={() => removeItem(item.id)}><div className="flex items-center w-full"><Trash2 className="mr-2 h-4 w-4"/> Hapus Item</div></ConfirmationDialog></DropdownMenuItem></DropdownMenuContent></DropdownMenu>) : (<><ItemDiscountDialog item={item} onSave={handleItemDiscount}><Button variant={item.discount.value > 0 ? "secondary" : "ghost"} size="icon" className="h-8 w-8"><Percent className="h-4 w-4" /></Button></ItemDiscountDialog><TagParticipantDialog item={item} sessionParticipants={sessionParticipants} onTag={handleTagParticipant}><Button variant="outline" size="sm" className="h-8"><UserPlus className="h-4 w-4" /></Button></TagParticipantDialog><EditItemDialog item={item} onSave={handleEditItem}><Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4 text-blue-600" /></Button></EditItemDialog><ConfirmationDialog title="Hapus Item Ini?" description={`Anda yakin ingin menghapus item "${item.description}"?`} onConfirm={() => removeItem(item.id)}><Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4 text-destructive" /></Button></ConfirmationDialog></>)}</div></div></motion.div>))}</AnimatePresence>
          </CardContent>
          <CardFooter className="p-4 pt-0 border-t">
              <div className="w-full space-y-3 mt-4">
                  <div className="flex items-center justify-between gap-4">
                      <Label htmlFor="bulk-input" className="font-semibold flex items-center gap-2"><ChevronsRight className="h-4 w-4"/> Input Massal</Label>
                      <div className="w-1/2 sm:w-1/3"><ScanButton onScanComplete={handleScanComplete} /></div>
                  </div>
                  <Textarea id="bulk-input" placeholder={`1 Nasi Goreng Spesial 25000\n2 Es Teh Manis 10000\n1 Kerupuk 2000`} value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={4} />
                  <p className="text-xs text-muted-foreground">Format: <strong>Qty Nama Item HargaTotal</strong>. Scan Struk untuk mengisi otomatis, lalu audit dan edit bila perlu.</p>
              {validatedLines.length > 0 && (<div className="border rounded-md p-2 space-y-1 max-h-32 overflow-y-auto">{validatedLines.map((v, i) => (<div key={i} className={`flex items-center gap-2 text-xs ${!v.isValid ? 'text-destructive' : 'text-green-600'}`}>{v.isValid ? <CheckCircle2 className="h-3 w-3"/> : <XCircle className="h-3 w-3"/>}<span className="font-mono flex-1 truncate">{v.line}</span>{!v.isValid && <span className="font-semibold">{v.error}</span>}</div>))}</div>)}
              <Button onClick={handleBulkAdd} className="w-full" disabled={validatedLines.some(v => !v.isValid) || validatedLines.length === 0}>Tambahkan Item</Button></div>
          </CardFooter>
        </Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-3"><Info className="h-6 w-6"/> Biaya Tambahan</CardTitle></CardHeader><CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><div className="space-y-2"><Label htmlFor="ppn" className="text-xs">PPN (%)</Label><Input id="ppn" type="number" placeholder="0" value={ppn} onChange={e => setPpn(e.target.value)} /></div><div className="space-y-2"><Label className="text-xs">Service Tax</Label><div className="flex items-center gap-2"><RadioGroup value={serviceTaxType} onValueChange={(v: 'amount' | 'percentage') => setServiceTaxType(v)} className="flex"><div className="flex items-center space-x-1.5"><RadioGroupItem value="percentage" id="st-percentage" /><Label htmlFor="st-percentage" className="text-xs font-normal">%</Label></div><div className="flex items-center space-x-1.5"><RadioGroupItem value="amount" id="st-amount" /><Label htmlFor="st-amount" className="text-xs font-normal">Rp</Label></div></RadioGroup><Input type={serviceTaxType === 'percentage' ? 'number' : 'text'} inputMode="decimal" placeholder="0" value={serviceTaxValue} onChange={serviceTaxType === 'percentage' ? e => setServiceTaxValue(e.target.value) : handleAmountChange(setServiceTaxValue)} /></div></div><div className="space-y-2"><Label htmlFor="deliveryFee" className="text-xs">Ongkir (Rp)</Label><Input id="deliveryFee" type="text" inputMode="decimal" placeholder="0" value={deliveryFee} onChange={handleAmountChange(setDeliveryFee)} /></div><div className="space-y-2"><Label className="text-xs">Diskon Global</Label><div className="flex items-center gap-2"><RadioGroup value={globalDiscountType} onValueChange={(v: 'amount' | 'percentage') => setGlobalDiscountType(v)} className="flex"><div className="flex items-center space-x-1.5"><RadioGroupItem value="percentage" id="gd-percentage" /><Label htmlFor="gd-percentage" className="text-xs font-normal">%</Label></div><div className="flex items-center space-x-1.5"><RadioGroupItem value="amount" id="gd-amount" /><Label htmlFor="gd-amount" className="text-xs font-normal">Rp</Label></div></RadioGroup><Input type={globalDiscountType === 'percentage' ? 'number' : 'text'} inputMode="decimal" placeholder="0" value={globalDiscountValue} onChange={globalDiscountType === 'percentage' ? e => setGlobalDiscountValue(e.target.value) : handleAmountChange(setGlobalDiscountValue)} /></div></div></CardContent></Card>
        {summary && sessionParticipants.length > 0 && (
        <div className="space-y-4">
            <Card><CardHeader><CardTitle>Visualisasi Porsi Bayar</CardTitle></CardHeader><CardContent className="h-80 w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={summary.participants} dataKey="totalToPay" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0, index = 0 }) => { const RADIAN = Math.PI / 180; const radius = (innerRadius as number) + ((outerRadius as number) - (innerRadius as number)) * 1.2; const x = (cx as number) + radius * Math.cos(-(midAngle as number) * RADIAN); const y = (cy as number) + radius * Math.sin(-(midAngle as number) * RADIAN); return ( <text x={x} y={y} fill="currentColor" textAnchor={x > (cx as number) ? 'start' : 'end'} dominantBaseline="central" className="text-xs fill-foreground"> {`${summary.participants[index as number]?.name} (${((percent as number) * 100).toFixed(0)}%)`} </text> ); }}>{summary.participants.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><RechartsTooltip formatter={(value) => formatRupiah(value as number)} contentStyle={{ backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }} /><Legend /></PieChart></ResponsiveContainer></CardContent></Card>
            <div className="grid lg:grid-cols-2 gap-4">
                <div className="space-y-4"><Card><CardHeader><CardTitle className="flex items-center gap-3"><Sparkles className="h-6 w-6"/> Penyederhanaan</CardTitle></CardHeader><CardContent className="grid sm:grid-cols-2 gap-4"><div className="space-y-2"><Label>Pembulatan</Label><Select onValueChange={(val) => setRounding(parseInt(val))} defaultValue="0"><SelectTrigger><SelectValue placeholder="Pilih Pembulatan" /></SelectTrigger><SelectContent><SelectItem value="0">Tidak ada</SelectItem><SelectItem value="100">Ke atas (Rp 100)</SelectItem><SelectItem value="500">Ke atas (Rp 500)</SelectItem><SelectItem value="1000">Ke atas (Rp 1.000)</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Siapa yang Bayar?</Label><Select onValueChange={(id) => setPayerId(id === 'none' ? undefined : id)} value={payerId}><SelectTrigger><SelectValue placeholder="Pilih Pembayar" /></SelectTrigger><SelectContent><SelectItem value="none">Belum Ditentukan</SelectItem>{sessionParticipants.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>{summary.roundingDifference !== 0 && (<p className="sm:col-span-2 text-sm text-muted-foreground">{summary.roundingDifference > 0 ? 'Total kelebihan (tip): ' : 'Total kekurangan: '}<span className="font-bold text-primary">{formatRupiah(Math.abs(summary.roundingDifference))}</span></p>)}</CardContent></Card>
                {summary.transactions.length > 0 && (<Card><CardHeader><CardTitle className="flex items-center gap-3"><Wallet className="h-6 w-6"/> Rincian Utang</CardTitle></CardHeader><CardContent>{summary.transactions.map(t => { const transactionKey = `${t.from}-${t.to}-${t.amount}`; const isPaid = paidTransactions.has(transactionKey); return (<div key={transactionKey} className="flex items-center gap-2 mb-2"><Checkbox id={transactionKey} checked={isPaid} onCheckedChange={() => handleTogglePaidTransaction(transactionKey)} /><Label htmlFor={transactionKey} className={`text-sm leading-normal ${isPaid ? 'line-through text-muted-foreground' : ''}`}><span className="font-bold">{t.from}</span> harus bayar <span className="font-bold text-primary">{formatRupiah(t.amount)}</span> ke <span className="font-bold">{t.to}</span></Label></div>) })}</CardContent></Card>)}</div>
                <div className="space-y-4">
                     <Card><CardHeader><CardTitle className="flex items-center gap-3"><Info className="h-6 w-6"/> Total Keseluruhan</CardTitle></CardHeader><CardContent className='space-y-2 text-sm'><div className="flex justify-between"><span className="text-muted-foreground">Subtotal Item</span><span>{formatRupiah(summary.totalItemExpenses)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">PPN ({ppnValue}%)</span><span>{formatRupiah(summary.ppnAmount)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Service Tax</span><span>{formatRupiah(summary.serviceTaxAmount)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Ongkir</span><span>{formatRupiah(summary.deliveryFee)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Diskon Global</span><span className='text-destructive'>-{formatRupiah(globalDiscountDetails.type === 'percentage' ? summary.totalItemExpenses * (globalDiscountDetails.value/100) : globalDiscountDetails.value)}</span></div><Separator /><div className="flex justify-between items-center font-bold"><span className="text-base">Total Tagihan</span><span className="text-xl">{formatRupiah(summary.totalBill)}</span></div>{summary.roundingDifference !== 0 && (<div className="flex justify-between items-center font-bold text-primary"><span className="text-base">Grand Total</span><span className="text-xl">{formatRupiah(summary.grandTotal)}</span></div>)}</CardContent></Card>
                    <Card className="shadow-lg"><CardHeader className="flex flex-row justify-between items-center"><CardTitle className="flex items-center gap-3 text-lg"><FileText className="h-5 w-5"/> Hasil Patungan</CardTitle><SaveResultDialog summary={summary} items={items}><Button variant="outline" size="sm"><Copy className="mr-2 h-4 w-4" /> Bagikan Hasil</Button></SaveResultDialog></CardHeader><CardContent><Accordion type="multiple" className="w-full">{summary.participants.map(p => (<AccordionItem value={p.id} key={p.id}><AccordionTrigger><div className="flex w-full justify-between items-center pr-4"><span className="font-medium text-sm truncate max-w-[150px]">{p.name}</span><span className="font-bold text-base text-primary whitespace-nowrap ml-2">{formatRupiah(p.totalToPay)}</span></div></AccordionTrigger><AccordionContent className="text-xs space-y-1 pr-4"><div className="flex justify-between"><span className="text-muted-foreground">Subtotal Pesanan</span><span>{formatRupiah(p.subtotal)}</span></div><Separator className="my-1" /><div className="flex justify-between"><span className="text-muted-foreground">Bagian PPN ({ppnValue}%)</span><span className="text-green-600">+{formatRupiah(p.ppnShare)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Bagian Service Tax {serviceTaxDetails.type === 'percentage' ? `(${serviceTaxDetails.value}%)` : ''}</span><span className="text-green-600">+{formatRupiah(p.serviceTaxShare)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Bagian Ongkir</span><span className="text-green-600">+{formatRupiah(p.deliveryFeeShare)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Bagian Diskon</span><span className="text-destructive">-{formatRupiah(p.globalDiscountShare + items.filter(i => i.sharedBy.includes(p.id)).reduce((acc, i) => acc + (i.discount.type === 'amount' ? i.discount.value / (i.sharedBy.length || 1) : (i.price * i.quantity * i.discount.value / 100) / (i.sharedBy.length || 1)), 0))}</span></div></AccordionContent></AccordionItem>))}</Accordion></CardContent></Card>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}