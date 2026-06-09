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
      <header className="bg-card border-b-2 border-primary sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={logoInvoiceYuk} alt="InvoiceYuk Logo" className="h-10 w-10 border-2 border-primary rounded-lg" />
              <div>
                <span className="font-extrabold text-xl tracking-tight text-primary">
                  InvoiceYuk
                </span>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Bikin Invoice, Gampang Banget!</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/profile" className="text-right hidden sm:block hover:opacity-80 transition-opacity">
                <p className="text-sm font-bold text-foreground">{user?.name}</p>
                <p className="text-xs font-semibold text-muted-foreground">@{user?.username}</p>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="border-2 border-transparent hover:border-primary hover:bg-secondary transition-all">
                <LogOut className="w-4 h-4 text-primary" />
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
          <div className="bg-card rounded-xl border-2 border-primary p-4 shadow-neo">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border-2 border-primary bg-secondary flex items-center justify-center shadow-neo-sm">
                <Receipt className="w-5 h-5 text-primary" />
              </div>
              <div>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : (
                  <p className="text-3xl font-black text-primary leading-none mb-1">{invoices.length}</p>
                )}
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Invoice</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border-2 border-primary p-4 shadow-neo">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border-2 border-primary bg-yellow-100 flex items-center justify-center shadow-neo-sm">
                <LayoutDashboard className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : (
                  <p className="text-3xl font-black text-primary leading-none mb-1">{unpaidCount}</p>
                )}
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Belum Dibayar</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border-2 border-primary p-4 shadow-neo">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border-2 border-primary bg-green-100 flex items-center justify-center shadow-neo-sm">
                <Receipt className="w-5 h-5 text-green-600" />
              </div>
              <div>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : (
                  <p className="text-3xl font-black text-primary leading-none mb-1">{paidCount}</p>
                )}
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sudah Dibayar</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border-2 border-primary p-4 shadow-neo">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg border-2 border-primary bg-cyan-100 flex items-center justify-center shadow-neo-sm">
                <Users className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-primary leading-none mb-1 capitalize">{user?.role}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Role Kamu</p>
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
              <div className="bg-card rounded-xl border-2 border-primary p-6 shadow-neo hover:shadow-neo-accent hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all duration-150 h-full group">
                <div
                  className="w-12 h-12 rounded-lg border-2 border-primary bg-secondary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-neo-sm"
                >
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-black text-primary mb-2 flex items-center gap-2 uppercase tracking-tight">
                  {item.title}
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-sm font-semibold text-muted-foreground/80 leading-relaxed">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
