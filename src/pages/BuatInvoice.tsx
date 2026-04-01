import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Trash2, Upload, FileText, ArrowRight, CalendarIcon, Phone, Instagram, Mail, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Navbar from '@/components/Navbar';
import CurrencyInput from '@/components/CurrencyInput';
import TemplatePreview from '@/components/TemplatePreview';
import SignatureInput from '@/components/SignatureInput';
import { useInvoiceStore } from '@/store/invoiceStore';
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
} from '@/lib/invoice';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const templates = [
  { id: 'simple', name: 'Simple Professional', description: 'Clean & minimalis' },
  { id: 'elegant', name: 'Elegant Minimalist', description: 'Elegan & modern' },
  { id: 'corporate', name: 'Corporate Clean', description: 'Formal & profesional' },
] as const;

const BuatInvoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const addInvoice = useInvoiceStore((state) => state.addInvoice);
  const { user } = useAuthStore();

  const dup = (location.state as { duplicateFrom?: Invoice })?.duplicateFrom;

  // Business info
  const [businessName, setBusinessName] = useState(dup?.businessName || '');
  const [businessLogo, setBusinessLogo] = useState<string>(dup?.businessLogo || '');
  const [savedNames, setSavedNames] = useState<string[]>([]);
  const [showSavedNames, setShowSavedNames] = useState(false);
  const [category, setCategory] = useState(dup?.category || '');
  const [savedCategories, setSavedCategories] = useState<string[]>([]);
  const [showSavedCategories, setShowSavedCategories] = useState(false);

  // Client info
  const [clientName, setClientName] = useState(dup?.clientName || '');
  const [clientContact, setClientContact] = useState(dup?.clientContact || '');
  const [clientAddress, setClientAddress] = useState(dup?.clientAddress || '');

  // Invoice details
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber());
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>();

  // Items
  const [items, setItems] = useState<InvoiceItem[]>(
    dup?.items?.map((item, i) => ({ ...item, id: String(i + 1) })) || [{ id: '1', name: '', quantity: 1, price: 0 }]
  );
  const [tax, setTax] = useState<string>(dup?.tax ? String(dup.tax) : '');
  const [notes, setNotes] = useState(dup?.notes || '');
  const [enableDP, setEnableDP] = useState(dup?.downPayment ? true : false);
  const [downPayment, setDownPayment] = useState<number>(dup?.downPayment || 0);

  // Payment info
  const [paymentMethod, setPaymentMethod] = useState(dup?.paymentInfo?.method || '');
  const [accountName, setAccountName] = useState(dup?.paymentInfo?.accountName || '');
  const [accountNumber, setAccountNumber] = useState(dup?.paymentInfo?.accountNumber || '');

  // Signature
  const [signatureName, setSignatureName] = useState(dup?.signatureName || '');
  const [signatureImage, setSignatureImage] = useState<string>(dup?.signatureImage || '');
  const [signatureFont, setSignatureFont] = useState<SignatureFont>(dup?.signatureFont || 'dancing');

  // Social media
  const [whatsapp, setWhatsapp] = useState(dup?.socialMedia?.whatsapp || '');
  const [instagram, setInstagram] = useState(dup?.socialMedia?.instagram || '');
  const [email, setEmail] = useState(dup?.socialMedia?.email || '');

  // Template
  const [selectedTemplate, setSelectedTemplate] = useState<'simple' | 'elegant' | 'corporate'>(dup?.template || 'simple');
  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    if (dup?.currency) return dup.currency;
    if (user) {
      const saved = localStorage.getItem(`default-currency-${user.id}`);
      if (saved && ['IDR', 'USD', 'EUR'].includes(saved)) return saved as CurrencyCode;
    }
    return 'IDR';
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!businessName.trim()) {
      toast({ title: 'Oops!', description: 'Nama bisnis wajib diisi ya', variant: 'destructive' });
      return;
    }

    if (!clientName.trim()) {
      toast({ title: 'Oops!', description: 'Nama klien wajib diisi ya', variant: 'destructive' });
      return;
    }

    if (!dueDate) {
      toast({ title: 'Oops!', description: 'Due date wajib diisi ya', variant: 'destructive' });
      return;
    }

    const validItems = items.filter((item) => item.name.trim() && item.price > 0);
    if (validItems.length === 0) {
      toast({ title: 'Oops!', description: 'Minimal ada 1 item dengan nama & harga ya', variant: 'destructive' });
      return;
    }

    // Save business name and category for future use
    saveBusinessName(businessName);
    setSavedNames(getSavedBusinessNames());
    if (category.trim()) {
      saveCategory(category);
      setSavedCategories(getSavedCategories());
    }

    const invoice: Invoice = {
      id: Date.now().toString(),
      invoiceNumber,
      businessName,
      businessLogo: businessLogo || undefined,
      clientName,
      clientContact: clientContact || undefined,
      clientAddress: clientAddress || undefined,
      invoiceDate: invoiceDate.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      items: validItems,
      tax: tax ? parseFloat(tax) : undefined,
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
      status: 'unpaid',
      template: selectedTemplate,
      currency,
      downPayment: enableDP && downPayment > 0 ? downPayment : undefined,
      category: category.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    if (user) {
      addInvoice(invoice, user.id);
      toast({ title: 'Mantap! 🎉', description: 'Invoice berhasil dibuat dan disimpan' });
      navigate('/riwayat');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20 md:pt-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Buat Invoice Baru
              </h1>
              <p className="text-muted-foreground">
                Isi form di bawah, nanti invoice kece siap dikirim ke klien 🚀
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Business Info */}
              <section className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card">
                <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
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
              <section className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card">
                <h2 className="text-lg font-bold text-foreground mb-6">Info Klien</h2>
                
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

              {/* Invoice Details */}
              <section className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card">
                <h2 className="text-lg font-bold text-foreground mb-6">Detail Invoice</h2>
                
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
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tanggal Invoice</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !invoiceDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {invoiceDate ? format(invoiceDate, "dd/MM/yyyy") : <span>Pilih tanggal</span>}
                        </Button>
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
                    <Label>Due Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dueDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, "dd/MM/yyyy") : <span>Pilih tanggal</span>}
                        </Button>
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
                  </div>
                </div>
              </section>

              {/* Items */}
              <section className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card">
                <h2 className="text-lg font-bold text-foreground mb-6">Item / Layanan</h2>
                
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

                {/* Tax & DP */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="tax">Pajak % (Opsional)</Label>
                      <Input
                        id="tax"
                        type="text"
                        inputMode="numeric"
                        placeholder="Contoh: 11"
                        value={tax}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^\d.]/g, '');
                          setTax(val);
                        }}
                        className="max-w-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Down Payment (DP) */}
              <section className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card">
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
                        if (enableDP) setDownPayment(0);
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
                  <div className="space-y-2">
                    <Label>Jumlah DP</Label>
                    <CurrencyInput
                      value={downPayment}
                      onChange={setDownPayment}
                      placeholder="Contoh: 5.000.000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Masukkan jumlah DP yang sudah dibayar klien. Sisa tagihan akan ditampilkan di invoice.
                    </p>
                  </div>
                )}
              </section>

              {/* Payment Info */}
              <section className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card">
                <h2 className="text-lg font-bold text-foreground mb-6">Informasi Pembayaran</h2>
                
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
              <section className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card">
                <h2 className="text-lg font-bold text-foreground mb-6">Tanda Tangan</h2>
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
              <section className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card">
                <h2 className="text-lg font-bold text-foreground mb-6">Sosial Media (Footer Invoice)</h2>
                
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
              <section className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card">
                <h2 className="text-lg font-bold text-foreground mb-6">Catatan Tambahan</h2>
                <Textarea
                  placeholder="Contoh: Harap transfer sebelum due date..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </section>

              {/* Template Selection */}
              <section className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card">
                <h2 className="text-lg font-bold text-foreground mb-6">Pilih Template</h2>
                
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
                  Buat Invoice
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BuatInvoice;
