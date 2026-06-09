import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  FileEdit, 
  History, 
  BarChart3, 
  User, 
  Users, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useInvoiceStore } from '@/store/invoiceStore';
import logoInvoiceYuk from '@/assets/logo-invoiceyuk.png';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SidebarLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { clearInvoices } = useInvoiceStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    clearInvoices();
    logout();
    navigate('/');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/buat-invoice', label: 'Buat Invoice', icon: Receipt },
    { path: '/buat-quotation', label: 'Buat Quotation', icon: FileEdit },
    { path: '/riwayat', label: 'Riwayat', icon: History },
    { path: '/laporan', label: 'Laporan', icon: BarChart3 },
    { path: '/profile', label: 'Pengaturan Profil', icon: User },
  ];

  if (user?.role === 'admin') {
    navLinks.push({ path: '/admin/users', label: 'Kelola User', icon: Users });
  }

  const renderNavItems = (onItemClick?: () => void) => {
    return navLinks.map((link) => {
      const isActive = location.pathname === link.path;
      return (
        <Link
          key={link.path}
          to={link.path}
          onClick={onItemClick}
          className={cn(
            "flex items-center gap-3 px-4 py-3 font-bold border-2 text-sm transition-all duration-150 rounded-none",
            isActive
              ? "bg-primary text-primary-foreground border-primary shadow-neo-sm"
              : "text-navy-700 border-transparent hover:text-primary hover:bg-secondary hover:border-primary/40"
          )}
        >
          <link.icon className="w-5 h-5 flex-shrink-0" />
          <span>{link.label}</span>
        </Link>
      );
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile Top Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b-2 border-primary bg-card z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img src={logoInvoiceYuk} alt="InvoiceYuk Logo" className="h-9 w-9 border-2 border-primary rounded-none" />
          <div>
            <span className="font-extrabold text-lg tracking-tight text-primary">InvoiceYuk</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="border-2 border-primary rounded-none shadow-neo-sm h-10 w-10 flex items-center justify-center p-0"
        >
          {isMobileOpen ? <X className="w-5 h-5 text-primary" /> : <Menu className="w-5 h-5 text-primary" />}
        </Button>
      </header>

      {/* Desktop Permanent Sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 border-r-2 border-primary bg-card flex-col z-40 p-6 overflow-y-auto">
        {/* Branding header */}
        <div className="flex items-center gap-3 mb-10 pb-6 border-b border-primary/10">
          <img src={logoInvoiceYuk} alt="InvoiceYuk Logo" className="h-10 w-10 border-2 border-primary rounded-none" />
          <div className="flex flex-col leading-tight">
            <span className="font-black text-xl tracking-tight text-primary uppercase">InvoiceYuk</span>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Enterprise SaaS</span>
          </div>
        </div>

        {/* User profile card in sidebar */}
        <div className="border-2 border-primary bg-secondary p-3 mb-8 rounded-none shadow-neo-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">User Masuk</p>
          <p className="text-sm font-black text-primary truncate mt-1">{user?.name}</p>
          <p className="text-xs font-semibold text-navy-500 truncate">@{user?.username}</p>
        </div>

        {/* Nav list */}
        <nav className="flex flex-col gap-2">
          {renderNavItems()}
        </nav>

        {/* Destructive Logout button */}
        <button
          onClick={handleLogout}
          className="mt-auto w-full bg-destructive text-destructive-foreground border-2 border-primary shadow-neo hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_hsl(var(--primary))] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_hsl(var(--primary))] rounded-none py-2.5 text-center font-bold tracking-wider uppercase text-xs transition-all duration-150"
        >
          <span className="flex items-center justify-center gap-2">
            <LogOut className="w-4 h-4" />
            Keluar (Logout)
          </span>
        </button>
      </aside>

      {/* Mobile Drawer Navigation Menu */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-background/95 backdrop-blur-sm z-40 flex flex-col">
          <div className="flex-1 bg-card border-b-2 border-primary p-6 flex flex-col gap-6 overflow-y-auto animate-slide-in">
            {/* User profile details */}
            <div className="border-2 border-primary bg-secondary p-3 rounded-none">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">User Masuk</p>
              <p className="text-sm font-black text-primary truncate mt-1">{user?.name}</p>
              <p className="text-xs font-semibold text-navy-500 truncate">@{user?.username}</p>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col gap-2">
              {renderNavItems(() => setIsMobileOpen(false))}
            </nav>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="mt-auto w-full bg-destructive text-destructive-foreground border-2 border-primary shadow-neo hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_hsl(var(--primary))] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_hsl(var(--primary))] rounded-none py-3 text-center font-bold tracking-wider uppercase text-xs transition-all duration-150"
            >
              <span className="flex items-center justify-center gap-2">
                <LogOut className="w-4 h-4" />
                Keluar (Logout)
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen bg-background lg:pl-64 pt-20 lg:pt-8 pb-12 flex flex-col">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl flex-1 flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SidebarLayout;
