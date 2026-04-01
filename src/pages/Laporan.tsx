import { useEffect, useMemo, useState } from 'react';

import { BarChart3, TrendingUp, TrendingDown, DollarSign, FileText, Calendar, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '@/components/Navbar';
import { useInvoiceStore } from '@/store/invoiceStore';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, calculateTotal } from '@/lib/invoice';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type ViewMode = 'monthly' | 'yearly';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

const Laporan = () => {
  const { invoices, fetchInvoices } = useInvoiceStore();
  const { user } = useAuthStore();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(new Date().getMonth());
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (user && !hasFetched) {
      fetchInvoices(user.id);
      setHasFetched(true);
    }
  }, [user, fetchInvoices, hasFetched]);

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
    return SHORT_MONTH_NAMES.map((name, idx) => {
      const monthInvoices = paidInvoices.filter((inv) => {
        const d = new Date(inv.invoiceDate);
        return d.getFullYear() === selectedYear && d.getMonth() === idx;
      });
      const revenue = monthInvoices.reduce((sum, inv) => sum + calculateTotal(inv.items, inv.tax), 0);
      return { name, revenue, count: monthInvoices.length };
    });
  }, [paidInvoices, selectedYear]);

  const dailyData = useMemo(() => {
    if (selectedMonth === 'all') return [];
    
    // Get number of days in the selected month and year
    const daysInMonth = new Date(selectedYear, (selectedMonth as number) + 1, 0).getDate();
    
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dayInvoices = paidInvoices.filter((inv) => {
        const d = new Date(inv.invoiceDate);
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth && d.getDate() === day;
      });
      const revenue = dayInvoices.reduce((sum, inv) => sum + calculateTotal(inv.items, inv.tax), 0);
      return { name: String(day), revenue, count: dayInvoices.length };
    });
  }, [paidInvoices, selectedYear, selectedMonth]);

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

  const chartData = viewMode === 'yearly' ? yearlyData : (selectedMonth === 'all' ? monthlyData : dailyData);

  const stats = useMemo(() => {
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + calculateTotal(inv.items, inv.tax), 0);

    let dynamicLabel = '';
    let dynamicRevenue = 0;

    if (viewMode === 'yearly') {
      dynamicLabel = 'Total Keseluruhan';
      dynamicRevenue = totalRevenue;
    } else {
      if (selectedMonth === 'all') {
        dynamicLabel = `Pendapatan ${selectedYear}`;
        const thisYearInvoices = paidInvoices.filter(
          (inv) => new Date(inv.invoiceDate).getFullYear() === selectedYear
        );
        dynamicRevenue = thisYearInvoices.reduce((sum, inv) => sum + calculateTotal(inv.items, inv.tax), 0);
      } else {
        dynamicLabel = `Pendapatan ${MONTH_NAMES[selectedMonth]}`;
        const thisMonthInvoices = paidInvoices.filter((inv) => {
          const d = new Date(inv.invoiceDate);
          return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
        });
        dynamicRevenue = thisMonthInvoices.reduce((sum, inv) => sum + calculateTotal(inv.items, inv.tax), 0);
      }
    }

    const currentMonth = new Date().getMonth();
    const thisMonthRevenue = monthlyData[currentMonth]?.revenue || 0;
    const lastMonthRevenue = currentMonth > 0 ? (monthlyData[currentMonth - 1]?.revenue || 0) : 0;

    const growth = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : thisMonthRevenue > 0 ? 100 : 0;

    return { totalRevenue, dynamicLabel, dynamicRevenue, growth, paidCount: paidInvoices.length };
  }, [paidInvoices, monthlyData, selectedYear, selectedMonth, viewMode]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-elegant">
        <p className="text-sm font-semibold text-foreground mb-1">
          {viewMode === 'monthly' && selectedMonth !== 'all' ? `Tanggal ${label}` : label}
        </p>
        <p className="text-sm text-accent font-bold">{formatCurrency(payload[0].value)}</p>
        <p className="text-xs text-muted-foreground">{payload[0].payload.count} invoice</p>
      </div>
    );
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const data = chartData;
    const title = viewMode === 'yearly' ? 'Laporan Keuangan Tahunan' 
      : (selectedMonth === 'all' ? `Laporan Keuangan - Tahun ${selectedYear}` : `Laporan Keuangan - ${MONTH_NAMES[selectedMonth as number]} ${selectedYear}`);

    // Title
    doc.setFontSize(18);
    doc.text(title, pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth / 2, 28, { align: 'center' });

    // Summary
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text('Ringkasan', 14, 42);
    doc.setFontSize(10);
    doc.text(`Total Pendapatan: ${formatCurrency(stats.totalRevenue)}`, 14, 50);
    doc.text(`${stats.dynamicLabel}: ${formatCurrency(stats.dynamicRevenue)}`, 14, 57);
    doc.text(`Invoice Dibayar: ${stats.paidCount}`, 14, 64);
    doc.text(`Pertumbuhan Bulan Ini: ${stats.growth >= 0 ? '+' : ''}${stats.growth.toFixed(1)}%`, 14, 71);

    // Table header
    let y = 85;
    doc.setFillColor(240, 240, 245);
    doc.rect(14, y - 5, pageWidth - 28, 8, 'F');
    doc.setFontSize(10);
    doc.setFont(undefined!, 'bold');
    doc.text('Periode', 16, y);
    doc.text('Jumlah Invoice', pageWidth / 2, y, { align: 'center' });
    doc.text('Pendapatan', pageWidth - 16, y, { align: 'right' });

    // Table rows
    doc.setFont(undefined!, 'normal');
    y += 10;
    let totalRev = 0;
    let totalCount = 0;
    data.forEach((row) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const labelText = viewMode === 'monthly' && selectedMonth !== 'all' ? `Tanggal ${row.name}` : row.name;
      doc.text(labelText, 16, y);
      doc.text(String(row.count), pageWidth / 2, y, { align: 'center' });
      doc.text(row.revenue > 0 ? formatCurrency(row.revenue) : '-', pageWidth - 16, y, { align: 'right' });
      totalRev += row.revenue;
      totalCount += row.count;
      y += 8;
    });

    // Total row
    y += 2;
    doc.setDrawColor(200);
    doc.line(14, y - 5, pageWidth - 14, y - 5);
    doc.setFont(undefined!, 'bold');
    doc.text('Total', 16, y);
    doc.text(String(totalCount), pageWidth / 2, y, { align: 'center' });
    doc.text(formatCurrency(totalRev), pageWidth - 16, y, { align: 'right' });

    doc.save(`laporan-keuangan${viewMode === 'yearly' ? '' : `-${selectedYear}`}.pdf`);
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
                label={stats.dynamicLabel}
                value={formatCurrency(stats.dynamicRevenue)}
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
                    {viewMode === 'monthly' ? (selectedMonth === 'all' ? `Pendapatan bulanan tahun ${selectedYear}` : `Pendapatan harian ${MONTH_NAMES[selectedMonth as number]} ${selectedYear}`) : 'Pendapatan per tahun'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex bg-secondary/70 rounded-xl p-1 shadow-inner border border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('monthly')}
                      className={cn("text-xs rounded-lg px-4 h-8 transition-all hover:bg-transparent", viewMode === 'monthly' ? 'bg-navy-900 text-white shadow-md hover:bg-navy-800' : 'text-muted-foreground hover:text-foreground')}
                    >
                      Bulanan
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('yearly')}
                      className={cn("text-xs rounded-lg px-4 h-8 transition-all hover:bg-transparent", viewMode === 'yearly' ? 'bg-navy-900 text-white shadow-md hover:bg-navy-800' : 'text-muted-foreground hover:text-foreground')}
                    >
                      Tahunan
                    </Button>
                  </div>

                  {viewMode === 'monthly' && (
                    <div className="flex items-center gap-2 bg-secondary/30 p-1 rounded-xl border border-border/50">
                      <Calendar className="w-4 h-4 ml-2 text-muted-foreground" />
                      
                      <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
                        <SelectTrigger className="w-[90px] h-8 bg-white dark:bg-slate-900 border-navy-200">
                          <SelectValue placeholder="Tahun" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableYears.map(y => (
                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(v === 'all' ? 'all' : Number(v))}>
                        <SelectTrigger className="w-[140px] h-8 bg-white dark:bg-slate-900 border-navy-200">
                          <SelectValue placeholder="Bulan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Bulan</SelectItem>
                          {MONTH_NAMES.map((m, idx) => (
                            <SelectItem key={m} value={idx.toString()}>{m}</SelectItem>
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
                      tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}jt` : (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
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

            {/* Breakdown Table */}
            {viewMode === 'monthly' && (
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Detail {selectedMonth === 'all' ? `Bulanan ${selectedYear}` : `Harian ${MONTH_NAMES[selectedMonth as number]} ${selectedYear}`}
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium">Periode</th>
                        <th className="text-right py-3 px-2 text-muted-foreground font-medium">Invoice</th>
                        <th className="text-right py-3 px-2 text-muted-foreground font-medium">Pendapatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((row) => (
                        <tr key={row.name} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                          <td className="py-3 px-2 font-medium text-foreground">
                            {selectedMonth === 'all' ? row.name : `Tanggal ${row.name}`}
                          </td>
                          <td className="py-3 px-2 text-right text-muted-foreground">{row.count}</td>
                          <td className="py-3 px-2 text-right font-semibold text-foreground">
                            {row.revenue > 0 ? formatCurrency(row.revenue) : '-'}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-primary/5">
                        <td className="py-3 px-2 font-bold text-foreground">Total</td>
                        <td className="py-3 px-2 text-right font-bold text-foreground">
                          {chartData.reduce((s, r) => s + r.count, 0)}
                        </td>
                        <td className="py-3 px-2 text-right font-bold text-accent">
                          {formatCurrency(chartData.reduce((s, r) => s + r.revenue, 0))}
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
