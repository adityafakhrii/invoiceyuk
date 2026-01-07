import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const PinLogin = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePinComplete = async (value: string) => {
    if (value.length !== 6) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('verify_pin', { _pin: value });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const userData = data[0];
        login({
          id: userData.user_id,
          name: userData.user_name,
          role: userData.user_role || 'user',
        });
        toast({ title: 'Login berhasil!', description: `Selamat datang, ${userData.user_name}` });
        navigate('/dashboard');
      } else {
        toast({ 
          title: 'PIN Salah', 
          description: 'PIN yang kamu masukkan tidak valid', 
          variant: 'destructive' 
        });
        setPin('');
      }
    } catch (error) {
      console.error('Login error:', error);
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
              Masukkan PIN 6 digit untuk mengakses dashboard
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 shadow-card">
            <div className="flex flex-col items-center gap-6">
              <InputOTP 
                maxLength={6} 
                value={pin} 
                onChange={setPin}
                onComplete={handlePinComplete}
                disabled={isLoading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>

              {isLoading && (
                <p className="text-sm text-muted-foreground animate-pulse">
                  Memverifikasi PIN...
                </p>
              )}

              <p className="text-xs text-muted-foreground text-center">
                Hubungi admin jika kamu belum memiliki PIN akses
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <Link to="/" className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">
                Invoice<span className="text-accent">Kece</span>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinLogin;
