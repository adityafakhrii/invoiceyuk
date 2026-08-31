import { useEffect, useMemo, useState } from 'react';

import { BarChart3, TrendingUp, TrendingDown, DollarSign, FileText, Calendar, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useInvoiceStore } from '@/store/invoiceStore';
import { useAuthStore } from '@/store/authStore';
import { Invoice, formatCurrency, calculateTotal } from '@/lib/invoice';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import logoInvoiceYuk from '@/assets/logo-invoiceyuk.png';

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
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (user && !hasFetched) {
      fetchInvoices(user.id);
      setHasFetched(true);
    }
  }, [user, fetchInvoices, hasFetched]);

  const getInvPaidAmount = (inv: Invoice) => {
    if (inv.status === 'paid') return calculateTotal(inv.items, inv.tax, inv.taxType, inv.currency);
    if (inv.status === 'paid_dp') return inv.downPayment || 0;
    return 0;
  };

  const paidInvoices = useMemo(
    () => invoices.filter((inv) => inv.status === 'paid' || (inv.status === 'paid_dp' && (inv.downPayment || 0) > 0)),
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
      const revenue = monthInvoices.reduce((sum, inv) => sum + getInvPaidAmount(inv), 0);
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
      const revenue = dayInvoices.reduce((sum, inv) => sum + getInvPaidAmount(inv), 0);
      return { name: String(day), revenue, count: dayInvoices.length };
    });
  }, [paidInvoices, selectedYear, selectedMonth]);

  const yearlyData = useMemo(() => {
    return availableYears
      .map((year) => {
        const yearInvoices = paidInvoices.filter(
          (inv) => new Date(inv.invoiceDate).getFullYear() === year
        );
        const revenue = yearInvoices.reduce((sum, inv) => sum + getInvPaidAmount(inv), 0);
        return { name: String(year), revenue, count: yearInvoices.length };
      })
      .reverse();
  }, [paidInvoices, availableYears]);

  const chartData = viewMode === 'yearly' ? yearlyData : (selectedMonth === 'all' ? monthlyData : dailyData);

  const stats = useMemo(() => {
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + getInvPaidAmount(inv), 0);

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
        dynamicRevenue = thisYearInvoices.reduce((sum, inv) => sum + getInvPaidAmount(inv), 0);
      } else {
        dynamicLabel = `Pendapatan ${MONTH_NAMES[selectedMonth]}`;
        const thisMonthInvoices = paidInvoices.filter((inv) => {
          const d = new Date(inv.invoiceDate);
          return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
        });
        dynamicRevenue = thisMonthInvoices.reduce((sum, inv) => sum + getInvPaidAmount(inv), 0);
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

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: { count: number } }[]; label?: string }) => {
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
    const data = chartData;
    const title = viewMode === 'yearly' ? 'LAPORAN TAHUNAN' 
      : (selectedMonth === 'all' ? 'LAPORAN TAHUNAN' : 'LAPORAN BULANAN');
    const subtitle = viewMode === 'yearly' ? 'Ringkasan Pendapatan Tahunan'
      : (selectedMonth === 'all' ? `Tahun ${selectedYear}` : `${MONTH_NAMES[selectedMonth as number]} ${selectedYear}`);

    const generatePdf = (logoImg?: HTMLImageElement) => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const leftMargin = 14;
      const rightMargin = 14;
      const contentWidth = pageWidth - leftMargin - rightMargin;

      // 1. Branding Header (Logo + Brand Name)
      if (logoImg) {
        // Draw black border around logo
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.4);
        doc.rect(leftMargin, 15, 11, 11, 'D');
        // Add logo image
        doc.addImage(logoImg, 'PNG', leftMargin + 0.5, 15.5, 10, 10);
        
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(27, 41, 75); // Dark Navy
        doc.text('INVOICEYUK', leftMargin + 14, 22.5);
      } else {
        // Fallback text logo
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(27, 41, 75);
        doc.text('INVOICEYUK', leftMargin, 22.5);
      }

      // 2. Report Metadata (Right Aligned)
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(title, pageWidth - rightMargin, 20, { align: 'right' });

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(100, 100, 100);
      doc.text(subtitle, pageWidth - rightMargin, 25.5, { align: 'right' });

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(140, 140, 140);
      const printedDate = `Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      doc.text(printedDate, pageWidth - rightMargin, 30, { align: 'right' });

      // 3. Thick Neo-Brutalist Separator Line
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(1.0);
      doc.line(leftMargin, 34, pageWidth - rightMargin, 34);

      // 4. Stats Summary Cards (Ringkasan)
      const cardY = 40;
      const cardH = 15;
      const cardW = (contentWidth - 9) / 4; // 4 cards with 3 gaps of 3mm

      const drawStatsCard = (x: number, y: number, w: number, h: number, cardTitle: string, cardValue: string, isAccent = false) => {
        // Draw solid black shadow
        doc.setFillColor(0, 0, 0);
        doc.rect(x + 0.8, y + 0.8, w, h, 'F');

        // Draw main card
        if (isAccent) {
          doc.setFillColor(240, 244, 248);
        } else {
          doc.setFillColor(255, 255, 255);
        }
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.4);
        doc.rect(x, y, w, h, 'FD');

        // Draw card value
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(0, 0, 0);
        doc.text(cardValue, x + 3, y + 6, { maxWidth: w - 6 });

        // Draw card label
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(6.0);
        doc.setTextColor(120, 120, 120);
        doc.text(cardTitle.toUpperCase(), x + 3, y + 11.5);
      };

      drawStatsCard(leftMargin, cardY, cardW, cardH, 'Total Pendapatan', formatCurrency(stats.totalRevenue), true);
      drawStatsCard(leftMargin + cardW + 3, cardY, cardW, cardH, stats.dynamicLabel, formatCurrency(stats.dynamicRevenue));
      drawStatsCard(leftMargin + 2 * (cardW + 3), cardY, cardW, cardH, 'Pertumbuhan', `${stats.growth >= 0 ? '+' : ''}${stats.growth.toFixed(1)}%`);
      drawStatsCard(leftMargin + 3 * (cardW + 3), cardY, cardW, cardH, 'Invoice Dibayar', String(stats.paidCount));

      // 5. Data Table
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(27, 41, 75);
      doc.text('RINCIAN PENDAPATAN', leftMargin, 63);

      let tableY = 68;
      const colWidths = [65, 47, 70]; // Total 182mm (leftMargin=14, rightMargin=14 -> contentWidth=182)

      // Draw table header
      doc.setFillColor(27, 41, 75); // Dark Navy
      doc.rect(leftMargin, tableY, contentWidth, 7.5, 'F');
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text('PERIODE', leftMargin + 4, tableY + 5);
      doc.text('INVOICE DIBAYAR', leftMargin + colWidths[0] + colWidths[1] / 2, tableY + 5, { align: 'center' });
      doc.text('PENDAPATAN', leftMargin + colWidths[0] + colWidths[1] + colWidths[2] - 4, tableY + 5, { align: 'right' });

      // Draw table rows
      tableY += 7.5;
      doc.setTextColor(0, 0, 0);

      let totalRev = 0;
      let totalCount = 0;

      data.forEach((row, idx) => {
        if (tableY > 275) {
          doc.addPage();
          tableY = 20;
        }

        // Zebra striping background
        if (idx % 2 === 1) {
          doc.setFillColor(245, 247, 251); // Very light grey/blue
          doc.rect(leftMargin, tableY, contentWidth, 6.5, 'F');
        }

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        const labelText = viewMode === 'monthly' && selectedMonth !== 'all' ? `Tanggal ${row.name}` : row.name;
        doc.text(labelText, leftMargin + 4, tableY + 4.5);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(String(row.count), leftMargin + colWidths[0] + colWidths[1] / 2, tableY + 4.5, { align: 'center' });
        doc.text(row.revenue > 0 ? formatCurrency(row.revenue) : '-', leftMargin + colWidths[0] + colWidths[1] + colWidths[2] - 4, tableY + 4.5, { align: 'right' });

        // Row bottom border line
        doc.setDrawColor(230, 235, 243);
        doc.setLineWidth(0.25);
        doc.line(leftMargin, tableY + 6.5, pageWidth - rightMargin, tableY + 6.5);

        totalRev += row.revenue;
        totalCount += row.count;
        tableY += 6.5;
      });

      // Draw double border / total row
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.line(leftMargin, tableY, pageWidth - rightMargin, tableY);

      doc.setFillColor(235, 239, 247);
      doc.rect(leftMargin, tableY, contentWidth, 7.5, 'F');

      doc.setLineWidth(0.4);
      doc.line(leftMargin, tableY + 7.5, pageWidth - rightMargin, tableY + 7.5);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(27, 41, 75);
      doc.text('TOTAL', leftMargin + 4, tableY + 5);
      doc.text(String(totalCount), leftMargin + colWidths[0] + colWidths[1] / 2, tableY + 5, { align: 'center' });
      doc.text(formatCurrency(totalRev), leftMargin + colWidths[0] + colWidths[1] + colWidths[2] - 4, tableY + 5, { align: 'right' });

      // Save PDF
      const filename = viewMode === 'yearly' ? `laporan-tahunan-${selectedYear}.pdf`
        : (selectedMonth === 'all' ? `laporan-bulanan-${selectedYear}.pdf` : `laporan-bulanan-${selectedYear}-${selectedMonth as number + 1}.pdf`);
      doc.save(filename);
    };

    // Load the logo image asynchronously and call generatePdf
    const img = new Image();
    img.src = logoInvoiceYuk;
    img.onload = () => generatePdf(img);
    img.onerror = () => generatePdf();
  };

  return (
    <div className="w-full">
      <div className="pb-10">
        <div className="w-full">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-4xl font-black text-primary uppercase tracking-tight mb-3">
                Laporan Keuangan
              </h1>
              <p className="text-navy-700 font-semibold text-sm">
                Pantau pendapatan bisnis lo dari invoice yang sudah dibayar
              </p>
              {paidInvoices.length > 0 && (
                <Button variant="outline" size="sm" className="mt-4" onClick={handleExportPDF}>
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
            <div className="bg-card rounded-xl border-2 border-primary p-6 shadow-neo mb-8">
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
              <div className="bg-card rounded-xl border-2 border-primary p-6 shadow-neo">
                <h2 className="text-xl font-black text-primary mb-6 flex items-center gap-2 uppercase tracking-tight">
                  Detail {selectedMonth === 'all' ? `Bulanan ${selectedYear}` : `Harian ${MONTH_NAMES[selectedMonth as number]} ${selectedYear}`}
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-primary bg-secondary/50">
                        <th className="text-left py-3 px-4 text-primary font-bold uppercase tracking-wider text-xs">Periode</th>
                        <th className="text-right py-3 px-4 text-primary font-bold uppercase tracking-wider text-xs">Invoice</th>
                        <th className="text-right py-3 px-4 text-primary font-bold uppercase tracking-wider text-xs">Pendapatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((row) => (
                        <tr key={row.name} className="border-b-2 border-navy-100 hover:bg-secondary/40 transition-colors">
                          <td className="py-3 px-4 font-bold text-primary">
                            {selectedMonth === 'all' ? row.name : `Tanggal ${row.name}`}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-muted-foreground">{row.count}</td>
                          <td className="py-3 px-4 text-right font-extrabold text-primary">
                            {row.revenue > 0 ? formatCurrency(row.revenue) : '-'}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-secondary/70 border-t-2 border-primary font-bold">
                        <td className="py-3 px-4 font-black text-primary uppercase">Total</td>
                        <td className="py-3 px-4 text-right font-black text-primary">
                          {chartData.reduce((s, r) => s + r.count, 0)}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-accent">
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
      </div>
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
  <div className="bg-card rounded-xl border-2 border-primary p-4 shadow-neo">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg border-2 border-primary ${bgClass} flex items-center justify-center flex-shrink-0 shadow-neo-sm`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xl font-black text-primary truncate leading-tight mb-0.5">{value}</p>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
    </div>
  </div>
);

export default Laporan;
