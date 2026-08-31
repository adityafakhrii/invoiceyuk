import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Upload, FileEdit, ArrowRight, CalendarIcon, Phone, Instagram, Mail, Percent, Calculator, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import CurrencyInput from '@/components/CurrencyInput';
import TemplatePreview from '@/components/TemplatePreview';
import SignatureInput from '@/components/SignatureInput';
import { useInvoiceStore } from '@/store/invoiceStore';
import { useAuthStore } from '@/store/authStore';
import {
  Invoice,
  InvoiceItem,
  getSavedBusinessNames,
  saveBusinessName,
  SignatureFont,
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

const generateQuotationNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const suffix = Date.now().toString(36).slice(-5).toUpperCase();
  return `QUO-${year}${month}-${suffix}`;
};

const templates = [
  { id: 'simple', name: 'Simple Professional', description: 'Clean & minimalis' },
  { id: 'elegant', name: 'Elegant Minimalist', description: 'Elegan & modern' },
  { id: 'corporate', name: 'Corporate Clean', description: 'Formal & profesional' },
] as const;

const BuatQuotation = () => {
  const navigate = useNavigate();
  const addInvoice = useInvoiceStore((state) => state.addInvoice);
  const { user } = useAuthStore();

  // Business info
  const [businessName, setBusinessName] = useState('');
  const [businessLogo, setBusinessLogo] = useState<string>('');
  const [savedNames, setSavedNames] = useState<string[]>([]);
  const [showSavedNames, setShowSavedNames] = useState(false);

  // Client info
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientAddress, setClientAddress] = useState('');

  // Quotation details
  const [quotationNumber, setQuotationNumber] = useState(generateQuotationNumber());
  const [quotationDate, setQuotationDate] = useState<Date>(new Date());
  const [validUntil, setValidUntil] = useState<Date | undefined>();

  // Items
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', name: '', quantity: 1, price: 0 }
  ]);
  const [tax, setTax] = useState<string>('');
  const [taxType, setTaxType] = useState<TaxType>('addition');
  const [targetNet, setTargetNet] = useState<number>(0);
  const [notes, setNotes] = useState('Penawaran harga ini berlaku sampai tanggal yang tertera. Harga dapat berubah tanpa pemberitahuan terlebih dahulu.');

  // Signature
  const [signatureName, setSignatureName] = useState('');
  const [signatureImage, setSignatureImage] = useState<string>('');
  const [signatureFont, setSignatureFont] = useState<SignatureFont>('dancing');

  // Social media
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [email, setEmail] = useState('');

  // Template
  const [selectedTemplate, setSelectedTemplate] = useState<'simple' | 'elegant' | 'corporate'>('simple');

  useEffect(() => {
    setSavedNames(getSavedBusinessNames());
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!businessName.trim()) {
      toast({ title: 'Oops!', description: 'Nama bisnis wajib diisi ya', variant: 'destructive' });
      return;
    }

    if (!clientName.trim()) {
      toast({ title: 'Oops!', description: 'Nama klien wajib diisi ya', variant: 'destructive' });
      return;
    }

    // validUntil is optional

    const validItems = items.filter((item) => item.name.trim() && item.price > 0);
    if (validItems.length === 0) {
      toast({ title: 'Oops!', description: 'Minimal ada 1 item dengan nama & harga ya', variant: 'destructive' });
      return;
    }

    // Save business name for future use
    saveBusinessName(businessName);
    setSavedNames(getSavedBusinessNames());

    const taxNum = tax ? parseFloat(tax) : undefined;

    const quotation: Invoice = {
      id: Date.now().toString(),
      invoiceNumber: quotationNumber, // Using invoiceNumber field for quotation number
      businessName,
      businessLogo: businessLogo || undefined,
      clientName,
      clientContact: clientContact || undefined,
      clientAddress: clientAddress || undefined,
      invoiceDate: format(quotationDate, 'yyyy-MM-dd'),
      dueDate: validUntil ? format(validUntil, 'yyyy-MM-dd') : undefined, // Using dueDate for validUntil
      items: validItems,
      tax: taxNum !== undefined && taxNum > 0 ? taxNum : undefined,
      taxType: taxNum !== undefined && taxNum > 0 ? taxType : undefined,
      notes: notes || undefined,
      signatureName: signatureName || undefined,
      signatureImage: signatureImage || undefined,
      signatureFont: signatureFont,
      socialMedia: (whatsapp || instagram || email) ? {
        whatsapp: whatsapp || undefined,
        instagram: instagram || undefined,
        email: email || undefined,
      } : undefined,
      status: 'unpaid', // For quotation, this represents "pending"
      template: selectedTemplate,
      currency: 'IDR',
      createdAt: new Date().toISOString(),
    };

    if (user) {
      try {
        const newId = await addInvoice(quotation, user.id);
        toast({ title: 'Mantap!', description: 'Quotation berhasil dibuat' });
        if (newId) {
          navigate(`/preview/${newId}`);
        } else {
          navigate(`/preview/${quotation.id}`);
        }
      } catch (err) {
        toast({ title: 'Gagal membuat quotation', description: (err as Error).message || 'Terjadi kesalahan.', variant: 'destructive' });
      }
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
                Buat Quotation Baru
              </h1>
              <p className="text-navy-700 font-semibold text-sm">
                Isi form di bawah untuk membuat penawaran harga resmi
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Business Info */}
              <section className="bg-card rounded-xl border-2 border-primary p-6 md:p-8 shadow-neo">
                <h2 className="text-xl font-black text-primary mb-6 flex items-center gap-2 uppercase tracking-tight">
                  <FileEdit className="w-5 h-5 text-accent" />
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
                    />
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
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                          <img src={businessLogo} alt="Logo" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setBusinessLogo('')}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs"
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
              </section>

              {/* Client Info */}
              <section className="bg-card rounded-xl border-2 border-primary p-6 md:p-8 shadow-neo">
                <h2 className="text-xl font-black text-primary mb-6 uppercase tracking-tight">Info Klien Potensial</h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Nama Klien *</Label>
                    <Input
                      id="clientName"
                      placeholder="Contoh: PT. Klien Keren"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
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

              {/* Quotation Details */}
              <section className="bg-card rounded-xl border-2 border-primary p-6 md:p-8 shadow-neo">
                <h2 className="text-xl font-black text-primary mb-6 uppercase tracking-tight">Detail Quotation</h2>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="quotationNumber">Nomor Quotation</Label>
                    <Input
                      id="quotationNumber"
                      value={quotationNumber}
                      onChange={(e) => setQuotationNumber(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tanggal Quotation</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !quotationDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {quotationDate ? format(quotationDate, "dd/MM/yyyy") : <span>Pilih tanggal</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={quotationDate}
                          onSelect={(date) => date && setQuotationDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Berlaku Sampai (Opsional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !validUntil && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {validUntil ? format(validUntil, "dd/MM/yyyy") : <span>Pilih tanggal</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={validUntil}
                          onSelect={setValidUntil}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </section>

              {/* Items */}
              <section className="bg-card rounded-xl border-2 border-primary p-6 md:p-8 shadow-neo">
                <h2 className="text-xl font-black text-primary mb-6 uppercase tracking-tight">Item / Layanan yang Ditawarkan</h2>

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
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="col-span-6 md:col-span-4 space-y-2">
                        {index === 0 && <Label>Harga (Rp)</Label>}
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={item.price || ''}
                          onChange={(e) => updateItem(item.id, 'price', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="text-muted-foreground hover:text-destructive"
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
                </div>

                {/* Tax & Tax Treatment */}
                <div className="mt-8 pt-6 border-t-2 border-primary/20 space-y-6">
                  <div>
                    <h3 className="text-base font-black text-primary uppercase tracking-tight mb-1 flex items-center gap-2">
                      <Percent className="w-4 h-4 text-accent" />
                      Perhitungan Pajak (Opsional)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Pilih apakah pajak ditambahkan ke quotation (PPN) atau dipotong dari nilai bruto (PPh / Withholding Tax).
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
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />

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
                              const calc = calculateGrossFromNet(targetNet, parseFloat(tax || '0'), 'IDR');
                              return (
                                <div className="space-y-3 bg-card p-3.5 rounded-lg border border-border">
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="text-muted-foreground">Bruto Dihitung:</span>
                                      <p className="font-bold text-foreground text-sm">
                                        {formatCurrency(calc.gross, 'IDR')}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Potongan PPh ({tax}%):</span>
                                      <p className="font-bold text-destructive text-sm">
                                        - {formatCurrency(calc.taxAmount, 'IDR')}
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
                                          description: `Harga ${updated[0].name || 'Item 1'} diubah menjadi ${formatCurrency(calc.gross, 'IDR')}`,
                                        });
                                      }
                                    }}
                                    className="w-full text-xs font-bold gap-1.5"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Terapkan Bruto ({formatCurrency(calc.gross, 'IDR')}) ke Item
                                  </Button>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Realtime Summary Preview */}
                  {(() => {
                    const subtotal = calculateSubtotal(items);
                    const taxRate = tax ? parseFloat(tax) : 0;
                    const taxAmt = calculateTaxAmount(subtotal, taxRate, 'IDR');
                    const total = calculateTotal(items, taxRate, taxType, 'IDR');

                    return (
                      <div className="bg-muted/40 rounded-xl p-4 border border-border space-y-2">
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>{taxType === 'withholding' ? 'Subtotal / Bruto :' : 'Subtotal :'}</span>
                          <span className="font-semibold text-foreground">{formatCurrency(subtotal, 'IDR')}</span>
                        </div>

                        {taxRate > 0 && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">
                              {taxType === 'withholding' ? `PPh (${taxRate}%) Dipotong :` : `Pajak (${taxRate}%) Ditambahkan :`}
                            </span>
                            <span className={cn("font-semibold", taxType === 'withholding' ? "text-destructive" : "text-foreground")}>
                              {taxType === 'withholding' ? `- ${formatCurrency(taxAmt, 'IDR')}` : `+ ${formatCurrency(taxAmt, 'IDR')}`}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-sm font-black text-primary border-t border-border pt-2 mt-2">
                          <span>{taxType === 'withholding' ? 'TOTAL DIBAYARKAN :' : 'TOTAL QUOTATION :'}</span>
                          <span className="text-base">{formatCurrency(total, 'IDR')}</span>
                        </div>
                      </div>
                    );
                  })()}
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
                <h2 className="text-xl font-black text-primary mb-6 uppercase tracking-tight">Sosial Media (Footer Quotation)</h2>

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
                <h2 className="text-xl font-black text-primary mb-6 uppercase tracking-tight">Syarat & Ketentuan</h2>
                <Textarea
                  placeholder="Contoh: Penawaran harga ini berlaku sampai..."
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

              {/* Submit Button */}
              <div className="flex justify-center pt-4">
                <Button type="submit" variant="hero" size="xl">
                  Buat Quotation
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuatQuotation;
