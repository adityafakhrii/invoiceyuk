import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, FileText, Calendar, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '@/components/Navbar';
import { useInvoiceStore } from '@/store/invoiceStore';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, calculateTotal } from '@/lib/invoice';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ViewMode = 'monthly' | 'yearly';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

const Laporan = () => {
  const navigate = useNavigate();
  const { invoices, fetchInvoices } = useInvoiceStore();
  const { user, isAuthenticated } = useAuthStore();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
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
    return MONTH_SHORT.map((name, idx) => {
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

    const selectedMonthRevenue = monthlyData[selectedMonth]?.revenue || 0;
    const prevMonthRevenue = selectedMonth > 0 ? (monthlyData[selectedMonth - 1]?.revenue || 0) : 0;

    const growth = prevMonthRevenue > 0
      ? ((selectedMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
      : selectedMonthRevenue > 0 ? 100 : 0;

    const selectedMonthCount = monthlyData[selectedMonth]?.count || 0;

    return { totalRevenue, yearRevenue, selectedMonthRevenue, growth, paidCount: paidInvoices.length, selectedMonthCount };
  }, [paidInvoices, monthlyData, selectedYear, selectedMonth]);

  const selectedMonthLabel = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;

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

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const data = viewMode === 'monthly' ? monthlyData : yearlyData;
    const title = viewMode === 'monthly'
      ? `Laporan Pendapatan - ${selectedMonthLabel}`
      : 'Laporan Keuangan Tahunan';

    doc.setFontSize(18);
    doc.text(title, pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth / 2, 28, { align: 'center' });

    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text('Ringkasan', 14, 42);
    doc.setFontSize(10);
    doc.text(`Total Pendapatan (Semua): ${formatCurrency(stats.totalRevenue)}`, 14, 50);
    doc.text(`Pendapatan ${selectedMonthLabel}: ${formatCurrency(stats.selectedMonthRevenue)}`, 14, 57);
    doc.text(`Invoice Dibayar (${selectedMonthLabel}): ${stats.selectedMonthCount}`, 14, 64);
    doc.text(`Pertumbuhan dari Bulan Sebelumnya: ${stats.growth >= 0 ? '+' : ''}${stats.growth.toFixed(1)}%`, 14, 71);

    let y = 85;
    doc.setFillColor(240, 240, 245);
    doc.rect(14, y - 5, pageWidth - 28, 8, 'F');
    doc.setFontSize(10);
    doc.setFont(undefined!, 'bold');
    doc.text('Periode', 16, y);
    doc.text('Jumlah Invoice', pageWidth / 2, y, { align: 'center' });
    doc.text('Pendapatan', pageWidth - 16, y, { align: 'right' });

    doc.setFont(undefined!, 'normal');
    y += 10;
    let totalRev = 0;
    let totalCount = 0;
    data.forEach((row) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(row.name, 16, y);
      doc.text(String(row.count), pageWidth / 2, y, { align: 'center' });
      doc.text(row.revenue > 0 ? formatCurrency(row.revenue) : '-', pageWidth - 16, y, { align: 'right' });
      totalRev += row.revenue;
      totalCount += row.count;
      y += 8;
    });

    y += 2;
    doc.setDrawColor(200);
    doc.line(14, y - 5, pageWidth - 14, y - 5);
    doc.setFont(undefined!, 'bold');
    doc.text('Total', 16, y);
    doc.text(String(totalCount), pageWidth / 2, y, { align: 'center' });
    doc.text(formatCurrency(totalRev), pageWidth - 16, y, { align: 'right' });

    doc.save(`laporan-${MONTH_SHORT[selectedMonth].toLowerCase()}-${selectedYear}.pdf`);
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
              {paidInvoices.length > 0 && (
                <Button variant="outline-light" size="sm" className="mt-4" onClick={handleExportPDF}>
                  <Download className="w-4 h-4 mr-1" />
                  Download PDF
                </Button>
              )}
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
                label={`Pendapatan ${selectedMonthLabel}`}
                value={formatCurrency(stats.selectedMonthRevenue)}
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

                <div className="flex items-center gap-3 flex-wrap">
                  {/* View mode toggle */}
                  <div className="flex bg-muted rounded-full p-1">
                    <button
                      onClick={() => setViewMode('monthly')}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        viewMode === 'monthly'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Bulanan
                    </button>
                    <button
                      onClick={() => setViewMode('yearly')}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        viewMode === 'yearly'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Tahunan
                    </button>
                  </div>

                  {viewMode === 'monthly' && (
                    <div className="flex items-center gap-2">
                      <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                        <SelectTrigger className="w-[130px] h-9 rounded-full text-xs font-medium">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTH_NAMES.map((m, i) => (
                            <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                        <SelectTrigger className="w-[90px] h-9 rounded-full text-xs font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableYears.map((y) => (
                            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      {monthlyData.map((row, idx) => (
                        <tr
                          key={row.name}
                          className={`border-b border-border/50 transition-colors ${
                            idx === selectedMonth ? 'bg-accent/5 font-semibold' : 'hover:bg-secondary/50'
                          }`}
                        >
                          <td className="py-3 px-2 font-medium text-foreground">{MONTH_NAMES[idx]}</td>
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
