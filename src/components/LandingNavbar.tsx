import { Link, useLocation } from 'react-router-dom';
import { FileText, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LandingNavbar = () => {
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/#features', label: 'Fitur' },
    { path: '/#how-it-works', label: 'Cara Kerja' },
  ];

  const scrollToSection = (hash: string) => {
    const element = document.querySelector(hash);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-card group-hover:shadow-glow transition-shadow duration-300">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">
              Invoice<span className="text-accent">Kece</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => {
                  if (link.path.includes('#')) {
                    scrollToSection(link.path.replace('/', ''));
                  }
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  location.pathname === link.path && !link.path.includes('#')
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* CTA Button */}
          <div className="flex items-center gap-3">
            <Link to="/pin-login">
              <Button variant="hero" size="default">
                <LogIn className="w-4 h-4" />
                Masuk Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;
