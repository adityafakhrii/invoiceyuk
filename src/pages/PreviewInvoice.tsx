import { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, Phone, Instagram, Mail, MessageCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useInvoiceStore } from '@/store/invoiceStore';
import {
  formatCurrency,
  formatDate,
  calculateSubtotal,
  calculateTaxAmount,
  calculateTotal,
  signatureFonts,
  INVOICE_TEMPLATE_STYLES,
} from '@/lib/invoice';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const PreviewInvoice = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const getInvoice = useInvoiceStore((state) => state.getInvoice);
  const [waNumber, setWaNumber] = useState('');
  const [waDialogOpen, setWaDialogOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | 'auto'>('auto');

  const invoice = id ? getInvoice(id) : undefined;

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current && invoiceRef.current && invoice) {
        const containerWidth = containerRef.current.getBoundingClientRect().width;
        const targetWidth = 800; // Fixed width matching desktop/A4 preview layout
        
        if (containerWidth < targetWidth) {
          const newScale = containerWidth / targetWidth;
          setScale(newScale);
          
          // Temporarily reset styles to measure the real scroll height
          const originalTransform = invoiceRef.current.style.transform;
          const originalWidth = invoiceRef.current.style.width;
          
          invoiceRef.current.style.transform = 'none';
          invoiceRef.current.style.width = '800px';
          
          const invoiceHeight = invoiceRef.current.getBoundingClientRect().height;
          
          // Re-apply scale
          invoiceRef.current.style.transform = `scale(${newScale})`;
          invoiceRef.current.style.width = '800px';
          
          setHeight(invoiceHeight * newScale);
        } else {
          setScale(1);
          setHeight('auto');
          invoiceRef.current.style.transform = 'none';
          invoiceRef.current.style.width = '100%';
        }
      }
    };

    // Delay slightly to ensure fonts and styles are fully loaded
    const timer = setTimeout(updateScale, 100);

    window.addEventListener('resize', updateScale);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScale);
    };
  }, [invoice]);

  if (!invoice) {
    return (
      <div className="w-full">
        <main className="pt-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Invoice Tidak Ditemukan</h1>
          <p className="text-muted-foreground mb-6">Invoice yang lo cari gak ada nih</p>
          <Link to="/riwayat">
            <Button variant="hero">Ke Riwayat Invoice</Button>
          </Link>
        </main>
      </div>
    );
  }

  const subtotal = calculateSubtotal(invoice.items);
  const taxAmount = calculateTaxAmount(subtotal, invoice.tax, invoice.currency);
  const total = calculateTotal(invoice.items, invoice.tax, invoice.taxType, invoice.currency);
  const dpAmount = invoice.downPayment || 0;
  const dpPercent = invoice.dpPercent || (total > 0 && dpAmount > 0 ? Math.round((dpAmount / total) * 100 * 100) / 100 : 0);
  const remaining = total - dpAmount;

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;

    try {
      toast({ title: 'Generating PDF...', description: 'Tunggu bentar ya' });

      // Save original styles to restore after capture
      const originalTransform = invoiceRef.current.style.transform;
      const originalWidth = invoiceRef.current.style.width;
      let originalContainerHeight = '';
      
      if (containerRef.current) {
        originalContainerHeight = containerRef.current.style.height;
        containerRef.current.style.height = 'auto';
      }

      // Reset scale temporarily for high quality capture
      invoiceRef.current.style.transform = 'none';
      invoiceRef.current.style.width = '800px';

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      // Restore original scaled styles
      invoiceRef.current.style.transform = originalTransform;
      invoiceRef.current.style.width = originalWidth;
      if (containerRef.current && originalContainerHeight) {
        containerRef.current.style.height = originalContainerHeight;
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${invoice.invoiceNumber}.pdf`);

      toast({ title: 'Mantap!', description: 'PDF berhasil didownload' });
    } catch (error) {
      toast({ title: 'Oops!', description: 'Gagal generate PDF', variant: 'destructive' });
    }
  };


  // WhatsApp

  const formatWhatsAppNumber = (num: string): string => {
    let clean = num.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    if (!clean.startsWith('62')) clean = '62' + clean;
    return clean;
  };

  const handleSendWhatsApp = () => {
    const clean = waNumber.replace(/[^0-9+]/g, '');
    if (clean.length < 8) {
      toast({ title: 'Oops!', description: 'Nomor WhatsApp tidak valid', variant: 'destructive' });
      return;
    }

    const formattedNum = formatWhatsAppNumber(clean);
    const isWithholding = invoice.taxType === 'withholding';

    const taxText = invoice.tax && invoice.tax > 0
      ? (isWithholding
          ? `PPh (${invoice.tax}%): -${formatCurrency(taxAmount, invoice.currency)}\n`
          : `Pajak (${invoice.tax}%): +${formatCurrency(taxAmount, invoice.currency)}\n`)
      : '';

    const totalLabel = isWithholding ? 'TOTAL DIBAYARKAN' : 'TOTAL';

    const message = encodeURIComponent(
      `Halo ${invoice.clientName},\n\n` +
      `Berikut invoice dari *${invoice.businessName}*:\n\n` +
      `📄 No: ${invoice.invoiceNumber}\n` +
      `📅 Tanggal: ${formatDate(invoice.invoiceDate)}\n` +
      `⏰ Jatuh Tempo: ${formatDate(invoice.dueDate)}\n\n` +
      `*Detail Item:*\n` +
      invoice.items.map((item, i) => `${i + 1}. ${item.name} (${item.quantity}x) - ${formatCurrency(item.quantity * item.price, invoice.currency)}`).join('\n') +
      `\n\n` +
      `${isWithholding ? 'Subtotal / Bruto' : 'Subtotal'}: ${formatCurrency(subtotal, invoice.currency)}\n` +
      taxText +
      `*${totalLabel}: ${formatCurrency(total, invoice.currency)}*\n` +
      (dpAmount > 0 ? `DP${dpPercent > 0 ? ` (${dpPercent}%)` : ''}: ${formatCurrency(dpAmount, invoice.currency)}\n*SISA: ${formatCurrency(remaining, invoice.currency)}*\n` : '') +
      `\n` +
      (invoice.paymentInfo ? `💳 Pembayaran:\n${invoice.paymentInfo.method}\n${invoice.paymentInfo.accountName}\n${invoice.paymentInfo.accountNumber}\n\n` : '') +
      `Terima kasih! 🙏`
    );

    window.open(`https://wa.me/${formattedNum}?text=${message}`, '_blank');
    setWaDialogOpen(false);
    toast({ title: 'WhatsApp dibuka!', description: 'Pesan invoice siap dikirim ke klien' });
  };

  const styles = INVOICE_TEMPLATE_STYLES[invoice.template || 'simple'];

  // Get signature font style
  const getSignatureFontStyle = () => {
    if (invoice.signatureImage) return {};
    const font = signatureFonts.find(f => f.id === invoice.signatureFont) || signatureFonts[0];
    return { fontFamily: font.fontFamily };
  };

  return (
    <div className="w-full">
      <div className="pb-10">
        <div className="w-full">
          <div className="max-w-4xl mx-auto">
            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 print:hidden">
              <Button variant="ghost" onClick={() => navigate('/riwayat')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Selesai
              </Button>

              <div className="flex gap-3 flex-wrap">
                <Dialog open={waDialogOpen} onOpenChange={(open) => {
                  setWaDialogOpen(open);
                  if (open) setWaNumber(invoice.clientContact || '');
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline-light" className="bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20">
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Kirim Invoice via WhatsApp</DialogTitle>
                      <DialogDescription>
                        Masukkan nomor WhatsApp klien untuk mengirim detail invoice
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="waNumber">Nomor WhatsApp</Label>
                        <Input
                          id="waNumber"
                          placeholder="Contoh: 08123456789"
                          value={waNumber}
                          onChange={(e) => setWaNumber(e.target.value.replace(/[^0-9+\-\s]/g, ''))}
                          maxLength={20}
                        />
                        <p className="text-xs text-muted-foreground">Format: 08xx atau +62xx</p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline-light" onClick={() => setWaDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button onClick={handleSendWhatsApp} className="bg-green-600 hover:bg-green-700 text-white">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Kirim ke WhatsApp
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" onClick={() => navigate(`/edit-invoice/${invoice.id}`)}>
                  <Pencil className="w-4 h-4" />
                  Edit Invoice
                </Button>

                <Button variant="hero" onClick={handleDownloadPDF}>
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </div>
            </div>

            {/* Invoice Preview */}
            <div 
              ref={containerRef}
              className="bg-card rounded-xl border-2 border-primary shadow-neo overflow-hidden print:border-none print:shadow-none print:rounded-none"
              style={{ height: height !== 'auto' ? `${height}px` : 'auto' }}
            >
              <div 
                ref={invoiceRef} 
                className="bg-white print:transform-none"
                style={{
                  width: scale < 1 ? '800px' : '100%',
                  transform: scale < 1 ? `scale(${scale})` : 'none',
                  transformOrigin: 'top left',
                  transition: 'transform 0.1s ease-out'
                }}
              >
                {/* Header */}
                <div className={cn('p-8 md:p-10', styles.headerBg)}>
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex items-center gap-4">
                      {invoice.businessLogo ? (
                        <img
                          src={invoice.businessLogo}
                          alt="Logo"
                          className="max-h-16 max-w-[160px] w-auto h-auto rounded-lg object-contain"
                        />
                      ) : null}
                      <div>
                        <h2 className={cn('text-2xl md:text-3xl font-bold', styles.headerText)}>
                          {invoice.businessName}
                        </h2>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={cn('text-xs font-medium opacity-80', styles.headerText)}>
                        INVOICE
                      </p>
                      <p className={cn('text-base font-semibold', styles.headerText)}>
                        {invoice.invoiceNumber}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-8 md:p-10">
                  {/* Info Grid */}
                  <div className="grid md:grid-cols-2 gap-8 mb-10">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Tagihan Untuk:</p>
                      <p className="font-semibold text-lg text-foreground">{invoice.clientName}</p>
                      {invoice.clientContact && (
                        <p className="text-muted-foreground">{invoice.clientContact}</p>
                      )}
                      {invoice.clientAddress && (
                        <p className="text-muted-foreground whitespace-pre-wrap">{invoice.clientAddress}</p>
                      )}
                    </div>
                    <div className="md:text-right">
                      <div className="space-y-2">
                        {invoice.category && (
                          <div>
                            <p className="text-sm text-muted-foreground">Kategori</p>
                            <p className="font-medium text-foreground">{invoice.category}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground">Tanggal Invoice</p>
                          <p className="font-medium text-foreground">{formatDate(invoice.invoiceDate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Jatuh Tempo</p>
                          <p className="font-medium text-foreground">{formatDate(invoice.dueDate)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className={cn('border rounded-xl overflow-hidden mb-8', styles.tableBorder)}>
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                            Item
                          </th>
                          <th className="text-center px-4 py-3 text-sm font-semibold text-foreground">
                            Qty
                          </th>
                          <th className="text-right px-4 py-3 text-sm font-semibold text-foreground">
                            Harga
                          </th>
                          <th className="text-right px-4 py-3 text-sm font-semibold text-foreground">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.map((item, index) => (
                          <tr key={item.id} className={cn('border-t', styles.tableBorder)}>
                            <td className="px-4 py-4 text-foreground">{item.name}</td>
                            <td className="px-4 py-4 text-center text-muted-foreground">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-4 text-right text-muted-foreground">
                              {formatCurrency(item.price, invoice.currency)}
                            </td>
                            <td className="px-4 py-4 text-right font-medium text-foreground">
                              {formatCurrency(item.quantity * item.price, invoice.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Payment Info + Totals */}
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    {/* Payment Info */}
                    {invoice.paymentInfo && (
                      <div>
                        <p className="text-sm font-bold text-foreground mb-3 uppercase">Pembayaran:</p>
                        <p className="font-medium text-foreground">{invoice.paymentInfo.method}</p>
                        <p className="text-muted-foreground">{invoice.paymentInfo.accountName}</p>
                        <p className="text-muted-foreground">{invoice.paymentInfo.accountNumber}</p>
                      </div>
                    )}

                    {/* Totals */}
                    <div className={cn(!invoice.paymentInfo && 'md:col-start-2')}>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center gap-4 text-muted-foreground">
                          <span className="whitespace-nowrap">
                            {invoice.taxType === 'withholding' ? 'SUBTOTAL / BRUTO :' : 'SUB TOTAL :'}
                          </span>
                          <span className="whitespace-nowrap">{formatCurrency(subtotal, invoice.currency)}</span>
                        </div>
                        {invoice.tax && invoice.tax > 0 && (
                          <div className="flex justify-between items-center gap-4 text-muted-foreground">
                            <span className="whitespace-nowrap">
                              {invoice.taxType === 'withholding' ? `PPh (${invoice.tax}%) :` : `PAJAK (${invoice.tax}%) :`}
                            </span>
                            <span className={cn("whitespace-nowrap font-medium", invoice.taxType === 'withholding' && "text-destructive")}>
                              {invoice.taxType === 'withholding'
                                ? `- ${formatCurrency(taxAmount, invoice.currency)}`
                                : `+ ${formatCurrency(taxAmount, invoice.currency)}`}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center gap-4 text-xl font-bold text-foreground border-t border-border pt-3 mt-3">
                          <span className="whitespace-nowrap">
                            {invoice.taxType === 'withholding' ? 'TOTAL DIBAYARKAN :' : 'TOTAL :'}
                          </span>
                          <span className="whitespace-nowrap">{formatCurrency(total, invoice.currency)}</span>
                        </div>
                        {dpAmount > 0 && (
                          <>
                            <div className="flex justify-between items-center gap-4 text-muted-foreground text-sm">
                              <span className="whitespace-nowrap">DOWN PAYMENT{dpPercent > 0 ? ` (${dpPercent}%)` : ' (DP)'} :</span>
                              <span className="whitespace-nowrap">- {formatCurrency(dpAmount, invoice.currency)}</span>
                            </div>
                            <div className="flex justify-between items-center gap-4 text-lg font-bold text-foreground border-t border-border pt-3 mt-2">
                              <span className="whitespace-nowrap">SISA TAGIHAN :</span>
                              <span className="whitespace-nowrap">{formatCurrency(remaining, invoice.currency)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {invoice.notes && (
                    <div className="border-t border-border pt-6">
                      <p className="text-sm font-semibold text-foreground mb-2">Catatan:</p>
                      <p className="text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-8 md:px-10 py-6 bg-muted/30 border-t border-border">
                  {/* Signature - centered above thank you text */}
                  {(invoice.signatureName || invoice.signatureImage) && (
                    <div className="flex justify-center mb-6">
                      <div className="text-center">
                        {invoice.signatureImage ? (
                          <img
                            src={invoice.signatureImage}
                            alt="Signature"
                            className="h-16 mx-auto object-contain"
                          />
                        ) : invoice.signatureName ? (
                          <p
                            className="text-3xl h-16 flex items-end justify-center"
                            style={getSignatureFontStyle()}
                          >
                            {invoice.signatureName}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )}

                  <p className="text-center text-sm font-semibold text-foreground mb-4 uppercase">
                    Terimakasih Atas Kerja Sama Anda
                  </p>

                  {/* Social Media */}
                  {invoice.socialMedia && (invoice.socialMedia.whatsapp || invoice.socialMedia.instagram || invoice.socialMedia.email) && (
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '24px', fontSize: '14px', color: '#64748b' }}>
                      {invoice.socialMedia.whatsapp && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Phone style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                          <span>{invoice.socialMedia.whatsapp}</span>
                        </span>
                      )}
                      {invoice.socialMedia.instagram && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Instagram style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                          <span>{invoice.socialMedia.instagram}</span>
                        </span>
                      )}
                      {invoice.socialMedia.email && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Mail style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                          <span>{invoice.socialMedia.email}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewInvoice;
