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
  Lock,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/lib/i18n";
import type { SessionParticipant, BillItem, Summary, ServiceTaxDetails, DiscountDetails, SessionState, Transaction } from '@/types';
import { calculateSplit } from '@/lib/calculator';
import { sessionStateSchema } from '@/types';
import { SaveResultDialog } from './save-result-dialog';
import { useIsMobile } from '@/hooks/use-is-mobile';

// --- START: Updated TagParticipantDialog with Clickable Row ---
function TagParticipantDialog({ item, sessionParticipants, onTag, children }: { item: BillItem, sessionParticipants: SessionParticipant[], onTag: (itemId: string, participantIds: string[]) => void, children: React.ReactNode }) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(item.sharedBy));
    
    const isLimitReached = selectedIds.size >= item.quantity;
    const { t } = useLanguage();

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
            <DialogContent className="w-[94vw] sm:max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle>{t('tagParticipantTitle')}</DialogTitle>
                    <DialogDescription className="truncate">
                        <span>{item.description}</span>
                        <br/>
                        <span dangerouslySetInnerHTML={{__html: t('tagParticipantLimit').replace('{qty}', item.quantity.toString())}}></span>
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
                    <DialogClose asChild><Button onClick={handleSave}>{t('saveTag')}</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ScanButton({ onScanComplete }: { onScanComplete: (items: any[]) => void }) {
    const [isScanning, setIsScanning] = useState(false);
    const [statusText, setStatusText] = useState('');
    const { toast } = useToast();
    const { t } = useLanguage();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const streamRef = useRef<MediaStream | null>(null);
    const [warningOpen, setWarningOpen] = useState(false);
    const [scannedItemsCount, setScannedItemsCount] = useState(0);

    const processImage = async (file: File) => {
        setIsScanning(true);
        setStatusText(t('processingOCR'));
        
        try {
            const formData = new FormData();
            formData.append('receipt', file);
            
            const submitRes = await fetch('/api/ocr', {
                method: 'POST',
                body: formData
            });
            
            if (!submitRes.ok) {
                const err = await submitRes.json().catch(()=>({}));
                throw new Error(err.error || t('ocrError'));
            }
            
            const submitData = await submitRes.json();
            if (submitData.error) throw new Error(submitData.error);
            
            const lineItems = submitData.lineItems || [];
            if (lineItems.length === 0) throw new Error(t('noItemsFound'));
            
            onScanComplete(lineItems);
            setScannedItemsCount(lineItems.length);
            setWarningOpen(true);
            
        } catch (error: any) {
            console.error(error);
            toast({ variant: 'destructive', description: error.message || t('scanFailed') });
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
            toast({ variant: 'destructive', description: t('cameraError') });
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
                <DialogContent className="w-[94vw] sm:max-w-md rounded-2xl p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle>{t('cameraScanner')}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="relative w-full aspect-[3/4] bg-black rounded-md overflow-hidden flex items-center justify-center">
                            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                            {!streamRef.current && <span className="text-white text-sm">{t('loadingCamera')}</span>}
                        </div>
                        <Button onClick={captureImage} className="w-full h-12 text-lg">
                            <Camera className="mr-2 h-5 w-5" /> {t('takePhoto')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={warningOpen} onOpenChange={setWarningOpen}>
                <DialogContent className="w-[94vw] sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-500">
                            <AlertTriangle className="h-5 w-5" /> {t('aiWarningTitle')}
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-sm text-foreground" dangerouslySetInnerHTML={{__html: t('aiWarningDesc')}}>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2"><p className="text-sm font-medium">{t('aiWarningCount')} {scannedItemsCount}</p></div>
                    <DialogFooter>
                        <Button onClick={() => setWarningOpen(false)}>{t('gotItCheck')}</Button>
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
                        <span className="flex items-center justify-center gap-2 w-full"><Camera className="h-4 w-4" /> {t('openCamera')}</span>
                    )}
                </Button>
                <Button 
                    variant="outline" 
                    className="flex-none px-3"
                    disabled={isScanning}
                    onClick={() => fileInputRef.current?.click()}
                    title={t('uploadReceipt')}
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
  const { t } = useLanguage();
  return (<Dialog><DialogTrigger asChild>{children}</DialogTrigger><DialogContent className="w-[94vw] sm:max-w-md rounded-2xl"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><DialogFooter><DialogClose asChild><Button variant="outline">{t('cancel')}</Button></DialogClose><DialogClose asChild><Button variant="destructive" onClick={onConfirm}>{t('confirm')}</Button></DialogClose></DialogFooter></DialogContent></Dialog>);
}
function EditItemDialog({ item, onSave, children }: { item: BillItem; onSave: (itemId: string, newDesc: string, newQty: number, newPrice: number) => void; children: React.ReactNode;}) {
    const { t } = useLanguage();
    const [description, setDescription] = useState(item.description);
    const [quantity, setQuantity] = useState(item.quantity.toString());
    const [price, setPrice] = useState(item.price.toString());
    const [formattedPrice, setFormattedPrice] = useState(() => new Intl.NumberFormat('id-ID').format(item.price));
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => { const numericValue = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10); setPrice(isNaN(numericValue) ? '0' : String(numericValue)); setFormattedPrice(isNaN(numericValue) ? '' : new Intl.NumberFormat('id-ID').format(numericValue)); };
    useEffect(() => { setPrice(item.price.toString()); setFormattedPrice(new Intl.NumberFormat('id-ID').format(item.price)); }, [item]);
    const { toast } = useToast();
    const handleSave = () => { const qty = parseInt(quantity, 10); const prc = parseFloat(price); if (!description.trim() || isNaN(qty) || qty <= 0 || isNaN(prc) || prc < 0) { toast({ variant: 'destructive', description: t('toastAllFieldsRequired') }); return; } onSave(item.id, description, qty, prc); };
    return (<Dialog><DialogTrigger asChild>{children}</DialogTrigger><DialogContent className="w-[94vw] sm:max-w-md rounded-2xl"><DialogHeader><DialogTitle>{t('editItem')}</DialogTitle><DialogDescription>{t('editOrder')}</DialogDescription></DialogHeader><div className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="edit-desc">{t('itemName')}</Label><Input id="edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="edit-qty">{t('qty')}</Label><Input id="edit-qty" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="edit-price">{t('price')}</Label><Input id="edit-price" type="text" value={formattedPrice} onChange={handleAmountChange} /></div></div></div><DialogFooter><DialogClose asChild><Button type="button" variant="secondary">{t('cancel')}</Button></DialogClose><DialogClose asChild><Button type="button" onClick={handleSave}>{t('saveChanges')}</Button></DialogClose></DialogFooter></DialogContent></Dialog>);
}
function TutorialDialog() {
    const { t } = useLanguage();
    return (
        <Dialog>
            <DialogTrigger asChild><Button variant="link" className="p-0 h-auto text-muted-foreground gap-1"><HelpCircle className="h-4 w-4" /> {t('tutorialTitle')}</Button></DialogTrigger>
            <DialogContent className="w-[94vw] sm:max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl"><BookUser className="h-5 w-5 text-primary"/> {t('tutorialHeader')}</DialogTitle>
                    <DialogDescription dangerouslySetInnerHTML={{__html: t('tutorialDesc')}}></DialogDescription>
                </DialogHeader>
                <div className="text-sm space-y-4 max-h-[70vh] overflow-y-auto pr-4 pt-2 pb-2">
                    <div className="border-l-4 border-l-blue-500 pl-4 py-1">
                        <h4 className="font-semibold mb-1 flex items-center gap-2 text-foreground">1. {t('step1Title')}</h4>
                        <p className="text-muted-foreground" dangerouslySetInnerHTML={{__html: t('tutStep1Desc')}}></p>
                    </div>
                    <div className="border-l-4 border-l-emerald-500 pl-4 py-1">
                        <h4 className="font-semibold mb-1 flex items-center gap-2 text-foreground">2. {t('step2Title')}</h4>
                        <p className="text-muted-foreground" dangerouslySetInnerHTML={{__html: t('tutStep2Desc')}}></p>
                    </div>
                    <div className="border-l-4 border-l-orange-500 pl-4 py-1">
                        <h4 className="font-semibold mb-1 flex items-center gap-2 text-foreground">3. {t('step3Title')}</h4>
                        <p className="text-muted-foreground" dangerouslySetInnerHTML={{__html: t('tutStep3Desc')}}></p>
                    </div>
                    <div className="border-l-4 border-l-purple-500 pl-4 py-1">
                        <h4 className="font-semibold mb-1 flex items-center gap-2 text-foreground">4. {t('step4Title')}</h4>
                        <p className="text-muted-foreground" dangerouslySetInnerHTML={{__html: t('tutStep4Desc')}}></p>
                    </div>
                </div>
                <DialogFooter><DialogClose asChild><Button className="w-full">{t('gotItStart')}</Button></DialogClose></DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
function ContactsDialog({ onSelect, contacts, setContacts }: { onSelect: (c: {name: string, id: string}) => void, contacts: {name: string, id: string}[], setContacts: React.Dispatch<React.SetStateAction<{name: string, id: string}[]>> }) {
    const [newContactName, setNewContactName] = useState('');
    const { toast } = useToast();
    const { t } = useLanguage();
    const addContact = () => { const sanitizedName = DOMPurify.sanitize(newContactName.trim()); if (sanitizedName) { setContacts(prev => { if (prev.some(c => c.name === sanitizedName)) return prev; return [...prev, { id: crypto.randomUUID(), name: sanitizedName }]; }); setNewContactName(''); } };
    const removeContact = (id: string) => { setContacts(prev => prev.filter(c => c.id !== id)); toast({ description: t('delete') + " " + t('confirm') }); };
    return (<Dialog><DialogTrigger asChild><Button variant="outline" size="sm"><BookUser className="mr-2 h-4 w-4" /> {t('contacts')}</Button></DialogTrigger><DialogContent className="w-[94vw] sm:max-w-md rounded-2xl"><DialogHeader><DialogTitle>{t('contactBook')}</DialogTitle><DialogDescription>{t('contactDesc')}</DialogDescription></DialogHeader><div className="flex gap-2 my-4"><Input placeholder={t('newContactName')} value={newContactName} onChange={e => setNewContactName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addContact()} /><Button onClick={addContact}><PlusCircle className="h-4 w-4" /></Button></div><div className="max-h-64 space-y-2 overflow-y-auto">{contacts.length > 0 ? contacts.map(contact => (<div key={contact.id} className="flex items-center justify-between rounded-md border p-2"><span className="font-medium text-sm truncate max-w-[200px]">{contact.name}</span><div className="flex gap-1"><Button size="sm" variant="secondary" onClick={() => onSelect(contact)}>{t('add')}</Button><Button size="icon" variant="ghost" onClick={() => removeContact(contact.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></div>)) : <p className="text-sm text-center text-muted-foreground">{t('noContacts')}</p>}</div></DialogContent></Dialog>);
}
function ItemDiscountDialog({ item, onSave, children }: { item: BillItem; onSave: (itemId: string, discount: DiscountDetails) => void; children: React.ReactNode }) {
    const { t } = useLanguage();
    const [type, setType] = useState<DiscountDetails['type']>(item.discount.type);
    const [value, setValue] = useState(item.discount.value.toString());
    const handleSave = () => onSave(item.id, { type, value: parseFloat(value) || 0 });
    return (<Dialog><DialogTrigger asChild>{children}</DialogTrigger><DialogContent className="w-[94vw] sm:max-w-md rounded-2xl"><DialogHeader><DialogTitle>{t('discountFor')}</DialogTitle><DialogDescription className="truncate">{item.description}</DialogDescription></DialogHeader><div className="grid gap-4 py-4"><RadioGroup value={type} onValueChange={(v: DiscountDetails['type']) => setType(v)} className="flex"><div className="flex items-center space-x-2"><RadioGroupItem value="percentage" id="d-percentage" /><Label htmlFor="d-percentage">{t('percent')}</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="amount" id="d-amount" /><Label htmlFor="d-amount">{t('amount')}</Label></div></RadioGroup><Input placeholder={t('discountValue')} type="number" value={value} onChange={e => setValue(e.target.value)} /></div><DialogFooter><DialogClose asChild><Button onClick={handleSave}>{t('saveDiscount')}</Button></DialogClose></DialogFooter></DialogContent></Dialog>);
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
  const { t } = useLanguage();
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
  const [pendingRestoreSession, setPendingRestoreSession] = useState<SessionState | null>(null);
  const [validatedLines, setValidatedLines] = useState<ValidatedLine[]>([]);

  // Refs and hooks
  const CONTACTS_KEY = 'kalkulatorReceh_contacts';
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
        let isSyncValid = true;
        const participantIds = new Set(sessionData.sessionParticipants.map(p => p.id));
        for (const item of sessionData.items) {
            for (const pId of item.sharedBy) {
                if (!participantIds.has(pId)) {
                    isSyncValid = false;
                    break;
                }
            }
        }
        
        if (isSyncValid && (sessionData.sessionParticipants.length > 0 || sessionData.items.length > 0)) {
           setPendingRestoreSession(sessionData);
        } else {
           localStorage.removeItem(SESSION_KEY);
           setIsRestored(true);
        }
        // --- END: Smarter Restore Logic ---
      } else {
        setIsRestored(true);
      }
    } catch (e) { 
      console.error("Could not restore session", e); 
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
  const addParticipant = (name: string, id: string = crypto.randomUUID()) => { const sanitizedName = DOMPurify.sanitize(name.trim()); if (sanitizedName && !sessionParticipants.some(p => p.name === sanitizedName)) { setSessionParticipants(prev => [...prev, { id, name: sanitizedName }]); setContacts(prev => { if (prev.some(c => c.name === sanitizedName)) return prev; return [...prev, { id, name: sanitizedName }]; }); toast({ description: t('toastAdded').replace('{name}', sanitizedName) }); } };
  const handleAddParticipant = () => { addParticipant(newParticipantName); setNewParticipantName(''); };
  const removeParticipant = (id: string) => { setSessionParticipants(prev => prev.filter(p => p.id !== id)); setItems(prev => prev.map(item => ({ ...item, sharedBy: item.sharedBy.filter(pId => pId !== id) }))); };
  const handleBulkAdd = () => { const newItems = validatedLines.filter(v => v.isValid && v.data).map(v => ({...v.data!, id: crypto.randomUUID()})); const failedCount = validatedLines.length - newItems.length; if (newItems.length > 0) { setItems(prev => [...prev, ...newItems]); toast({ description: t('toastItemsAdded').replace('{count}', newItems.length.toString()) }); } if (failedCount > 0) { toast({ variant: 'destructive', description: t('toastLinesFailed').replace('{count}', failedCount.toString()) }); } else { setBulkText(''); } };
  const handleScanComplete = (scannedItems: any[]) => { const newLines = scannedItems.map(item => `${item.qty} ${item.name} ${item.totalPrice}`).join('\n'); setBulkText(newLines); };
  const handleEditItem = (itemId: string, newDesc: string, newQty: number, newPrice: number) => { setItems(prev => prev.map(item => item.id === itemId ? { ...item, description: newDesc, quantity: newQty, price: newPrice } : item)); toast({ description: t('toastItemUpdated') }); };
  const removeItem = (id: string) => setItems(prev => prev.filter(item => item.id !== id));
  const handleTagParticipant = (itemId: string, participantIds: string[]) => setItems(prev => prev.map(item => item.id === itemId ? {...item, sharedBy: participantIds} : item));
  const handleItemDiscount = (itemId: string, discount: DiscountDetails) => setItems(prev => prev.map(item => item.id === itemId ? {...item, discount} : item));
  const handleAmountChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => { const numericValue = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10); setter(isNaN(numericValue) ? '' : new Intl.NumberFormat('id-ID').format(numericValue)); };
  const handleResetAll = () => { loadSession(INITIAL_STATE); setBulkText(''); setNewParticipantName(''); localStorage.removeItem(SESSION_KEY); toast({ description: t('reset') }); };
  const handleTogglePaidTransaction = (transactionKey: string) => { setPaidTransactions(prev => { const newSet = new Set(prev); if (newSet.has(transactionKey)) { newSet.delete(transactionKey); } else { newSet.add(transactionKey); } return newSet; }); };
  
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const isStep2Unlocked = sessionParticipants.length >= 2;
  const isStep3Unlocked = isStep2Unlocked && items.length >= 2;
  const unassignedCount = items.filter(i => i.sharedBy.length === 0).length;
  const isStep4Unlocked = isStep3Unlocked && unassignedCount === 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <AlertDialog open={!!pendingRestoreSession}>
        <AlertDialogContent className="w-[94vw] sm:max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('restoreSessionTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('restoreSessionDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setPendingRestoreSession(null); localStorage.removeItem(SESSION_KEY); setIsRestored(true); }}>{t('startFresh')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if(pendingRestoreSession) { loadSession(pendingRestoreSession); } setPendingRestoreSession(null); setIsRestored(true); }}>{t('continueSession')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

        {/* TAHAP 1 */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"><CardTitle className="flex items-center gap-3"><span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm shadow-sm">1</span> {t('step1Title')}</CardTitle><TutorialDialog /></div>
            <div className="flex flex-col sm:flex-row-reverse gap-2 pt-2">
              <div className="flex-grow flex gap-2"><Input placeholder={t('step1Placeholder')} value={newParticipantName} onChange={(e) => setNewParticipantName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddParticipant()} /><Button onClick={handleAddParticipant}><PlusCircle className="h-4 w-4" /></Button></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:flex sm:items-center sm:flex-wrap">
                <ContactsDialog onSelect={(c) => addParticipant(c.name, c.id)} contacts={contacts} setContacts={setContacts}/>
                <ConfirmationDialog title={t('resetAllConfirmTitle')} description={t('resetAllConfirmDesc')} onConfirm={handleResetAll}><Button variant="destructive" size="sm"><RotateCcw className="mr-2 h-4 w-4"/> {t('reset')}</Button></ConfirmationDialog>
              </div>
            </div>
          </CardHeader>
          {sessionParticipants.length > 0 && (<CardContent className="flex flex-wrap gap-2"><AnimatePresence>{sessionParticipants.map(p => (<motion.div key={p.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}><div className="flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full bg-muted text-sm font-medium border border-blue-500/20"><span className="truncate max-w-[150px]" title={p.name}>{p.name}</span><Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => removeParticipant(p.id)}><X className="h-4 w-4" /></Button></div></motion.div>))}</AnimatePresence></CardContent>)}
        </Card>

        {/* TAHAP 2 */}
        <Card className={`border-l-4 transition-all duration-300 ${isStep2Unlocked ? 'border-l-emerald-500 shadow-sm' : 'border-l-gray-300 opacity-60'}`}>
          <CardHeader><CardTitle className="flex items-center gap-3"><span className={`${isStep2Unlocked ? 'bg-emerald-500 shadow-sm' : 'bg-gray-400'} text-white rounded-full w-6 h-6 flex items-center justify-center text-sm`}>2</span> {t('step2Title')}</CardTitle></CardHeader>
          {isStep2Unlocked ? (
            <CardContent>
              <div className="w-full space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                      <Label htmlFor="bulk-input" className="font-semibold flex items-center gap-2"><ChevronsRight className="h-4 w-4 text-emerald-500"/> {t('manualOrScan')}</Label>
                      <div className="w-full sm:w-1/3"><ScanButton onScanComplete={handleScanComplete} /></div>
                  </div>
                  <Textarea id="bulk-input" placeholder={t('bulkInputPlaceholder')} value={bulkText} onChange={(e) => setBulkText(e.target.value)} rows={4} className="border-emerald-500/20 focus-visible:ring-emerald-500" />
                  <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{__html: t('bulkInputHelp')}}></p>
              {validatedLines.length > 0 && (<div className="border border-emerald-500/20 rounded-md p-2 space-y-1 max-h-32 overflow-y-auto">{validatedLines.map((v, i) => (<div key={i} className={`flex items-center gap-2 text-xs ${!v.isValid ? 'text-destructive' : 'text-emerald-600'}`}>{v.isValid ? <CheckCircle2 className="h-3 w-3"/> : <XCircle className="h-3 w-3"/>}<span className="font-mono flex-1 truncate">{v.line}</span>{!v.isValid && <span className="font-semibold">{v.error}</span>}</div>))}</div>)}
              <Button onClick={handleBulkAdd} className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={validatedLines.some(v => !v.isValid) || validatedLines.length === 0}>{t('addOrders')}</Button></div>
            </CardContent>
          ) : (
             <CardContent className="text-center py-6 text-muted-foreground"><Lock className="mx-auto h-8 w-8 mb-2 opacity-30"/> {t('min2Participants')}</CardContent>
          )}
        </Card>

        {/* TAHAP 3 */}
        <Card className={`border-l-4 transition-all duration-300 ${isStep3Unlocked ? 'border-l-orange-500 shadow-sm' : 'border-l-gray-300 opacity-60'}`}>
          <CardHeader>
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 w-full">
                <CardTitle className="flex items-center gap-3"><span className={`${isStep3Unlocked ? 'bg-orange-500 shadow-sm' : 'bg-gray-400'} text-white rounded-full w-6 h-6 flex items-center justify-center text-sm`}>3</span> {t('step3Title')}</CardTitle>
                {isStep3Unlocked && unassignedCount > 0 && <span className="text-xs font-bold bg-destructive/10 text-destructive border border-destructive/30 px-3 py-1 rounded-full animate-pulse">{unassignedCount} {t('unassignedItemsAlert')}</span>}
             </div>
          </CardHeader>
          {isStep3Unlocked ? (
            <CardContent className="space-y-2">
              <AnimatePresence>{items.map(item => {
                const isUnassigned = item.sharedBy.length === 0;
                return (
                  <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20, transition: {duration: 0.2} }}><div className={`flex items-center justify-between p-2 rounded-md transition-colors ${isUnassigned ? 'bg-destructive/5 border border-destructive/40' : 'hover:bg-muted/50 border border-transparent'}`}><div className="flex-1 min-w-0"><p className="font-medium text-sm truncate" title={`${item.description} (x${item.quantity})`}>{item.description} (x{item.quantity})</p><p className="text-sm font-mono text-muted-foreground">{formatRupiah(item.price * item.quantity)}</p></div><div className="flex items-center gap-1 ml-2"><ParticipantTagList item={item} sessionParticipants={sessionParticipants} />{isMobile ? (<><TagParticipantDialog item={item} sessionParticipants={sessionParticipants} onTag={handleTagParticipant}><Button variant={isUnassigned ? "default" : "secondary"} size="sm" className={`h-8 px-2 ${isUnassigned ? 'bg-orange-500 hover:bg-orange-600' : ''}`}><UserPlus className="h-4 w-4" /></Button></TagParticipantDialog><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={(e) => e.preventDefault()}><ItemDiscountDialog item={item} onSave={handleItemDiscount}><div className="flex items-center w-full"><Percent className="mr-2 h-4 w-4"/> {t('giveDiscount')}</div></ItemDiscountDialog></DropdownMenuItem><DropdownMenuItem onSelect={(e) => e.preventDefault()}><EditItemDialog item={item} onSave={handleEditItem}><div className="flex items-center w-full"><Pencil className="mr-2 h-4 w-4"/> {t('editItem')}</div></EditItemDialog></DropdownMenuItem><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive"><ConfirmationDialog title={t('deleteItemConfirmTitle')} description={t('deleteItemConfirmDesc')} onConfirm={() => removeItem(item.id)}><div className="flex items-center w-full"><Trash2 className="mr-2 h-4 w-4"/> {t('deleteItem')}</div></ConfirmationDialog></DropdownMenuItem></DropdownMenuContent></DropdownMenu></>) : (<><ItemDiscountDialog item={item} onSave={handleItemDiscount}><Button variant={item.discount.value > 0 ? "secondary" : "ghost"} size="icon" className="h-8 w-8"><Percent className="h-4 w-4" /></Button></ItemDiscountDialog><TagParticipantDialog item={item} sessionParticipants={sessionParticipants} onTag={handleTagParticipant}><Button variant={isUnassigned ? "default" : "outline"} size="sm" className={`h-8 ${isUnassigned ? 'bg-orange-500 hover:bg-orange-600' : ''}`}><UserPlus className="h-4 w-4 mr-1" /> {isUnassigned ? t('assign') : t('edit')}</Button></TagParticipantDialog><EditItemDialog item={item} onSave={handleEditItem}><Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4 text-blue-600" /></Button></EditItemDialog><ConfirmationDialog title={t('deleteItemConfirmTitle')} description={t('deleteItemConfirmDesc')} onConfirm={() => removeItem(item.id)}><Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4 text-destructive" /></Button></ConfirmationDialog></>)}</div></div></motion.div>
                );
              })}</AnimatePresence>
            </CardContent>
          ) : (
            <CardContent className="text-center py-6 text-muted-foreground"><Lock className="mx-auto h-8 w-8 mb-2 opacity-30"/> {t('min2Orders')}</CardContent>
          )}
        </Card>

        {/* TAHAP 4 */}
        <div className={`space-y-6 transition-all duration-300 ${!isStep4Unlocked ? 'opacity-50 pointer-events-none grayscale-[50%]' : ''}`}>
          <Card className={`border-l-4 ${isStep4Unlocked ? 'border-l-purple-500 shadow-sm' : 'border-l-gray-300'}`}>
            <CardHeader><CardTitle className="flex items-center gap-3"><span className={`${isStep4Unlocked ? 'bg-purple-500 shadow-sm' : 'bg-gray-400'} text-white rounded-full w-6 h-6 flex items-center justify-center text-sm`}>4</span> {t('step4Title')}</CardTitle></CardHeader>
            {!isStep4Unlocked ? (
              <CardContent className="text-center py-6 text-muted-foreground"><Lock className="mx-auto h-8 w-8 mb-2 opacity-30"/> {t('step4LockAlert')}</CardContent>
            ) : (
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><div className="space-y-2"><Label htmlFor="ppn" className="text-xs">{t('ppn')}</Label><Input id="ppn" type="number" placeholder="0" value={ppn} onChange={e => setPpn(e.target.value)} /></div><div className="space-y-2"><Label className="text-xs">{t('serviceTax')}</Label><div className="flex items-center gap-2"><RadioGroup value={serviceTaxType} onValueChange={(v: 'amount' | 'percentage') => setServiceTaxType(v)} className="flex"><div className="flex items-center space-x-1.5"><RadioGroupItem value="percentage" id="st-percentage" /><Label htmlFor="st-percentage" className="text-xs font-normal">%</Label></div><div className="flex items-center space-x-1.5"><RadioGroupItem value="amount" id="st-amount" /><Label htmlFor="st-amount" className="text-xs font-normal">Rp</Label></div></RadioGroup><Input type={serviceTaxType === 'percentage' ? 'number' : 'text'} inputMode="decimal" placeholder="0" value={serviceTaxValue} onChange={serviceTaxType === 'percentage' ? e => setServiceTaxValue(e.target.value) : handleAmountChange(setServiceTaxValue)} /></div></div><div className="space-y-2"><Label htmlFor="deliveryFee" className="text-xs">{t('deliveryFee')}</Label><Input id="deliveryFee" type="text" inputMode="decimal" placeholder="0" value={deliveryFee} onChange={handleAmountChange(setDeliveryFee)} /></div><div className="space-y-2"><Label className="text-xs">{t('globalDiscount')}</Label><div className="flex items-center gap-2"><RadioGroup value={globalDiscountType} onValueChange={(v: 'amount' | 'percentage') => setGlobalDiscountType(v)} className="flex"><div className="flex items-center space-x-1.5"><RadioGroupItem value="percentage" id="gd-percentage" /><Label htmlFor="gd-percentage" className="text-xs font-normal">%</Label></div><div className="flex items-center space-x-1.5"><RadioGroupItem value="amount" id="gd-amount" /><Label htmlFor="gd-amount" className="text-xs font-normal">Rp</Label></div></RadioGroup><Input type={globalDiscountType === 'percentage' ? 'number' : 'text'} inputMode="decimal" placeholder="0" value={globalDiscountValue} onChange={globalDiscountType === 'percentage' ? e => setGlobalDiscountValue(e.target.value) : handleAmountChange(setGlobalDiscountValue)} /></div></div></CardContent>
            )}
          </Card>

          {isStep4Unlocked && summary && sessionParticipants.length > 0 && (
            <div className="space-y-6">
              <Card><CardHeader><CardTitle>{t('visualization')}</CardTitle></CardHeader><CardContent className="h-80 w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={summary.participants} dataKey="totalToPay" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0, index = 0 }) => { const RADIAN = Math.PI / 180; const radius = (innerRadius as number) + ((outerRadius as number) - (innerRadius as number)) * 1.2; const x = (cx as number) + radius * Math.cos(-(midAngle as number) * RADIAN); const y = (cy as number) + radius * Math.sin(-(midAngle as number) * RADIAN); return ( <text x={x} y={y} fill="currentColor" textAnchor={x > (cx as number) ? 'start' : 'end'} dominantBaseline="central" className="text-xs fill-foreground"> {`${summary.participants[index as number]?.name} (${((percent as number) * 100).toFixed(0)}%)`} </text> ); }}>{summary.participants.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><RechartsTooltip formatter={(value) => formatRupiah(value as number)} contentStyle={{ backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }} /><Legend /></PieChart></ResponsiveContainer></CardContent></Card>
              <div className="grid lg:grid-cols-2 gap-4">
                  <div className="space-y-4"><Card><CardHeader><CardTitle className="flex items-center gap-3"><Sparkles className="h-6 w-6"/> {t('simplification')}</CardTitle></CardHeader><CardContent className="grid sm:grid-cols-2 gap-4"><div className="space-y-2"><Label>{t('rounding')}</Label><Select onValueChange={(val) => setRounding(parseInt(val))} defaultValue="0"><SelectTrigger><SelectValue placeholder={t('chooseRounding')} /></SelectTrigger><SelectContent><SelectItem value="0">{t('roundingNone')}</SelectItem><SelectItem value="100">{t('rounding100')}</SelectItem><SelectItem value="500">{t('rounding500')}</SelectItem><SelectItem value="1000">{t('rounding1000')}</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>{t('whoPaid')}</Label><Select onValueChange={(id) => setPayerId(id === 'none' ? undefined : id)} value={payerId}><SelectTrigger><SelectValue placeholder={t('choosePayer')} /></SelectTrigger><SelectContent><SelectItem value="none">{t('notDetermined')}</SelectItem>{sessionParticipants.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>{summary.roundingDifference !== 0 && (<p className="sm:col-span-2 text-sm text-muted-foreground">{summary.roundingDifference > 0 ? t('totalTip') : t('totalShortfall')}<span className="font-bold text-primary">{formatRupiah(Math.abs(summary.roundingDifference))}</span></p>)}</CardContent></Card>
                  {summary.transactions.length > 0 && (<Card><CardHeader><CardTitle className="flex items-center gap-3"><Wallet className="h-6 w-6"/> {t('debtDetails')}</CardTitle></CardHeader><CardContent>{summary.transactions.map(tData => { const transactionKey = `${tData.from}-${tData.to}-${tData.amount}`; const isPaid = paidTransactions.has(transactionKey); return (<div key={transactionKey} className="flex items-center gap-2 mb-2"><Checkbox id={transactionKey} checked={isPaid} onCheckedChange={() => handleTogglePaidTransaction(transactionKey)} /><Label htmlFor={transactionKey} className={`text-sm leading-normal ${isPaid ? 'line-through text-muted-foreground' : ''}`}><span className="font-bold">{tData.from}</span> {t('mustPayTo')} <span className="font-bold text-primary">{formatRupiah(tData.amount)}</span> {t('to')} <span className="font-bold">{tData.to}</span></Label></div>) })}</CardContent></Card>)}</div>
                  <div className="space-y-4">
                       <Card><CardHeader><CardTitle className="flex items-center gap-3"><Info className="h-6 w-6"/> {t('grandTotals')}</CardTitle></CardHeader><CardContent className='space-y-2 text-sm'><div className="flex justify-between"><span className="text-muted-foreground">{t('subtotalItem')}</span><span>{formatRupiah(summary.totalItemExpenses)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">{t('ppn')} ({ppnValue}%)</span><span>{formatRupiah(summary.ppnAmount)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">{t('serviceTax')}</span><span>{formatRupiah(summary.serviceTaxAmount)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">{t('deliveryFee')}</span><span>{formatRupiah(summary.deliveryFee)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">{t('globalDiscount')}</span><span className='text-destructive'>-{formatRupiah(globalDiscountDetails.type === 'percentage' ? summary.totalItemExpenses * (globalDiscountDetails.value/100) : globalDiscountDetails.value)}</span></div><Separator /><div className="flex justify-between items-center font-bold"><span className="text-base">{t('totalBill')}</span><span className="text-xl">{formatRupiah(summary.totalBill)}</span></div>{summary.roundingDifference !== 0 && (<div className="flex justify-between items-center font-bold text-primary"><span className="text-base">{t('grandTotal')}</span><span className="text-xl">{formatRupiah(summary.grandTotal)}</span></div>)}</CardContent></Card>
                      <Card className="shadow-lg border-l-4 border-l-purple-500"><CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><CardTitle className="flex items-center gap-3 text-lg"><FileText className="h-5 w-5"/> {t('splitResult')}</CardTitle><SaveResultDialog summary={summary} items={items}><Button variant="outline" size="sm" className="w-full sm:w-auto"><Copy className="mr-2 h-4 w-4" /> {t('shareResult')}</Button></SaveResultDialog></CardHeader><CardContent><Accordion type="multiple" className="w-full">{summary.participants.map(p => (<AccordionItem value={p.id} key={p.id}><AccordionTrigger><div className="flex w-full justify-between items-center pr-4"><span className="font-medium text-sm truncate max-w-[150px]">{p.name}</span><span className="font-bold text-base text-primary whitespace-nowrap ml-2">{formatRupiah(p.totalToPay)}</span></div></AccordionTrigger><AccordionContent className="text-xs space-y-1 pr-4"><div className="flex justify-between"><span className="text-muted-foreground">{t('subtotalItem')}</span><span>{formatRupiah(p.subtotal)}</span></div><Separator className="my-1" /><div className="flex justify-between"><span className="text-muted-foreground">{t('shareOfPPN')} ({ppnValue}%)</span><span className="text-green-600">+{formatRupiah(p.ppnShare)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">{t('shareOfServiceTax')} {serviceTaxDetails.type === 'percentage' ? `(${serviceTaxDetails.value}%)` : ''}</span><span className="text-green-600">+{formatRupiah(p.serviceTaxShare)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">{t('shareOfDeliveryFee')}</span><span className="text-green-600">+{formatRupiah(p.deliveryFeeShare)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">{t('shareOfDiscount')}</span><span className="text-destructive">-{formatRupiah(p.globalDiscountShare + items.filter(i => i.sharedBy.includes(p.id)).reduce((acc, i) => acc + (i.discount.type === 'amount' ? i.discount.value / (i.sharedBy.length || 1) : (i.price * i.quantity * i.discount.value / 100) / (i.sharedBy.length || 1)), 0))}</span></div></AccordionContent></AccordionItem>))}</Accordion></CardContent></Card>
                  </div>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}