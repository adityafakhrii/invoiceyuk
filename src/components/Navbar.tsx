import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Receipt, FileEdit, History, LayoutDashboard, LogOut, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import logoInvoiceYuk from '@/assets/logo-invoiceyuk.png';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/buat-invoice', label: 'Invoice', icon: Receipt },
    { path: '/buat-quotation', label: 'Quotation', icon: FileEdit },
    { path: '/riwayat', label: 'Riwayat', icon: History },
    { path: '/laporan', label: 'Laporan', icon: BarChart3 },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b-2 border-primary">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <img src={logoInvoiceYuk} alt="InvoiceYuk Logo" className="h-10 w-10 rounded-lg border-2 border-primary" />
            <div className="flex flex-col leading-tight">
              <span className="font-extrabold text-xl tracking-tight text-primary">InvoiceYuk</span>
              <span className="text-[10px] font-bold text-muted-foreground hidden sm:block uppercase tracking-wider">Bikin Invoice, Gampang Banget!</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold transition-all duration-150 border-2",
                  location.pathname === link.path
                    ? "bg-primary text-primary-foreground border-primary shadow-neo-sm"
                    : "text-navy-500 border-transparent hover:text-primary hover:bg-secondary hover:border-primary/40"
                )}
              >
                <span className="flex items-center gap-2">
                  {link.icon && <link.icon className="w-4 h-4" />}
                  {link.label}
                </span>
              </Link>
            ))}
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user && (
              <>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-foreground">{user.name}</p>
                  <p className="text-xs font-semibold text-muted-foreground capitalize">{user.role}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="border-2 border-transparent hover:border-primary hover:bg-secondary transition-all">
                  <LogOut className="w-4 h-4 text-primary" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t-2 border-primary bg-card">
        <div className="flex justify-around py-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all",
                location.pathname === link.path
                  ? "text-primary scale-105"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <link.icon className="w-4.5 h-4.5" />
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
