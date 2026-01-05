import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, FileText, Eye, Trash2, CheckCircle, Clock, Filter, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Navbar from '@/components/Navbar';
import { useInvoiceStore } from '@/store/invoiceStore';
import { formatCurrency, formatDate, calculateTotal } from '@/lib/invoice';
import { cn } from '@/lib/utils';
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
  const { invoices, toggleStatus, deleteInvoice } = useInvoiceStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.businessName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus =
      statusFilter === 'all' ||
      invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: string) => {
    deleteInvoice(id);
    toast({ title: 'Invoice dihapus', description: 'Invoice berhasil dihapus dari riwayat' });
  };

  const handleToggleStatus = (id: string) => {
    toggleStatus(id);
    toast({ title: 'Status diperbarui' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20 md:pt-28">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Riwayat Invoice
              </h1>
              <p className="text-muted-foreground">
                Semua invoice yang pernah lo buat ada di sini 📋
              </p>
            </div>

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
              </div>
            </div>

            {/* Invoice List */}
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {invoices.length === 0 ? 'Belum Ada Invoice' : 'Tidak Ditemukan'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {invoices.length === 0 
                    ? 'Yuk mulai bikin invoice pertama lo!'
                    : 'Coba kata kunci lain atau ubah filter'}
                </p>
                {invoices.length === 0 && (
                  <Link to="/buat-invoice">
                    <Button variant="hero">Buat Invoice Pertama</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="bg-card rounded-xl border border-border p-4 md:p-6 shadow-card hover:shadow-elegant transition-shadow duration-300"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                          <FileText className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{invoice.clientName}</h3>
                          <p className="text-sm text-muted-foreground">{invoice.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {invoice.businessName} • {formatDate(invoice.invoiceDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6">
                        <div className="text-right">
                          <p className="font-bold text-lg text-foreground">
                            {formatCurrency(calculateTotal(invoice.items, invoice.tax))}
                          </p>
                          <button
                            onClick={() => handleToggleStatus(invoice.id)}
                            className={cn(
                              "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-colors cursor-pointer",
                              invoice.status === 'paid'
                                ? "bg-accent/10 text-accent"
                                : "bg-amber-500/10 text-amber-600"
                            )}
                          >
                            {invoice.status === 'paid' ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Paid
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
                              variant="default" 
                              size="sm"
                              onClick={() => handleToggleStatus(invoice.id)}
                              className="bg-accent hover:bg-accent/90"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span className="hidden sm:inline">Paid</span>
                            </Button>
                          )}
                          <Link to={`/edit-invoice/${invoice.id}`}>
                            <Button variant="outline-light" size="sm">
                              <Pencil className="w-4 h-4" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                          </Link>
                          <Link to={`/preview/${invoice.id}`}>
                            <Button variant="outline-light" size="sm">
                              <Eye className="w-4 h-4" />
                              <span className="hidden sm:inline">Lihat</span>
                            </Button>
                          </Link>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
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
              <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-border p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{invoices.length}</p>
                  <p className="text-sm text-muted-foreground">Total Invoice</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 text-center">
                  <p className="text-2xl font-bold text-accent">
                    {invoices.filter((i) => i.status === 'paid').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Sudah Dibayar</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">
                    {invoices.filter((i) => i.status === 'unpaid').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Belum Dibayar</p>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(
                      invoices
                        .filter((i) => i.status === 'paid')
                        .reduce((sum, i) => sum + calculateTotal(i.items, i.tax), 0)
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Dibayar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Riwayat;
