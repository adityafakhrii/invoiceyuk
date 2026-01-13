import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import logoInvoiceYuk from '@/assets/logo-invoiceyuk.png';
import { logErrorSecurely } from '@/lib/errors';

const PinLogin = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast({ title: 'Error', description: 'Username wajib diisi', variant: 'destructive' });
      return;
    }
    
    if (pin.length !== 6) {
      toast({ title: 'Error', description: 'PIN harus 6 digit', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('verify_pin', { 
        _username: username.trim().toLowerCase(),
        _pin: pin 
      });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const userData = data[0];
        login({
          id: userData.user_id,
          name: userData.user_name,
          username: username.trim().toLowerCase(),
          role: userData.user_role || 'user',
        });
        toast({ title: 'Login berhasil!', description: `Selamat datang, ${userData.user_name}` });
        navigate('/dashboard');
      } else {
        toast({ 
          title: 'Login Gagal', 
          description: 'Username atau PIN salah', 
          variant: 'destructive' 
        });
        setPin('');
      }
    } catch (error) {
      logErrorSecurely('handleLogin', error);
      toast({ 
        title: 'Error', 
        description: 'Terjadi kesalahan saat login', 
        variant: 'destructive' 
      });
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Home
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-6">
              <Lock className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Masuk ke Dashboard
            </h1>
            <p className="text-muted-foreground">
              Masukkan username dan PIN untuk mengakses dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="bg-card rounded-2xl border border-border p-8 shadow-card">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    placeholder="Masukkan username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin">PIN (6 digit)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="pin"
                    type={showPin ? 'text' : 'password'}
                    maxLength={6}
                    placeholder="******"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Memverifikasi...' : 'Masuk'}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Hubungi admin jika kamu belum memiliki akun
              </p>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <Link to="/" className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <img src={logoInvoiceYuk} alt="InvoiceYuk Logo" className="h-8 w-8 rounded-lg" />
              <span className="font-semibold text-foreground">InvoiceYuk</span>
            </Link>
            <p className="text-xs text-muted-foreground mt-2">Bikin Invoice, Gampang Banget!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinLogin;
