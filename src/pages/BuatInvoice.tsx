import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Upload, FileText, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Navbar from '@/components/Navbar';
import { useInvoiceStore } from '@/store/invoiceStore';
import { 
  Invoice, 
  InvoiceItem, 
  generateInvoiceNumber 
} from '@/lib/invoice';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const templates = [
  { id: 'simple', name: 'Simple Professional', description: 'Clean & minimalis' },
  { id: 'elegant', name: 'Elegant Minimalist', description: 'Elegan & modern' },
  { id: 'corporate', name: 'Corporate Clean', description: 'Formal & profesional' },
] as const;

const BuatInvoice = () => {
  const navigate = useNavigate();
  const addInvoice = useInvoiceStore((state) => state.addInvoice);

  const [businessName, setBusinessName] = useState('');
  const [businessLogo, setBusinessLogo] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber());
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', name: '', quantity: 1, price: 0 }
  ]);
  const [tax, setTax] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<'simple' | 'elegant' | 'corporate'>('simple');

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

    const invoice: Invoice = {
      id: Date.now().toString(),
      invoiceNumber,
      businessName,
      businessLogo: businessLogo || undefined,
      clientName,
      clientEmail: clientEmail || undefined,
      invoiceDate,
      dueDate,
      items: validItems,
      tax: tax ? parseFloat(tax) : undefined,
      notes: notes || undefined,
      status: 'unpaid',
      template: selectedTemplate,
      createdAt: new Date().toISOString(),
    };

    addInvoice(invoice);
    toast({ title: 'Mantap! 🎉', description: 'Invoice berhasil dibuat' });
    navigate(`/preview/${invoice.id}`);
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
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Nama Bisnis / Brand *</Label>
                    <Input
                      id="businessName"
                      placeholder="Contoh: Studio Kreatif Gue"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
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
                    <Label htmlFor="clientEmail">Email Klien (Opsional)</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      placeholder="klien@email.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                    />
                  </div>
                </div>
              </section>

              {/* Invoice Details */}
              <section className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card">
                <h2 className="text-lg font-bold text-foreground mb-6">Detail Invoice</h2>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">Nomor Invoice</Label>
                    <Input
                      id="invoiceNumber"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invoiceDate">Tanggal Invoice</Label>
                    <Input
                      id="invoiceDate"
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date *</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
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

                {/* Tax */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="max-w-xs space-y-2">
                    <Label htmlFor="tax">Pajak % (Opsional)</Label>
                    <Input
                      id="tax"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Contoh: 11"
                      value={tax}
                      onChange={(e) => setTax(e.target.value)}
                    />
                  </div>
                </div>
              </section>

              {/* Notes */}
              <section className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card">
                <h2 className="text-lg font-bold text-foreground mb-6">Catatan Tambahan</h2>
                <Textarea
                  placeholder="Contoh: Pembayaran via transfer ke rekening BCA..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </section>

              {/* Template Selection */}
              <section className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card">
                <h2 className="text-lg font-bold text-foreground mb-6">Pilih Template</h2>
                
                <div className="grid md:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedTemplate(template.id)}
                      className={cn(
                        "relative p-4 rounded-xl border-2 text-left transition-all duration-200",
                        selectedTemplate === template.id
                          ? "border-accent bg-accent/5 shadow-glow"
                          : "border-border hover:border-accent/50"
                      )}
                    >
                      {selectedTemplate === template.id && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                          <Check className="w-3 h-3 text-accent-foreground" />
                        </div>
                      )}
                      <h3 className="font-semibold text-foreground mb-1">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
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
