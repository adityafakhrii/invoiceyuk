import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, Lock, ArrowLeft, HelpCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const PinLogin = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot PIN dialog
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotName, setForgotName] = useState('');
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);

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

  const handleForgotPin = async () => {
    if (!forgotName.trim()) {
      toast({ 
        title: 'Error', 
        description: 'Masukkan nama kamu terlebih dahulu', 
        variant: 'destructive' 
      });
      return;
    }

    setIsSubmittingForgot(true);
    try {
      // Find user by name
      const { data: users, error: findError } = await supabase
        .from('pin_users')
        .select('id, name')
        .ilike('name', forgotName.trim());

      if (findError) throw findError;

      if (!users || users.length === 0) {
        toast({ 
          title: 'User tidak ditemukan', 
          description: 'Nama yang kamu masukkan tidak terdaftar', 
          variant: 'destructive' 
        });
        return;
      }

      const userId = users[0].id;

      // Request PIN reset
      const { error } = await supabase.rpc('request_pin_reset', { _user_id: userId });

      if (error) {
        if (error.message.includes('Pending request already exists')) {
          toast({ 
            title: 'Permintaan Sudah Ada', 
            description: 'Kamu sudah mengajukan reset PIN. Tunggu admin untuk memprosesnya.', 
          });
        } else {
          throw error;
        }
      } else {
        toast({ 
          title: 'Permintaan Terkirim!', 
          description: 'Admin akan segera memproses permintaan reset PIN kamu.' 
        });
      }

      setIsForgotOpen(false);
      setForgotName('');
    } catch (error) {
      console.error('Forgot PIN error:', error);
      toast({ 
        title: 'Error', 
        description: 'Gagal mengirim permintaan reset PIN', 
        variant: 'destructive' 
      });
    } finally {
      setIsSubmittingForgot(false);
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

              <button
                type="button"
                onClick={() => setIsForgotOpen(true)}
                className="text-sm text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
              >
                <HelpCircle className="w-4 h-4" />
                Lupa PIN?
              </button>

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

      {/* Forgot PIN Dialog */}
      <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lupa PIN</DialogTitle>
            <DialogDescription>
              Masukkan nama kamu untuk mengajukan reset PIN. Admin akan memproses permintaan kamu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="forgotName">Nama Kamu</Label>
              <Input
                id="forgotName"
                placeholder="Contoh: John Doe"
                value={forgotName}
                onChange={(e) => setForgotName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsForgotOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleForgotPin} disabled={isSubmittingForgot}>
              {isSubmittingForgot && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Ajukan Reset PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PinLogin;
