import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, FileText, Eye, Trash2, CheckCircle, Clock, Filter, Pencil, Loader2, Copy, Download, CalendarIcon, X, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInvoiceStore } from '@/store/invoiceStore';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatDate, calculateTotal, calculateSubtotal } from '@/lib/invoice';
import Papa from 'papaparse';
import { cn } from '@/lib/utils';
import InvoiceReminderBanner from '@/components/InvoiceReminderBanner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

const Riwayat = () => {
  const navigate = useNavigate();
  const { invoices, toggleStatus, deleteInvoice, cancelInvoice, fetchInvoices, isLoading } = useInvoiceStore();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'cancelled'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [hasFetched, setHasFetched] = useState(false);

  const uniqueCategories = Array.from(new Set(invoices.map(i => i.category).filter(Boolean))) as string[];

  useEffect(() => {
    if (user && !hasFetched) {
      fetchInvoices(user.id);
      setHasFetched(true);
    }
  }, [user, fetchInvoices, hasFetched]);

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (invoice.category || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      invoice.status === statusFilter;

    const matchesCategory =
      categoryFilter === 'all' ||
      (invoice.category || '') === categoryFilter;

    const invoiceDate = new Date(invoice.invoiceDate);
    const matchesDateFrom = !dateFrom || invoiceDate >= dateFrom;
    const matchesDateTo = !dateTo || invoiceDate <= dateTo;

    return matchesSearch && matchesStatus && matchesCategory && matchesDateFrom && matchesDateTo;
  });

  const clearDateFilter = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const handleDelete = (id: string) => {
    if (user) {
      deleteInvoice(id, user.id);
      toast({ title: 'Invoice dihapus', description: 'Invoice berhasil dihapus dari riwayat' });
    }
  };

  const handleCancel = (id: string) => {
    if (user) {
      cancelInvoice(id, user.id);
      toast({ title: 'Invoice dibatalkan', description: 'Status invoice berhasil diubah menjadi dibatalkan (canceled)' });
    }
  };

  const handleExportCSV = () => {
    const dataToExport = filteredInvoices.map((inv) => ({
      'No Invoice': inv.invoiceNumber,
      'Nama Bisnis': inv.businessName,
      'Nama Klien': inv.clientName,
      'Kontak Klien': inv.clientContact || '-',
      'Tanggal Invoice': formatDate(inv.invoiceDate),
      'Jatuh Tempo': formatDate(inv.dueDate),
      'Mata Uang': inv.currency || 'IDR',
      'Subtotal': calculateSubtotal(inv.items),
      'Pajak (%)': inv.tax || 0,
      'Total': calculateTotal(inv.items, inv.tax),
      'Status': inv.status === 'paid' ? 'Lunas' : 'Belum Lunas',
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export berhasil! 📥', description: `${dataToExport.length} invoice berhasil di-export ke CSV` });
  };

  const handleToggleStatus = (id: string) => {
    if (user) {
      toggleStatus(id, user.id);
      toast({ title: 'Status diperbarui' });
    }
  };

  return (
    <div className="w-full">
      <div className="pb-10">
        <div className="w-full">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-4xl font-black text-primary uppercase tracking-tight mb-3">
                Riwayat Invoice
              </h1>
              <p className="text-navy-700 font-semibold text-sm">
                Semua invoice yang pernah lo buat ada di sini
              </p>
              {invoices.length > 0 && (
                <Button variant="outline" size="sm" className="mt-4" onClick={handleExportCSV}>
                  <Download className="w-4 h-4 mr-1" />
                  Export CSV
                </Button>
              )}
            </div>

            {/* Overdue Reminders */}
            <InvoiceReminderBanner invoices={invoices} />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama klien atau nomor invoice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline-light'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  <Filter className="w-4 h-4 mr-1" />
                  Semua
                </Button>
                <Button
                  variant={statusFilter === 'paid' ? 'default' : 'outline-light'}
                  size="sm"
                  onClick={() => setStatusFilter('paid')}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Paid
                </Button>
                <Button
                  variant={statusFilter === 'unpaid' ? 'default' : 'outline-light'}
                  size="sm"
                  onClick={() => setStatusFilter('unpaid')}
                >
                  <Clock className="w-4 h-4 mr-1" />
                  Unpaid
                </Button>
                <Button
                  variant={statusFilter === 'cancelled' ? 'default' : 'outline-light'}
                  size="sm"
                  onClick={() => setStatusFilter('cancelled')}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Dibatalkan
                </Button>
              </div>
            </div>

            {/* Category Filter */}
            {uniqueCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant={categoryFilter === 'all' ? 'default' : 'outline-light'}
                  size="sm"
                  onClick={() => setCategoryFilter('all')}
                >
                  Semua Kategori
                </Button>
                {uniqueCategories.map((cat) => (
                  <Button
                    key={cat}
                    variant={categoryFilter === cat ? 'default' : 'outline-light'}
                    size="sm"
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            )}

            {/* Date Range Filter */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline-light" size="sm" className={cn(!dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    {dateFrom ? format(dateFrom, 'd MMM yyyy', { locale: idLocale }) : 'Dari tanggal'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground text-sm">—</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline-light" size="sm" className={cn(!dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    {dateTo ? format(dateTo, 'd MMM yyyy', { locale: idLocale }) : 'Sampai tanggal'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
                </PopoverContent>
              </Popover>
              {(dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" onClick={clearDateFilter} className="text-muted-foreground hover:text-destructive">
                  <X className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              )}
            </div>

            {/* Invoice List */}
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-primary/40 rounded-xl bg-card">
                <div className="w-20 h-20 rounded-xl border-2 border-primary bg-secondary flex items-center justify-center mx-auto mb-4 shadow-neo-sm">
                  <FileText className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-black text-primary uppercase tracking-tight mb-2">
                  {invoices.length === 0 ? 'Belum Ada Invoice' : 'Tidak Ditemukan'}
                </h3>
                <p className="text-sm font-semibold text-muted-foreground mb-6">
                  {invoices.length === 0
                    ? 'Yuk mulai bikin invoice pertama lo!'
                    : 'Coba kata kunci lain atau ubah filter'}
                </p>
                {invoices.length === 0 && (
                  <Link to="/buat-invoice">
                    <Button variant="default">Buat Invoice Pertama</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    onClick={() => navigate(`/preview/${invoice.id}`)}
                    className="bg-card rounded-xl border-2 border-primary p-4 md:p-6 shadow-neo hover:shadow-neo-accent hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all duration-150 cursor-pointer"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg border-2 border-primary bg-secondary flex items-center justify-center flex-shrink-0 shadow-neo-sm">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-lg text-primary">{invoice.clientName}</h3>
                          <p className="text-sm font-bold text-muted-foreground">{invoice.invoiceNumber}</p>
                          <p className="text-xs font-bold text-navy-600 mt-1">
                            {invoice.businessName} • {formatDate(invoice.invoiceDate)}
                            {invoice.category && <span className="ml-1 font-bold">• {invoice.category}</span>}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6">
                        <div className="text-left md:text-right">
                          <p className="font-black text-lg text-primary">
                            {formatCurrency(calculateTotal(invoice.items, invoice.tax), invoice.currency)}
                          </p>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleStatus(invoice.id); }}
                            className={cn(
                              "inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border-2 transition-colors cursor-pointer shadow-sm mt-1",
                              invoice.status === 'paid'
                                ? "bg-accent/15 border-primary text-primary"
                                : invoice.status === 'cancelled'
                                  ? "bg-gray-100 border-primary text-gray-500 line-through"
                                  : "bg-yellow-100 border-primary text-yellow-800"
                            )}
                          >
                            {invoice.status === 'paid' ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Paid
                              </>
                            ) : invoice.status === 'cancelled' ? (
                              <>
                                <XCircle className="w-3 h-3" />
                                Canceled
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3" />
                                Unpaid
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {invoice.status === 'unpaid' && (
                            <Button
                              variant="accent"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleToggleStatus(invoice.id); }}
                              className="text-xs py-1.5 h-9"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span className="hidden sm:inline">Set Paid</span>
                            </Button>
                          )}
                          {invoice.status === 'cancelled' && (
                            <Button
                              variant="accent"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleToggleStatus(invoice.id); }}
                              className="text-xs py-1.5 h-9"
                            >
                              <Clock className="w-4 h-4" />
                              <span className="hidden sm:inline">Set Unpaid</span>
                            </Button>
                          )}
                          {invoice.status !== 'cancelled' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleCancel(invoice.id); }}
                              className="text-xs py-1.5 h-9 border-destructive hover:bg-destructive/10 text-destructive font-bold"
                            >
                              <XCircle className="w-4 h-4" />
                              <span className="hidden sm:inline">Batalkan</span>
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="icon"
                            title="Duplikat"
                            onClick={(e) => { e.stopPropagation(); navigate('/buat-invoice', { state: { duplicateFrom: invoice } }); }}
                            className="w-9 h-9"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Link to={`/edit-invoice/${invoice.id}`} title="Edit" onClick={(e) => e.stopPropagation()}>
                            <Button variant="outline" size="icon" className="w-9 h-9">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link to={`/preview/${invoice.id}`} title="Lihat" onClick={(e) => e.stopPropagation()}>
                            <Button variant="outline" size="icon" className="w-9 h-9">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link to={`/preview/${invoice.id}`} title="Download PDF" onClick={(e) => e.stopPropagation()}>
                            <Button variant="default" size="icon" className="w-9 h-9">
                              <Download className="w-4 h-4" />
                            </Button>
                          </Link>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon" className="w-9 h-9" onClick={(e) => e.stopPropagation()}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Invoice?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Invoice {invoice.invoiceNumber} akan dihapus permanen. Yakin nih?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(invoice.id)}>
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stats */}
            {invoices.length > 0 && (
              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-6 rounded-xl border-2 border-primary shadow-neo">
                <div className="p-4 text-center border-2 border-primary rounded-lg bg-secondary/50 shadow-neo-sm">
                  <p className="text-3xl font-black text-primary leading-none mb-1">{invoices.length}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Invoice</p>
                </div>
                <div className="p-4 text-center border-2 border-primary rounded-lg bg-accent/10 shadow-neo-sm">
                  <p className="text-3xl font-black text-accent leading-none mb-1">
                    {invoices.filter((i) => i.status === 'paid').length}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sudah Dibayar</p>
                </div>
                <div className="p-4 text-center border-2 border-primary rounded-lg bg-yellow-50 shadow-neo-sm">
                  <p className="text-3xl font-black text-yellow-800 leading-none mb-1">
                    {invoices.filter((i) => i.status === 'unpaid').length}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Belum Dibayar</p>
                </div>
                <div className="p-4 text-center border-2 border-primary rounded-lg bg-secondary/50 shadow-neo-sm">
                  <p className="text-xl font-black text-primary truncate leading-none mb-2 mt-1">
                    {formatCurrency(
                      invoices
                        .filter((i) => i.status === 'paid')
                        .reduce((sum, i) => sum + calculateTotal(i.items, i.tax), 0)
                    )}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Dibayar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Riwayat;
