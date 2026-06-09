import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, LayoutDashboard, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import logoInvoiceYuk from '@/assets/logo-invoiceyuk.png';

const LandingNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
            <img src={logoInvoiceYuk} alt="InvoiceYuk Logo" className="h-10 w-10 rounded-none border-2 border-primary" />
            <div className="leading-tight">
              <span className="font-black text-xl text-primary uppercase tracking-tight group-hover:text-accent transition-colors">InvoiceYuk</span>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider hidden sm:block">Bikin Invoice, Gampang Banget!</p>
            </div>
          </Link>
 
          {/* Navigation Links (Desktop) */}
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
 
          {/* CTA Button & Hamburger */}
          <div className="flex items-center gap-3">
            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
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

            {/* Hamburger Button */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden border-2 border-primary rounded-none shadow-neo-sm h-10 w-10 flex items-center justify-center bg-white hover:bg-secondary transition-all"
              aria-label="Toggle Menu"
            >
              {isMobileOpen ? (
                <X className="w-5 h-5 text-primary" />
              ) : (
                <Menu className="w-5 h-5 text-primary" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 top-16 bg-navy-950/20 backdrop-blur-[2px] z-30" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-card border-b-2 border-primary z-40 p-6 flex flex-col gap-4 shadow-neo animate-slide-in">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => {
                  setIsMobileOpen(false);
                  handleNavClick(link.path);
                }}
                className="w-full text-left py-2.5 px-4 border-2 border-transparent hover:border-primary hover:bg-secondary font-bold text-navy-700 transition-all text-sm rounded-none"
              >
                {link.label}
              </button>
            ))}
          </nav>
          <div className="border-t border-primary/10 pt-4 mt-2">
            <Link to={user ? "/dashboard" : "/login"} onClick={() => setIsMobileOpen(false)}>
              <Button variant="default" size="default" className="w-full justify-center shadow-neo">
                {user ? <LayoutDashboard className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                {user ? 'Ke Dashboard' : 'Coba Sekarang'}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default LandingNavbar;
