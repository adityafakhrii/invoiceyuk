import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import logoInvoiceYuk from '@/assets/logo-invoiceyuk.png';

const LandingNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/#how-it-works', label: 'Cara Kerja' },
    { path: '/#features', label: 'Fitur' },
    { path: '/#pricing', label: 'Harga' },
    { path: '/#faq', label: 'FAQ' },
  ];

  const scrollToSection = (hash: string) => {
    const element = document.querySelector(hash);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavClick = (path: string) => {
    if (path.includes('#')) {
      const hash = path.substring(path.indexOf('#'));
      if (location.pathname !== '/') {
        navigate(path);
      } else {
        scrollToSection(hash);
      }
    } else {
      if (location.pathname !== '/') {
        navigate(path);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b-2 border-primary">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logoInvoiceYuk} alt="InvoiceYuk Logo" className="h-10 w-10 rounded-lg border-2 border-primary" />
            <div className="hidden sm:block leading-tight">
              <span className="font-extrabold text-xl text-primary">InvoiceYuk</span>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Bikin Invoice, Gampang Banget!</p>
            </div>
          </Link>
 
          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNavClick(link.path)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold transition-all duration-150 border-2",
                  location.pathname === link.path && !link.path.includes('#')
                    ? "bg-primary text-primary-foreground border-primary shadow-neo-sm"
                    : "text-navy-500 border-transparent hover:text-primary hover:bg-secondary hover:border-primary/40"
                )}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* CTA Button */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard">
                <Button variant="default" size="default">
                  <LayoutDashboard className="w-4 h-4" />
                  Ke Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="default" size="default">
                  <LogIn className="w-4 h-4" />
                  Coba Sekarang
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;
