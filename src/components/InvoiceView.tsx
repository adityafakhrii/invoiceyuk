import React from 'react';
import { Phone, Instagram, Mail } from 'lucide-react';
import {
  Invoice,
  calculateSubtotal,
  calculateTaxAmount,
  calculateTotal,
  formatDate,
  formatCurrency,
  signatureFonts,
  INVOICE_TEMPLATE_STYLES,
} from '@/lib/invoice';
import { cn } from '@/lib/utils';

interface InvoiceViewProps {
  invoice: Invoice;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({ invoice }) => {
  const subtotal = calculateSubtotal(invoice.items);
  const taxAmount = calculateTaxAmount(subtotal, invoice.tax, invoice.currency);
  const total = calculateTotal(invoice.items, invoice.tax, invoice.taxType, invoice.currency);
  const dpAmount = invoice.downPayment || 0;
  const dpPercent =
    invoice.dpPercent ||
    (total > 0 && dpAmount > 0 ? Math.round((dpAmount / total) * 100 * 100) / 100 : 0);
  const remaining = total - dpAmount;

  const styles = INVOICE_TEMPLATE_STYLES[invoice.template || 'simple'];

  const getSignatureFontStyle = () => {
    if (invoice.signatureImage) return {};
    const font = signatureFonts.find((f) => f.id === invoice.signatureFont) || signatureFonts[0];
    return { fontFamily: font.fontFamily };
  };

  return (
    <div className="bg-white w-[800px] text-foreground">
      {/* Header */}
      <div className={cn('p-8 md:p-10', styles.headerBg)}>
        <div className="flex flex-row justify-between items-start gap-6">
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
            <p className={cn('text-xs font-medium opacity-80', styles.headerText)}>INVOICE</p>
            <p className={cn('text-base font-semibold', styles.headerText)}>
              {invoice.invoiceNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-8 md:p-10">
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-10">
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
          <div className="text-right">
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
                <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Item</th>
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
              {invoice.items.map((item) => (
                <tr key={item.id} className={cn('border-t', styles.tableBorder)}>
                  <td className="px-4 py-4 text-foreground">{item.name}</td>
                  <td className="px-4 py-4 text-center text-muted-foreground">{item.quantity}</td>
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
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Payment Info */}
          {invoice.paymentInfo ? (
            <div>
              <p className="text-sm font-bold text-foreground mb-3 uppercase">Pembayaran:</p>
              <p className="font-medium text-foreground">{invoice.paymentInfo.method}</p>
              <p className="text-muted-foreground">{invoice.paymentInfo.accountName}</p>
              <p className="text-muted-foreground">{invoice.paymentInfo.accountNumber}</p>
            </div>
          ) : (
            <div />
          )}

          {/* Totals */}
          <div>
            <div className="space-y-2">
              <div className="flex justify-between items-center gap-4 text-muted-foreground">
                <span className="whitespace-nowrap">
                  {invoice.taxType === 'withholding' ? 'SUBTOTAL / BRUTO :' : 'SUB TOTAL :'}
                </span>
                <span className="whitespace-nowrap">{formatCurrency(subtotal, invoice.currency)}</span>
              </div>
              {invoice.tax && invoice.tax > 0 ? (
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
              ) : null}
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

        {invoice.socialMedia &&
          (invoice.socialMedia.whatsapp ||
            invoice.socialMedia.instagram ||
            invoice.socialMedia.email) && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
                fontSize: '14px',
                color: '#64748b',
              }}
            >
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
  );
};
