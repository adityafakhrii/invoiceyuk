import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { Invoice, formatCurrency, calculateTotal } from '@/lib/invoice';

interface InvoiceReminderBannerProps {
  invoices: Invoice[];
}

const InvoiceReminderBanner = ({ invoices }: InvoiceReminderBannerProps) => {
  const { overdue, nearDue } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const unpaid = invoices.filter((inv) => inv.status === 'unpaid');

    const overdue = unpaid.filter((inv) => {
      const due = new Date(inv.dueDate);
      due.setHours(0, 0, 0, 0);
      return due < now;
    });

    const nearDue = unpaid.filter((inv) => {
      const due = new Date(inv.dueDate);
      due.setHours(0, 0, 0, 0);
      return due >= now && due <= threeDaysLater;
    });

    return { overdue, nearDue };
  }, [invoices]);

  if (overdue.length === 0 && nearDue.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {overdue.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-destructive text-sm">
                {overdue.length} Invoice Jatuh Tempo! 🔴
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                Invoice berikut sudah melewati tanggal jatuh tempo dan belum dibayar
              </p>
              <div className="space-y-1.5">
                {overdue.slice(0, 3).map((inv) => {
                  const daysOverdue = Math.floor(
                    (new Date().getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <Link
                      key={inv.id}
                      to={`/preview/${inv.id}`}
                      className="flex items-center justify-between text-xs bg-destructive/5 rounded-lg px-3 py-2 hover:bg-destructive/10 transition-colors group"
                    >
                      <span className="font-medium text-foreground truncate">
                        {inv.invoiceNumber} — {inv.clientName}
                      </span>
                      <span className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-destructive font-semibold">
                          {formatCurrency(calculateTotal(inv.items, inv.tax), inv.currency)}
                        </span>
                        <span className="text-destructive/70">({daysOverdue} hari lalu)</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </Link>
                  );
                })}
                {overdue.length > 3 && (
                  <Link to="/riwayat" className="text-xs text-destructive hover:underline font-medium">
                    +{overdue.length - 3} invoice lainnya →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {nearDue.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-amber-600 text-sm">
                {nearDue.length} Invoice Segera Jatuh Tempo ⚠️
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                Invoice berikut akan jatuh tempo dalam 3 hari ke depan
              </p>
              <div className="space-y-1.5">
                {nearDue.slice(0, 3).map((inv) => {
                  const daysLeft = Math.ceil(
                    (new Date(inv.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <Link
                      key={inv.id}
                      to={`/preview/${inv.id}`}
                      className="flex items-center justify-between text-xs bg-amber-500/5 rounded-lg px-3 py-2 hover:bg-amber-500/10 transition-colors group"
                    >
                      <span className="font-medium text-foreground truncate">
                        {inv.invoiceNumber} — {inv.clientName}
                      </span>
                      <span className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-amber-600 font-semibold">
                          {formatCurrency(calculateTotal(inv.items, inv.tax))}
                        </span>
                        <span className="text-amber-600/70">
                          ({daysLeft === 0 ? 'Hari ini' : `${daysLeft} hari lagi`})
                        </span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </Link>
                  );
                })}
                {nearDue.length > 3 && (
                  <Link to="/riwayat" className="text-xs text-amber-600 hover:underline font-medium">
                    +{nearDue.length - 3} invoice lainnya →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceReminderBanner;
