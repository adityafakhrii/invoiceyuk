import { useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Phone, Instagram, Mail, MessageCircle } from 'lucide-react';
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
import Navbar from '@/components/Navbar';
import { useInvoiceStore } from '@/store/invoiceStore';
import {
  formatCurrency,
  formatDate,
  calculateSubtotal,
  calculateTotal,
  signatureFonts,
} from '@/lib/invoice';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const PreviewInvoice = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const getInvoice = useInvoiceStore((state) => state.getInvoice);

  const invoice = id ? getInvoice(id) : undefined;

  if (!invoice) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 text-center">
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
  const taxAmount = invoice.tax ? (subtotal * invoice.tax) / 100 : 0;
  const total = calculateTotal(invoice.items, invoice.tax);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;

    try {
      toast({ title: 'Generating PDF...', description: 'Tunggu bentar ya' });

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${invoice.invoiceNumber}.pdf`);

      toast({ title: 'Mantap! 🎉', description: 'PDF berhasil didownload' });
    } catch (error) {
      toast({ title: 'Oops!', description: 'Gagal generate PDF', variant: 'destructive' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // WhatsApp
  const [waNumber, setWaNumber] = useState(invoice.clientContact || '');
  const [waDialogOpen, setWaDialogOpen] = useState(false);

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
    const itemsList = invoice.items
      .map((item, i) => `${i + 1}. ${item.name} (${item.quantity}x) - ${formatCurrency(item.quantity * item.price, invoice.currency)}`)
      .join('%0A');

    const message = encodeURIComponent(
      `Halo ${invoice.clientName},\n\n` +
      `Berikut invoice dari *${invoice.businessName}*:\n\n` +
      `📄 No: ${invoice.invoiceNumber}\n` +
      `📅 Tanggal: ${formatDate(invoice.invoiceDate)}\n` +
      `⏰ Jatuh Tempo: ${formatDate(invoice.dueDate)}\n\n` +
      `*Detail Item:*\n` +
      invoice.items.map((item, i) => `${i + 1}. ${item.name} (${item.quantity}x) - ${formatCurrency(item.quantity * item.price, invoice.currency)}`).join('\n') +
      `\n\n` +
      (invoice.tax ? `Pajak (${invoice.tax}%): ${formatCurrency(taxAmount, invoice.currency)}\n` : '') +
      `*TOTAL: ${formatCurrency(total, invoice.currency)}*\n\n` +
      (invoice.paymentInfo ? `💳 Pembayaran:\n${invoice.paymentInfo.method}\n${invoice.paymentInfo.accountName}\n${invoice.paymentInfo.accountNumber}\n\n` : '') +
      `Terima kasih! 🙏`
    );

    window.open(`https://wa.me/${formattedNum}?text=${message}`, '_blank');
    setWaDialogOpen(false);
    toast({ title: 'WhatsApp dibuka! 📱', description: 'Pesan invoice siap dikirim ke klien' });
  };

  const getTemplateStyles = () => {
    switch (invoice.template) {
      case 'elegant':
        return {
          headerBg: 'bg-gradient-to-r from-navy-800 to-navy-600',
          headerText: 'text-primary-foreground',
          accentColor: 'text-accent',
          tableBorder: 'border-navy-100',
        };
      case 'corporate':
        return {
          headerBg: 'bg-navy-900',
          headerText: 'text-primary-foreground',
          accentColor: 'text-navy-700',
          tableBorder: 'border-navy-200',
        };
      default: // simple
        return {
          headerBg: 'bg-card',
          headerText: 'text-foreground',
          accentColor: 'text-accent',
          tableBorder: 'border-border',
        };
    }
  };

  const styles = getTemplateStyles();

  // Get signature font style
  const getSignatureFontStyle = () => {
    if (invoice.signatureImage) return {};
    const font = signatureFonts.find(f => f.id === invoice.signatureFont) || signatureFonts[0];
    return { fontFamily: font.fontFamily };
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20 md:pt-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 print:hidden">
              <Button variant="ghost" onClick={() => navigate('/riwayat')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Selesai
              </Button>

              <div className="flex gap-3">
                <Button variant="outline-light" onClick={handlePrint}>
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
                <Button variant="hero" onClick={handleDownloadPDF}>
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </div>
            </div>

            {/* Invoice Preview */}
            <div className="bg-card rounded-2xl shadow-elegant overflow-hidden print:shadow-none print:rounded-none">
              <div ref={invoiceRef} className="bg-white">
                {/* Header */}
                <div className={cn('p-8 md:p-10', styles.headerBg)}>
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex items-center gap-4">
                      {invoice.businessLogo ? (
                        <img
                          src={invoice.businessLogo}
                          alt="Logo"
                          className="w-16 h-16 rounded-lg object-cover"
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
                        <div className="flex justify-between text-muted-foreground">
                          <span>SUB TOTAL :</span>
                          <span>{formatCurrency(subtotal, invoice.currency)}</span>
                        </div>
                        {invoice.tax && invoice.tax > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>PAJAK ({invoice.tax}%) :</span>
                            <span>{formatCurrency(taxAmount, invoice.currency)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xl font-bold text-foreground border-t border-border pt-3 mt-3">
                          <span>TOTAL :</span>
                          <span>{formatCurrency(total, invoice.currency)}</span>
                        </div>
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
      </main>
    </div>
  );
};

export default PreviewInvoice;
