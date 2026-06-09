import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Receipt, 
  FileEdit, 
  History, 
  Users, 
  ArrowRight, 
  TrendingUp, 
  AlertCircle, 
  Loader2, 
  DollarSign, 
  CheckCircle2, 
  Clock 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useInvoiceStore } from "@/store/invoiceStore";
import { formatCurrency, calculateTotal, formatDate } from "@/lib/invoice";
import InvoiceReminderBanner from "@/components/InvoiceReminderBanner";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { invoices, fetchInvoices, isLoading } = useInvoiceStore();
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (user && !hasFetched) {
      fetchInvoices(user.id);
      setHasFetched(true);
    }
  }, [user, fetchInvoices, hasFetched]);

  // Calculations
  const paidInvoices = useMemo(
    () => invoices.filter((inv) => inv.status === "paid"),
    [invoices]
  );
  
  const unpaidInvoices = useMemo(
    () => invoices.filter((inv) => inv.status === "unpaid"),
    [invoices]
  );

  const overdueInvoices = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return unpaidInvoices.filter((inv) => {
      const due = new Date(inv.dueDate);
      due.setHours(0, 0, 0, 0);
      return due < now;
    });
  }, [unpaidInvoices]);

  const totalRevenue = useMemo(() => {
    return paidInvoices.reduce((sum, inv) => sum + calculateTotal(inv.items, inv.tax), 0);
  }, [paidInvoices]);

  const outstandingRevenue = useMemo(() => {
    return unpaidInvoices.reduce((sum, inv) => sum + calculateTotal(inv.items, inv.tax), 0);
  }, [unpaidInvoices]);

  const overdueRevenue = useMemo(() => {
    return overdueInvoices.reduce((sum, inv) => sum + calculateTotal(inv.items, inv.tax), 0);
  }, [overdueInvoices]);

  // Recent invoices (sorted by date or createdAt descending)
  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [invoices]);

  // Chart data
  const monthlyTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const currentYear = new Date().getFullYear();
    
    return months.map((name, idx) => {
      const monthInvoices = paidInvoices.filter((inv) => {
        const d = new Date(inv.invoiceDate);
        return d.getFullYear() === currentYear && d.getMonth() === idx;
      });
      const revenue = monthInvoices.reduce((sum, inv) => sum + calculateTotal(inv.items, inv.tax), 0);
      return { name, Pendapatan: revenue };
    });
  }, [paidInvoices]);

  return (
    <div className="w-full">
      {/* Top Welcome Title */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary uppercase tracking-tight flex items-center gap-2">
            Ikhtisar Bisnis
          </h1>
          <p className="text-navy-700 font-semibold text-sm">
            Pantau arus kas, tagihan jatuh tempo, dan dokumen terbaru lo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/buat-invoice">
            <Button variant="default" size="sm" className="rounded-none shadow-neo-sm">
              <Receipt className="w-4 h-4 mr-2" />
              Buat Invoice
            </Button>
          </Link>
          <Link to="/buat-quotation">
            <Button variant="accent" size="sm" className="rounded-none shadow-neo-sm">
              <FileEdit className="w-4 h-4 mr-2" />
              Buat Quotation
            </Button>
          </Link>
        </div>
      </div>

      {/* Financial metrics stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total revenue */}
        <div className="bg-card border-2 border-primary p-6 shadow-neo rounded-none relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign className="w-16 h-16 text-primary" />
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Pendapatan (Lunas)</p>
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mt-3" />
          ) : (
            <p className="text-2xl font-black text-primary mt-2 truncate">
              {formatCurrency(totalRevenue)}
            </p>
          )}
          <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-green-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Dari {paidInvoices.length} invoice terbayar</span>
          </div>
        </div>

        {/* Outstanding revenue */}
        <div className="bg-card border-2 border-primary p-6 shadow-neo rounded-none relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Clock className="w-16 h-16 text-primary" />
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Piutang Berjalan (Unpaid)</p>
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mt-3" />
          ) : (
            <p className="text-2xl font-black text-accent mt-2 truncate">
              {formatCurrency(outstandingRevenue)}
            </p>
          )}
          <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-navy-500">
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu {unpaidInvoices.length} invoice terbayar</span>
          </div>
        </div>

        {/* Overdue revenue */}
        <div className="bg-card border-2 border-primary p-6 shadow-neo rounded-none relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlertCircle className="w-16 h-16 text-primary" />
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Tagihan Overdue</p>
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mt-3" />
          ) : (
            <p className="text-2xl font-black text-destructive mt-2 truncate">
              {formatCurrency(overdueRevenue)}
            </p>
          )}
          <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-destructive">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Ada {overdueInvoices.length} invoice melewati batas tempo</span>
          </div>
        </div>

        {/* Summary counts */}
        <div className="bg-card border-2 border-primary p-6 shadow-neo rounded-none flex flex-col justify-between">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Statistik Dokumen</p>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="border-r border-primary/10">
              <span className="text-sm font-bold text-muted-foreground">Lunas</span>
              <p className="text-2xl font-black text-primary mt-1">{paidInvoices.length}</p>
            </div>
            <div>
              <span className="text-sm font-bold text-muted-foreground">Pending</span>
              <p className="text-2xl font-black text-accent mt-1">{unpaidInvoices.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue alerts section */}
      <InvoiceReminderBanner invoices={invoices} />

      {/* Main dashboard components grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 bg-card border-2 border-primary p-6 shadow-neo rounded-none flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-primary uppercase tracking-tight">Tren Pendapatan</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Grafik pendapatan terbayar di tahun {new Date().getFullYear()}</p>
            </div>
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>

          <div className="flex-1 w-full text-xs font-semibold">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : paidInvoices.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-primary/20 text-muted-foreground">
                <span>Belum ada pendapatan terbayar di tahun ini</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyTrendData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorPendapatan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--primary), 0.08)" />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--primary))', strokeWidth: 1.5 }}
                    tick={{ fill: 'hsl(var(--primary))' }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={{ stroke: 'hsl(var(--primary))', strokeWidth: 1.5 }}
                    tick={{ fill: 'hsl(var(--primary))' }}
                    tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(0)}jt` : val}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '2px solid hsl(var(--primary))',
                      borderRadius: '0px',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 'bold',
                      boxShadow: '2px 2px 0px 0px hsl(var(--primary))'
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Pendapatan']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Pendapatan" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorPendapatan)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Side Panel: Recent Invoices */}
        <div className="bg-card border-2 border-primary p-6 shadow-neo rounded-none flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-primary/10">
            <div>
              <h3 className="text-lg font-black text-primary uppercase tracking-tight">Dokumen Terbaru</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Aktivitas invoice & quotation terkini</p>
            </div>
            <Link to="/riwayat" className="text-xs font-bold text-accent hover:underline flex items-center gap-1 uppercase tracking-wider">
              Semua
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : recentInvoices.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center border-2 border-dashed border-primary/20 text-muted-foreground p-4">
                <p className="text-sm font-bold">Belum ada aktivitas</p>
                <p className="text-xs mt-1">Buat invoice pertama lo sekarang!</p>
              </div>
            ) : (
              recentInvoices.map((inv) => {
                const totalAmount = calculateTotal(inv.items, inv.tax);
                const isOverdue = inv.status === 'unpaid' && new Date(inv.dueDate) < new Date();
                
                return (
                  <Link 
                    key={inv.id} 
                    to={`/preview/${inv.id}`}
                    className="block p-3 border-2 border-primary hover:border-accent hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-neo-sm active:translate-x-0 active:translate-y-0 transition-all bg-card"
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <span className="font-black text-sm text-primary uppercase truncate block">
                          {inv.invoiceNumber}
                        </span>
                        <span className="text-xs text-muted-foreground font-semibold truncate block mt-0.5">
                          {inv.clientName}
                        </span>
                      </div>
                      <span className={cn(
                        "text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider border-2 text-center",
                        inv.status === 'paid'
                          ? "bg-green-100 text-green-700 border-green-700"
                          : isOverdue
                            ? "bg-destructive/10 text-destructive border-destructive"
                            : "bg-yellow-50 text-yellow-800 border-yellow-800"
                      )}>
                        {inv.status === 'paid' ? 'Lunas' : isOverdue ? 'Overdue' : 'Unpaid'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-primary/5">
                      <span className="text-xs text-muted-foreground font-semibold">
                        {formatDate(inv.invoiceDate)}
                      </span>
                      <span className="font-black text-sm text-primary">
                        {formatCurrency(totalAmount, inv.currency)}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
