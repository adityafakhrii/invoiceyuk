import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, FileText, Calendar, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import Navbar from '@/components/Navbar';
import { useInvoiceStore } from '@/store/invoiceStore';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, calculateTotal } from '@/lib/invoice';
import { Button } from '@/components/ui/button';

type ViewMode = 'monthly' | 'yearly';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

const Laporan = () => {
  const navigate = useNavigate();
  const { invoices, fetchInvoices } = useInvoiceStore();
  const { user, isAuthenticated } = useAuthStore();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/pin-login');
      return;
    }
    if (user) {
      fetchInvoices(user.id);
    }
  }, [isAuthenticated, user, navigate, fetchInvoices]);

  const paidInvoices = useMemo(
    () => invoices.filter((inv) => inv.status === 'paid'),
    [invoices]
  );

  const availableYears = useMemo(() => {
    const years = new Set(paidInvoices.map((inv) => new Date(inv.invoiceDate).getFullYear()));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [paidInvoices]);

  const monthlyData = useMemo(() => {
    return MONTH_NAMES.map((name, idx) => {
      const monthInvoices = paidInvoices.filter((inv) => {
        const d = new Date(inv.invoiceDate);
        return d.getFullYear() === selectedYear && d.getMonth() === idx;
      });
      const revenue = monthInvoices.reduce((sum, inv) => sum + calculateTotal(inv.items, inv.tax), 0);
      return { name, revenue, count: monthInvoices.length };
    });
  }, [paidInvoices, selectedYear]);

  const yearlyData = useMemo(() => {
    return availableYears
      .map((year) => {
        const yearInvoices = paidInvoices.filter(
          (inv) => new Date(inv.invoiceDate).getFullYear() === year
        );
        const revenue = yearInvoices.reduce((sum, inv) => sum + calculateTotal(inv.items, inv.tax), 0);
        return { name: String(year), revenue, count: yearInvoices.length };
      })
      .reverse();
  }, [paidInvoices, availableYears]);

  const chartData = viewMode === 'monthly' ? monthlyData : yearlyData;

  const stats = useMemo(() => {
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + calculateTotal(inv.items, inv.tax), 0);

    const thisYearInvoices = paidInvoices.filter(
      (inv) => new Date(inv.invoiceDate).getFullYear() === selectedYear
    );
    const yearRevenue = thisYearInvoices.reduce((sum, inv) => sum + calculateTotal(inv.items, inv.tax), 0);

    const currentMonth = new Date().getMonth();
    const thisMonthRevenue = monthlyData[currentMonth]?.revenue || 0;
    const lastMonthRevenue = currentMonth > 0 ? (monthlyData[currentMonth - 1]?.revenue || 0) : 0;

    const growth = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : thisMonthRevenue > 0 ? 100 : 0;

    const avgMonthly = yearRevenue / (currentMonth + 1);

    return { totalRevenue, yearRevenue, thisMonthRevenue, growth, avgMonthly, paidCount: paidInvoices.length };
  }, [paidInvoices, monthlyData, selectedYear]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-elegant">
        <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
        <p className="text-sm text-accent font-bold">{formatCurrency(payload[0].value)}</p>
        <p className="text-xs text-muted-foreground">{payload[0].payload.count} invoice</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20 md:pt-28">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Laporan Keuangan
              </h1>
              <p className="text-muted-foreground">
                Pantau pendapatan bisnis lo dari invoice yang sudah dibayar 📊
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={<DollarSign className="w-5 h-5 text-accent" />}
                label="Total Pendapatan"
                value={formatCurrency(stats.totalRevenue)}
                bgClass="bg-accent/10"
              />
              <StatCard
                icon={<BarChart3 className="w-5 h-5 text-primary" />}
                label={`Pendapatan ${selectedYear}`}
                value={formatCurrency(stats.yearRevenue)}
                bgClass="bg-primary/10"
              />
              <StatCard
                icon={
                  stats.growth >= 0
                    ? <TrendingUp className="w-5 h-5 text-green-600" />
                    : <TrendingDown className="w-5 h-5 text-destructive" />
                }
                label="Pertumbuhan Bulan Ini"
                value={`${stats.growth >= 0 ? '+' : ''}${stats.growth.toFixed(1)}%`}
                bgClass={stats.growth >= 0 ? 'bg-green-500/10' : 'bg-destructive/10'}
              />
              <StatCard
                icon={<FileText className="w-5 h-5 text-amber-600" />}
                label="Invoice Dibayar"
                value={String(stats.paidCount)}
                bgClass="bg-amber-500/10"
              />
            </div>

            {/* Chart Section */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Grafik Pendapatan</h2>
                  <p className="text-sm text-muted-foreground">
                    {viewMode === 'monthly' ? `Pendapatan bulanan tahun ${selectedYear}` : 'Pendapatan per tahun'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-secondary rounded-lg p-0.5">
                    <Button
                      variant={viewMode === 'monthly' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('monthly')}
                      className="text-xs"
                    >
                      Bulanan
                    </Button>
                    <Button
                      variant={viewMode === 'yearly' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('yearly')}
                      className="text-xs"
                    >
                      Tahunan
                    </Button>
                  </div>

                  {viewMode === 'monthly' && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-secondary text-foreground text-sm rounded-lg px-2 py-1.5 border-0 focus:ring-2 focus:ring-primary"
                      >
                        {availableYears.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {chartData.some((d) => d.revenue > 0) ? (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}jt`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--accent))"
                      strokeWidth={2.5}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">Belum ada data pendapatan untuk ditampilkan</p>
                </div>
              )}
            </div>

            {/* Monthly Breakdown Table */}
            {viewMode === 'monthly' && (
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-lg font-bold text-foreground mb-4">Detail Bulanan {selectedYear}</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium">Bulan</th>
                        <th className="text-right py-3 px-2 text-muted-foreground font-medium">Invoice</th>
                        <th className="text-right py-3 px-2 text-muted-foreground font-medium">Pendapatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((row) => (
                        <tr key={row.name} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                          <td className="py-3 px-2 font-medium text-foreground">{row.name}</td>
                          <td className="py-3 px-2 text-right text-muted-foreground">{row.count}</td>
                          <td className="py-3 px-2 text-right font-semibold text-foreground">
                            {row.revenue > 0 ? formatCurrency(row.revenue) : '-'}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-primary/5">
                        <td className="py-3 px-2 font-bold text-foreground">Total</td>
                        <td className="py-3 px-2 text-right font-bold text-foreground">
                          {monthlyData.reduce((s, r) => s + r.count, 0)}
                        </td>
                        <td className="py-3 px-2 text-right font-bold text-accent">
                          {formatCurrency(monthlyData.reduce((s, r) => s + r.revenue, 0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  bgClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bgClass: string;
}) => (
  <div className="bg-card rounded-xl border border-border p-4 shadow-card">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg ${bgClass} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-foreground truncate">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  </div>
);

export default Laporan;
