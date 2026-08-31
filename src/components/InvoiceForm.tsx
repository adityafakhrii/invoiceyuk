import { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, FileText, ArrowRight, CalendarIcon, Phone, Instagram, Mail, Percent, Loader2, Calculator, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CurrencyInput from '@/components/CurrencyInput';
import TemplatePreview from '@/components/TemplatePreview';
import SignatureInput from '@/components/SignatureInput';
import { useAuthStore } from '@/store/authStore';
import {
  Invoice,
  InvoiceItem,
  generateInvoiceNumber,
  getSavedBusinessNames,
  saveBusinessName,
  getSavedCategories,
  saveCategory,
  SignatureFont,
  CurrencyCode,
  CURRENCIES,
  isValidCurrencyCode,
  TaxType,
  calculateSubtotal,
  calculateTaxAmount,
  calculateTotal,
  calculateGrossFromNet,
  formatCurrency,
} from '@/lib/invoice';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const templates = [
  { id: 'simple', name: 'Simple Professional', description: 'Clean & minimalis' },
  { id: 'elegant', name: 'Elegant Minimalist', description: 'Elegan & modern' },
  { id: 'corporate', name: 'Corporate Clean', description: 'Formal & profesional' },
] as const;

interface InvoiceFormProps {
  title: string;
  submitButtonText: string;
  initialData?: Invoice;
  isDuplicate?: boolean;
  onSubmit: (formData: Omit<Invoice, 'id' | 'createdAt' | 'status'>) => Promise<void>;
}

const InvoiceForm = ({
  title,
  submitButtonText,
  initialData,
  isDuplicate = false,
  onSubmit,
}: InvoiceFormProps) => {
  const { user } = useAuthStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Business info
  const [businessName, setBusinessName] = useState('');
  const [businessLogo, setBusinessLogo] = useState<string>('');
  const [savedNames, setSavedNames] = useState<string[]>([]);
  const [showSavedNames, setShowSavedNames] = useState(false);
  const [category, setCategory] = useState('');
  const [savedCategories, setSavedCategories] = useState<string[]>([]);
  const [showSavedCategories, setShowSavedCategories] = useState(false);

  // Client info
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientAddress, setClientAddress] = useState('');

  // Invoice details
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>();

  // Items & Tax
  const [items, setItems] = useState<InvoiceItem[]>([{ id: '1', name: '', quantity: 1, price: 0 }]);
  const [tax, setTax] = useState<string>('');
  const [taxType, setTaxType] = useState<TaxType>('addition');
  const [targetNet, setTargetNet] = useState<number>(0);
  const [showNetCalculator, setShowNetCalculator] = useState<boolean>(false);
  const [notes, setNotes] = useState('');
  const [enableDP, setEnableDP] = useState(false);
  const [dpType, setDpType] = useState<'amount' | 'percent'>('amount');
  const [downPayment, setDownPayment] = useState<number>(0);
  const [dpPercent, setDpPercent] = useState<number>(0);

  // Payment info
  const [paymentMethod, setPaymentMethod] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  // Signature
  const [signatureName, setSignatureName] = useState('');
  const [signatureImage, setSignatureImage] = useState<string>('');
  const [signatureFont, setSignatureFont] = useState<SignatureFont>('dancing');

  // Social media
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [email, setEmail] = useState('');

  // Template & Currency
  const [selectedTemplate, setSelectedTemplate] = useState<'simple' | 'elegant' | 'corporate'>('simple');
  const [currency, setCurrency] = useState<CurrencyCode>('IDR');

  // Populate data when initialData or user changes
  useEffect(() => {
    if (initialData) {
      setBusinessName(initialData.businessName || '');
      setBusinessLogo(initialData.businessLogo || '');
      setClientName(initialData.clientName || '');
      setClientContact(initialData.clientContact || '');
      setClientAddress(initialData.clientAddress || '');
      setInvoiceNumber(isDuplicate ? generateInvoiceNumber() : initialData.invoiceNumber || '');
      setInvoiceDate(initialData.invoiceDate ? new Date(initialData.invoiceDate) : new Date());
      setDueDate(initialData.dueDate ? new Date(initialData.dueDate) : undefined);
      setItems(initialData.items?.map((item, i) => ({ ...item, id: String(i + 1) })) || [{ id: '1', name: '', quantity: 1, price: 0 }]);
      setTax(initialData.tax ? String(initialData.tax) : '');
      setTaxType(initialData.taxType || 'addition');
      setNotes(initialData.notes || '');
      setPaymentMethod(initialData.paymentInfo?.method || '');
      setAccountName(initialData.paymentInfo?.accountName || '');
      setAccountNumber(initialData.paymentInfo?.accountNumber || '');
      setSignatureName(initialData.signatureName || '');
      setSignatureImage(initialData.signatureImage || '');
      setSignatureFont(initialData.signatureFont || 'dancing');
      setWhatsapp(initialData.socialMedia?.whatsapp || '');
      setInstagram(initialData.socialMedia?.instagram || '');
      setEmail(initialData.socialMedia?.email || '');
      setSelectedTemplate(initialData.template || 'simple');
      setCurrency(initialData.currency || 'IDR');
      setEnableDP(!!initialData.downPayment);
      setDpType(initialData.dpType || 'amount');
      setDownPayment(initialData.downPayment || 0);
      setDpPercent(initialData.dpPercent || 0);
      setCategory(initialData.category || '');
    } else {
      setInvoiceNumber(generateInvoiceNumber());
      if (user) {
        const saved = localStorage.getItem(`default-currency-${user.id}`);
        if (saved && isValidCurrencyCode(saved)) setCurrency(saved);
      }
    }
  }, [initialData, user, isDuplicate]);

  useEffect(() => {
    setSavedNames(getSavedBusinessNames());
    setSavedCategories(getSavedCategories());
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBusinessLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), name: '', quantity: 1, price: 0 }
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleBusinessNameChange = (value: string) => {
    setBusinessName(value);
    setShowSavedNames(value.length > 0 && savedNames.some(n => n.toLowerCase().includes(value.toLowerCase())));
  };

  const selectBusinessName = (name: string) => {
    setBusinessName(name);
    setShowSavedNames(false);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setShowSavedCategories(value.length > 0 && savedCategories.some(c => c.toLowerCase().includes(value.toLowerCase())));
  };

  const selectCategory = (cat: string) => {
    setCategory(cat);
    setShowSavedCategories(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!businessName.trim()) {
      newErrors.businessName = 'Nama bisnis wajib diisi';
    }

    if (!clientName.trim()) {
      newErrors.clientName = 'Nama klien wajib diisi';
    }



    const validItems = items.filter((item) => item.name.trim() && item.price > 0);
    if (validItems.length === 0) {
      newErrors.items = 'Minimal ada 1 item dengan nama & harga yang diisi';
    }

    const taxNum = tax ? parseFloat(tax) : undefined;
    if (tax && (taxNum === undefined || isNaN(taxNum) || taxNum < 0)) {
      newErrors.tax = 'Persentase pajak tidak boleh bernilai negatif';
    } else if (taxNum !== undefined && taxNum > 100) {
      newErrors.tax = 'Persentase pajak maksimal 100%';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: 'Formulir belum lengkap',
        description: 'Periksa kembali isian formulir Anda.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Save business name and category for future use
      saveBusinessName(businessName);
      setSavedNames(getSavedBusinessNames());
      if (category.trim()) {
        saveCategory(category);
        setSavedCategories(getSavedCategories());
      }

      await onSubmit({
        invoiceNumber,
        businessName,
        businessLogo: businessLogo || undefined,
        clientName,
        clientContact: clientContact || undefined,
        clientAddress: clientAddress || undefined,
        invoiceDate: format(invoiceDate, 'yyyy-MM-dd'),
        dueDate: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
        items: validItems,
        tax: taxNum !== undefined && taxNum > 0 ? taxNum : undefined,
        taxType: taxNum !== undefined && taxNum > 0 ? taxType : undefined,
        notes: notes || undefined,
        paymentInfo: paymentMethod ? {
          method: paymentMethod,
          accountName: accountName,
          accountNumber: accountNumber,
        } : undefined,
        signatureName: signatureName || undefined,
        signatureImage: signatureImage || undefined,
        signatureFont: signatureFont,
        socialMedia: (whatsapp || instagram || email) ? {
          whatsapp: whatsapp || undefined,
          instagram: instagram || undefined,
          email: email || undefined,
        } : undefined,
        template: selectedTemplate,
        currency,
        downPayment: enableDP && downPayment > 0 ? downPayment : undefined,
        dpType: enableDP ? dpType : undefined,
        dpPercent: enableDP && dpPercent > 0 ? dpPercent : undefined,
        category: category.trim() || undefined,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as Error).message || 'Terjadi kesalahan.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="pb-10">
        <div className="w-full">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-4xl font-black text-primary uppercase tracking-tight mb-3">
                {title}
              </h1>
              <p className="text-navy-700 font-semibold text-sm">
                Isi form di bawah, nanti invoice kece siap dikirim ke klien
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Business Info */}
              <section className="bg-card rounded-xl border-2 border-primary p-6 md:p-8 shadow-neo">
                <h2 className="text-xl font-black text-primary mb-6 flex items-center gap-2 uppercase tracking-tight">
                  <FileText className="w-5 h-5 text-accent" />
                  Info Bisnis Lo
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2 relative">
                    <Label htmlFor="businessName">Nama Bisnis / Brand *</Label>
                    <Input
                      id="businessName"
                      placeholder="Contoh: Studio Kreatif Gue"
                      value={businessName}
                      onChange={(e) => handleBusinessNameChange(e.target.value)}
                      onFocus={() => setShowSavedNames(savedNames.length > 0)}
                      onBlur={() => setTimeout(() => setShowSavedNames(false), 200)}
                      className={cn(errors.businessName && "border-destructive focus-visible:border-destructive focus-visible:shadow-[3px_3px_0px_0px_rgba(239,68,68,0.2)]")}
                    />
                    {errors.businessName && <p className="text-xs text-destructive mt-1 font-bold">{errors.businessName}</p>}
                    {showSavedNames && savedNames.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {savedNames
                          .filter(n => n.toLowerCase().includes(businessName.toLowerCase()))
                          .map((name, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => selectBusinessName(name)}
                              className="w-full text-left px-4 py-2 hover:bg-muted text-sm text-foreground"
                            >
                              {name}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Logo (Opsional)</Label>
                    <div className="flex items-center gap-4">
                      {businessLogo ? (
                        <div className="relative p-1 rounded-lg border border-border bg-muted/20 flex items-center justify-center">
                          <img src={businessLogo} alt="Logo" className="max-h-16 max-w-[160px] w-auto h-auto object-contain rounded" />
                          <button
                            type="button"
                            onClick={() => setBusinessLogo('')}
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs shadow-sm hover:scale-110 transition-transform"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-border hover:border-accent cursor-pointer transition-colors">
                          <Upload className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Upload Logo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-2 relative">
                  <Label htmlFor="category">Kategori Invoice (Opsional)</Label>
                  <Input
                    id="category"
                    placeholder="Contoh: Desain Grafis, Konsultasi, Fotografi"
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    onFocus={() => setShowSavedCategories(savedCategories.length > 0 && category.length === 0 ? true : savedCategories.some(c => c.toLowerCase().includes(category.toLowerCase())))}
                    onBlur={() => setTimeout(() => setShowSavedCategories(false), 200)}
                  />
                  {showSavedCategories && savedCategories.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {savedCategories
                        .filter(c => category.length === 0 || c.toLowerCase().includes(category.toLowerCase()))
                        .map((cat, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => selectCategory(cat)}
                            className="w-full text-left px-4 py-2 hover:bg-muted text-sm text-foreground"
                          >
                            {cat}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Client Info */}
              <section className="bg-card rounded-xl border-2 border-primary p-6 md:p-8 shadow-neo">
                <h2 className="text-xl font-black text-primary mb-6 uppercase tracking-tight">Info Klien</h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Nama Klien *</Label>
                    <Input
                      id="clientName"
                      placeholder="Contoh: PT. Klien Keren"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className={cn(errors.clientName && "border-destructive focus-visible:border-destructive focus-visible:shadow-[3px_3px_0px_0px_rgba(239,68,68,0.2)]")}
                    />
                    {errors.clientName && <p className="text-xs text-destructive mt-1 font-bold">{errors.clientName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientContact">Kontak (Opsional)</Label>
                    <Input
                      id="clientContact"
                      placeholder="Contoh: 08123456789"
                      value={clientContact}
                      onChange={(e) => setClientContact(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="clientAddress">Alamat (Opsional)</Label>
                    <Textarea
                      id="clientAddress"
                      placeholder="Contoh: Jl. Sudirman No. 123, Jakarta"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </section>

              {/* Invoice Details */}
              <section className="bg-card rounded-xl border-2 border-primary p-6 md:p-8 shadow-neo">
                <h2 className="text-xl font-black text-primary mb-6 uppercase tracking-tight">Detail Invoice</h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">Nomor Invoice</Label>
                    <Input
                      id="invoiceNumber"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Mata Uang</Label>
                    <Select value={currency} onValueChange={(v) => isValidCurrencyCode(v) && setCurrency(v)}>
                      <SelectTrigger className="w-full h-11">
                        <SelectValue placeholder="Pilih Mata Uang" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tanggal Invoice</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "flex h-11 w-full items-center justify-start rounded-none border-2 border-primary bg-background px-4 py-2 text-sm font-semibold text-foreground ring-offset-background placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:shadow-[3px_3px_0px_0px_hsl(var(--accent))] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150",
                            !invoiceDate && "text-muted-foreground/60"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {invoiceDate ? format(invoiceDate, "dd/MM/yyyy") : <span>Pilih tanggal</span>}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={invoiceDate}
                          onSelect={(date) => date && setInvoiceDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Due Date (Opsional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "flex h-11 w-full items-center justify-start rounded-none border-2 border-primary bg-background px-4 py-2 text-sm font-semibold text-foreground ring-offset-background placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:shadow-[3px_3px_0px_0px_hsl(var(--accent))] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150",
                            !dueDate && "text-muted-foreground/60",
                            errors.dueDate && "border-destructive focus:border-destructive focus:shadow-[3px_3px_0px_0px_rgba(239,68,68,0.2)]"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, "dd/MM/yyyy") : <span>Pilih tanggal</span>}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={setDueDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.dueDate && <p className="text-xs text-destructive mt-1 font-bold">{errors.dueDate}</p>}
                  </div>
                </div>
              </section>

              {/* Items */}
              <section className="bg-card rounded-xl border-2 border-primary p-6 md:p-8 shadow-neo">
                <h2 className="text-xl font-black text-primary mb-6 uppercase tracking-tight">Item / Layanan</h2>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-12 md:col-span-5 space-y-2">
                        {index === 0 && <Label>Nama Item</Label>}
                        <Input
                          placeholder="Contoh: Desain Logo"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        />
                      </div>
                      <div className="col-span-4 md:col-span-2 space-y-2">
                        {index === 0 && <Label>Qty</Label>}
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            updateItem(item.id, 'quantity', parseInt(val) || 1);
                          }}
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <div className="col-span-6 md:col-span-4 space-y-2">
                        {index === 0 && <Label>Harga</Label>}
                        <CurrencyInput
                          value={item.price}
                          onChange={(val) => updateItem(item.id, 'price', val)}
                          placeholder="0"
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline-light"
                    onClick={addItem}
                    className="w-full mt-4"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Item
                  </Button>
                  {errors.items && <p className="text-xs text-destructive mt-2 font-bold text-center">{errors.items}</p>}
                </div>

                {/* Tax & Tax Treatment */}
                <div className="mt-8 pt-6 border-t-2 border-primary/20 space-y-6">
                  <div>
                    <h3 className="text-base font-black text-primary uppercase tracking-tight mb-1 flex items-center gap-2">
                      <Percent className="w-4 h-4 text-accent" />
                      Perhitungan Pajak (Opsional)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Pilih apakah pajak ditambahkan ke tagihan (PPN) atau dipotong dari nilai bruto (PPh / Withholding Tax).
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 items-start">
                    {/* Tax Percentage */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="tax">Persentase Pajak (%)</Label>
                        {tax && parseFloat(tax) > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setTax('');
                              setTargetNet(0);
                            }}
                            className="text-[11px] text-muted-foreground hover:text-destructive underline"
                          >
                            Hapus Pajak
                          </button>
                        )}
                      </div>
                      <Input
                        id="tax"
                        type="text"
                        inputMode="decimal"
                        placeholder="Contoh: 11 atau 2.5"
                        value={tax}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^\d.]/g, '');
                          setTax(val);
                        }}
                        className={cn(
                          "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                          errors.tax && "border-destructive"
                        )}
                      />
                      {errors.tax && <p className="text-xs text-destructive font-bold">{errors.tax}</p>}

                      {/* Quick Presets */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[11px] text-muted-foreground self-center mr-1">Preset:</span>
                        {[
                          { label: '11% PPN', val: '11', type: 'addition' as TaxType },
                          { label: '2.5% PPh', val: '2.5', type: 'withholding' as TaxType },
                          { label: '2% PPh 23', val: '2', type: 'withholding' as TaxType },
                          { label: '0.5% UMKM', val: '0.5', type: 'withholding' as TaxType },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setTax(preset.val);
                              setTaxType(preset.type);
                            }}
                            className={cn(
                              "text-xs px-2.5 py-1 rounded-md border font-semibold transition-colors",
                              tax === preset.val && taxType === preset.type
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/40 hover:bg-muted text-foreground border-border"
                            )}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tax Treatment Selection */}
                    <div className="space-y-2">
                      <Label>Perlakuan Pajak</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setTaxType('addition')}
                          className={cn(
                            "p-3 rounded-lg border-2 text-left transition-all",
                            taxType === 'addition'
                              ? "border-primary bg-primary/5 shadow-sm font-bold"
                              : "border-border hover:border-primary/50 text-muted-foreground"
                          )}
                        >
                          <div className="text-xs uppercase tracking-wide font-black text-foreground">
                            Pajak Ditambahkan (+)
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                            Total = Subtotal + Pajak (Contoh: PPN)
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTaxType('withholding')}
                          className={cn(
                            "p-3 rounded-lg border-2 text-left transition-all",
                            taxType === 'withholding'
                              ? "border-primary bg-primary/5 shadow-sm font-bold"
                              : "border-border hover:border-primary/50 text-muted-foreground"
                          )}
                        >
                          <div className="text-xs uppercase tracking-wide font-black text-foreground">
                            Pajak Dipotong / PPh (-)
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                            Total = Bruto - PPh (Withholding)
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Net to Gross Calculator Box (When Withholding Tax is Selected) */}
                  {taxType === 'withholding' && (
                    <div className="bg-muted/30 border-2 border-dashed border-primary/40 rounded-xl p-4 md:p-5 space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <Calculator className="w-4 h-4 text-accent" />
                            <h4 className="text-sm font-black text-primary uppercase">
                              Kalkulator Target Bersih (NET &rarr; BRUTO)
                            </h4>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Jika Anda ingin menerima nominal bersih tertentu, masukkan target NET di bawah untuk menghitung otomatis nominal bruto yang harus ditagih.
                          </p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-6 space-y-1.5">
                          <Label htmlFor="targetNet" className="text-xs font-bold">
                            Nominal yang ingin diterima (NET)
                          </Label>
                          <CurrencyInput
                            value={targetNet}
                            onChange={(val) => setTargetNet(val)}
                            placeholder="Contoh: 1.300.000"
                          />
                        </div>

                        {targetNet > 0 && parseFloat(tax || '0') > 0 && (
                          <div className="md:col-span-6">
                            {(() => {
                              const calc = calculateGrossFromNet(targetNet, parseFloat(tax || '0'), currency);
                              return (
                                <div className="space-y-3 bg-card p-3.5 rounded-lg border border-border">
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="text-muted-foreground">Bruto Dihitung:</span>
                                      <p className="font-bold text-foreground text-sm">
                                        {formatCurrency(calc.gross, currency)}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Potongan PPh ({tax}%):</span>
                                      <p className="font-bold text-destructive text-sm">
                                        - {formatCurrency(calc.taxAmount, currency)}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="default"
                                    onClick={() => {
                                      if (items.length > 0) {
                                        const updated = [...items];
                                        updated[0] = {
                                          ...updated[0],
                                          price: calc.gross,
                                          quantity: updated[0].quantity || 1,
                                        };
                                        setItems(updated);
                                        toast({
                                          title: 'Nominal Bruto Diterapkan!',
                                          description: `Harga ${updated[0].name || 'Item 1'} diubah menjadi ${formatCurrency(calc.gross, currency)}`,
                                        });
                                      }
                                    }}
                                    className="w-full text-xs font-bold gap-1.5"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Terapkan Bruto ({formatCurrency(calc.gross, currency)}) ke Item
                                  </Button>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Realtime Summary Preview inside Items section */}
                  {(() => {
                    const subtotal = calculateSubtotal(items);
                    const taxRate = tax ? parseFloat(tax) : 0;
                    const taxAmt = calculateTaxAmount(subtotal, taxRate, currency);
                    const total = calculateTotal(items, taxRate, taxType, currency);

                    return (
                      <div className="bg-muted/40 rounded-xl p-4 border border-border space-y-2">
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>{taxType === 'withholding' ? 'Subtotal / Bruto :' : 'Subtotal :'}</span>
                          <span className="font-semibold text-foreground">{formatCurrency(subtotal, currency)}</span>
                        </div>

                        {taxRate > 0 && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">
                              {taxType === 'withholding' ? `PPh (${taxRate}%) Dipotong :` : `Pajak (${taxRate}%) Ditambahkan :`}
                            </span>
                            <span className={cn("font-semibold", taxType === 'withholding' ? "text-destructive" : "text-foreground")}>
                              {taxType === 'withholding' ? `- ${formatCurrency(taxAmt, currency)}` : `+ ${formatCurrency(taxAmt, currency)}`}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-sm font-black text-primary border-t border-border pt-2 mt-2">
                          <span>{taxType === 'withholding' ? 'TOTAL DIBAYARKAN :' : 'TOTAL INVOICE :'}</span>
                          <span className="text-base">{formatCurrency(total, currency)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </section>

              {/* Down Payment (DP) */}
              <section className="bg-card rounded-xl border-2 border-primary p-6 md:p-8 shadow-neo">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Percent className="w-5 h-5 text-accent" />
                    Down Payment / DP (Opsional)
                  </h2>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-muted-foreground">{enableDP ? 'Aktif' : 'Nonaktif'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEnableDP(!enableDP);
                        if (enableDP) { setDownPayment(0); setDpPercent(0); }
                      }}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        enableDP ? "bg-primary" : "bg-muted"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          enableDP ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </label>
                </div>

                {enableDP && (
                  <div className="space-y-4">
                    {/* DP Type Toggle */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={dpType === 'amount' ? 'default' : 'outline-light'}
                        size="sm"
                        onClick={() => {
                          setDpType('amount');
                          setDownPayment(0);
                          setDpPercent(0);
                        }}
                      >
                        Rupiah
                      </Button>
                      <Button
                        type="button"
                        variant={dpType === 'percent' ? 'default' : 'outline-light'}
                        size="sm"
                        onClick={() => {
                          setDpType('percent');
                          setDownPayment(0);
                          setDpPercent(0);
                        }}
                      >
                        Persen (%)
                      </Button>
                    </div>

                    {dpType === 'amount' ? (
                      <div className="space-y-2">
                        <Label>Jumlah DP (Rupiah)</Label>
                        <CurrencyInput
                          value={downPayment}
                          onChange={(val) => {
                            setDownPayment(val);
                            const total = calculateTotal(items, tax ? parseFloat(tax) : 0, taxType, currency);
                            setDpPercent(total > 0 ? Math.round((val / total) * 100 * 100) / 100 : 0);
                          }}
                          placeholder="Contoh: 5.000.000"
                        />
                        {dpPercent > 0 && (
                          <p className="text-sm text-accent font-medium">
                            &asymp; {dpPercent}% dari total
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Jumlah DP (%)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={dpPercent || ''}
                          onChange={(e) => {
                            const pct = Math.min(100, Math.max(0, Number(e.target.value)));
                            setDpPercent(pct);
                            const total = calculateTotal(items, tax ? parseFloat(tax) : 0, taxType, currency);
                            setDownPayment(Math.round((total * pct) / 100));
                          }}
                          placeholder="Contoh: 50"
                          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        {downPayment > 0 && (
                          <p className="text-sm text-accent font-medium">
                            &asymp; {formatCurrency(downPayment, currency)}
                          </p>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Sisa tagihan akan otomatis ditampilkan di invoice.
                    </p>
                  </div>
                )}
              </section>

              {/* Payment Info */}
              <section className="bg-card rounded-xl border-2 border-primary p-6 md:p-8 shadow-neo">
                <h2 className="text-xl font-black text-primary mb-6 uppercase tracking-tight">Informasi Pembayaran</h2>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Metode Pembayaran</Label>
                    <Input
                      id="paymentMethod"
                      placeholder="Contoh: GoPay, BCA, Mandiri"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountName">Nama Pemilik Rekening</Label>
                    <Input
                      id="accountName"
                      placeholder="Contoh: Aditya Fakhri"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Nomor Rekening / Akun</Label>
                    <Input
                      id="accountNumber"
                      placeholder="Contoh: 0895 3241 05731"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                    />
                  </div>
                </div>
              </section>

              {/* Signature */}
              <section className="bg-card rounded-xl border-2 border-primary p-6 md:p-8 shadow-neo">
                <h2 className="text-xl font-black text-primary mb-6 uppercase tracking-tight">Tanda Tangan</h2>
                <SignatureInput
                  signatureName={signatureName}
                  onSignatureNameChange={setSignatureName}
                  signatureImage={signatureImage}
                  onSignatureImageChange={setSignatureImage}
                  signatureFont={signatureFont}
                  onSignatureFontChange={setSignatureFont}
                />
              </section>

              {/* Social Media */}
              <section className="bg-card rounded-xl border-2 border-primary p-6 md:p-8 shadow-neo">
                <h2 className="text-xl font-black text-primary mb-6 uppercase tracking-tight">Sosial Media (Footer Invoice)</h2>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      WhatsApp
                    </Label>
                    <Input
                      id="whatsapp"
                      placeholder="+62 812 3456 7890"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram" className="flex items-center gap-2">
                      <Instagram className="w-4 h-4" />
                      Instagram
                    </Label>
                    <Input
                      id="instagram"
                      placeholder="@username"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </section>

              {/* Notes */}
              <section className="bg-card rounded-xl border-2 border-primary p-6 md:p-8 shadow-neo">
                <h2 className="text-xl font-black text-primary mb-6 uppercase tracking-tight">Catatan Tambahan</h2>
                <Textarea
                  placeholder="Contoh: Harap transfer sebelum due date..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </section>

              {/* Template Selection */}
              <section className="bg-card rounded-xl border-2 border-primary p-6 md:p-8 shadow-neo">
                <h2 className="text-xl font-black text-primary mb-6 uppercase tracking-tight">Pilih Template</h2>

                <div className="grid md:grid-cols-3 gap-6">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedTemplate(template.id)}
                      className="text-left"
                    >
                      <TemplatePreview
                        template={template.id}
                        isSelected={selectedTemplate === template.id}
                      />
                      <div className="mt-3 text-center">
                        <h3 className="font-semibold text-foreground">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <div className="flex justify-center pt-4">
                <Button type="submit" variant="default" size="xl" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      {submitButtonText}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;
