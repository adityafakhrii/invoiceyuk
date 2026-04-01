import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Receipt, FileEdit, History, Users, LogOut, LayoutDashboard, ArrowRight, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useInvoiceStore } from "@/store/invoiceStore";
import logoInvoiceYuk from "@/assets/logo-invoiceyuk.png";
import InvoiceReminderBanner from "@/components/InvoiceReminderBanner";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { invoices, fetchInvoices, clearInvoices, isLoading } = useInvoiceStore();
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (user && !hasFetched) {
      fetchInvoices(user.id);
      setHasFetched(true);
    }
  }, [user, fetchInvoices, hasFetched]);

  const handleLogout = () => {
    clearInvoices();
    logout();
    navigate("/");
  };

  const unpaidCount = invoices.filter((inv) => inv.status === "unpaid").length;
  const paidCount = invoices.filter((inv) => inv.status === "paid").length;

  const menuItems = [
    {
      icon: Receipt,
      title: "Buat Invoice",
      description: "Buat invoice profesional dalam hitungan detik",
      to: "/buat-invoice",
      color: "bg-accent/10 text-accent",
    },
    {
      icon: FileEdit,
      title: "Buat Quotation",
      description: "Buat penawaran harga untuk klien potensial",
      to: "/buat-quotation",
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      icon: History,
      title: "Riwayat Dokumen",
      description: "Lihat semua invoice & quotation yang sudah dibuat",
      to: "/riwayat",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: User,
      title: "Pengaturan Profil",
      description: "Ubah nama, username, dan PIN",
      to: "/profile",
      color: "bg-green-500/10 text-green-500",
    },
  ];

  if (user?.role === "admin") {
    menuItems.push({
      icon: Users,
      title: "Kelola User",
      description: "Tambah dan kelola user",
      to: "/admin/users",
      color: "bg-cyan-500/10 text-cyan-500",
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={logoInvoiceYuk} alt="InvoiceYuk Logo" className="h-9 w-auto" />
              <div>
                <span className="font-bold text-xl tracking-tight" style={{ color: "hsl(var(--primary))" }}>
                  InvoiceYuk
                </span>
                <p className="text-xs text-muted-foreground">Bikin Invoice, Gampang Banget!</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/profile" className="text-right hidden sm:block hover:opacity-80 transition-opacity">
                <p className="text-sm font-medium text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground">@{user?.username}</p>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Selamat datang, {user?.name}!</h1>
          <p className="text-muted-foreground">Kelola semua invoice bisnis kamu dari sini</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-xl border border-border p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-primary" />
              </div>
              <div>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{invoices.length}</p>
                )}
                <p className="text-xs text-muted-foreground">Total Invoice</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{unpaidCount}</p>
                )}
                <p className="text-xs text-muted-foreground">Belum Dibayar</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-green-500" />
              </div>
              <div>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{paidCount}</p>
                )}
                <p className="text-xs text-muted-foreground">Sudah Dibayar</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground capitalize">{user?.role}</p>
                <p className="text-xs text-muted-foreground">Role Kamu</p>
              </div>
            </div>
          </div>
        </div>

        {/* Overdue Reminders */}
        <InvoiceReminderBanner invoices={invoices} />

        {/* Menu Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item) => (
            <Link key={item.to} to={item.to}>
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card hover:shadow-elegant hover:border-accent/30 transition-all duration-300 h-full group">
                <div
                  className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                  {item.title}
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
