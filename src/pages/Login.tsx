import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { translateError } from '@/lib/utils';
import logoInvoiceYuk from '@/assets/logo-invoiceyuk.png';
import { useAuthStore } from '@/store/authStore';

const Login = () => {
  const navigate = useNavigate();
  const checkSession = useAuthStore((state) => state.checkSession);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({ title: 'Error', description: 'Email wajib diisi', variant: 'destructive' });
      return;
    }
    
    if (!password) {
      toast({ title: 'Error', description: 'Password wajib diisi', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });
      
      if (error) throw error;
      
      // Update state in Zustand store
      await checkSession();
      
      toast({ title: 'Login Berhasil! 🎉', description: 'Selamat datang kembali di InvoiceYuk' });
      navigate('/dashboard');
    } catch (error) {
      const err = error as Error;
      toast({ 
        title: 'Login Gagal', 
        description: translateError(err.message), 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link to="/">
          <Button variant="outline" size="sm" className="bg-white gap-2 shadow-neo-sm uppercase tracking-wider text-xs">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Home
          </Button>
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center mb-6">
              <Link to="/" className="flex items-center gap-3 group">
                <img src={logoInvoiceYuk} alt="InvoiceYuk Logo" className="h-12 w-12 border-2 border-primary rounded-none" />
                <div className="text-left leading-tight">
                  <span className="font-black text-2xl text-primary uppercase tracking-tight group-hover:text-accent transition-colors">InvoiceYuk</span>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Bikin Invoice, Gampang Banget!</p>
                </div>
              </Link>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Masuk ke Dashboard
            </h1>
            <p className="text-muted-foreground">
              Gunakan akun email dan password Anda untuk masuk
            </p>
          </div>

          <form onSubmit={handleLogin} className="bg-card rounded-2xl border border-border p-8 shadow-card space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Alamat Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-10" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Memproses Masuk...
                </>
              ) : (
                'Masuk Sekarang'
              )}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Belum punya akun?{' '}
              <Link to="/register" className="text-primary hover:underline font-semibold">
                Daftar Akun Baru
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t-2 border-primary/10 bg-card text-center text-xs font-bold text-muted-foreground mt-auto animate-fade-in">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 InvoiceYuk. Bikin invoice gak pake ribet.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-primary transition-colors underline decoration-dotted">Kebijakan Privasi</Link>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <a 
              href="https://www.instagram.com/adityafakhrii" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-1 hover:text-accent transition-colors text-primary font-bold"
            >
              Made with <span className="text-red-500 animate-pulse">❤️</span> by @adityafakhrii
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
