import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Briefcase, Target, ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { translateError, cn } from '@/lib/utils';
import logoInvoiceYuk from '@/assets/logo-invoiceyuk.png';

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pekerjaan, setPekerjaan] = useState('');
  const [customPekerjaan, setCustomPekerjaan] = useState('');
  const [tujuanPenggunaan, setTujuanPenggunaan] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-transparent' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    switch (score) {
      case 0:
      case 1:
        return { score, label: 'Lemah 🔴', color: 'bg-red-500' };
      case 2:
        return { score, label: 'Sedang 🟡', color: 'bg-amber-500' };
      case 3:
        return { score, label: 'Kuat 🟢', color: 'bg-green-500' };
      case 4:
      default:
        return { score, label: 'Sangat Kuat 🔥', color: 'bg-emerald-500' };
    }
  };

  const strength = getPasswordStrength(password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: Record<string, string> = {};

    // Basic Validation
    if (!name.trim()) newErrors.name = 'Nama lengkap wajib diisi';
    if (!username.trim()) {
      newErrors.username = 'Username wajib diisi';
    } else if (!/^[a-z0-9_]+$/.test(username)) {
      newErrors.username = 'Username hanya boleh huruf kecil, angka, dan underscore';
    }
    if (!email.trim()) newErrors.email = 'Alamat email wajib diisi';
    if (!password) {
      newErrors.password = 'Password wajib diisi';
    } else if (password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password tidak cocok';
    }
    if (!pekerjaan) newErrors.pekerjaan = 'Pilih pekerjaan Anda';
    if (pekerjaan === 'Lainnya' && !customPekerjaan.trim()) {
      newErrors.customPekerjaan = 'Tuliskan pekerjaan Anda';
    }
    if (!tujuanPenggunaan.trim()) newErrors.tujuanPenggunaan = 'Tujuan penggunaan wajib diisi';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: 'Formulir belum lengkap',
        description: 'Periksa kembali isian formulir Anda.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const finalPekerjaan = pekerjaan === 'Lainnya' ? customPekerjaan.trim() : pekerjaan;

      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            name: name.trim(),
            username: username.trim().toLowerCase(),
            pekerjaan: finalPekerjaan,
            tujuan_penggunaan: tujuanPenggunaan.trim(),
          },
        },
      });

      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: 'Registrasi Berhasil! 🎉',
        description: 'Tautan konfirmasi telah dikirim ke email Anda.',
      });
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Registrasi Gagal',
        description: translateError(err.message),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border p-8 rounded-2xl shadow-card text-center space-y-6 animate-scale-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-500 mb-2">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Cek Email Anda!</h1>
          <p className="text-muted-foreground leading-relaxed">
            Kami telah mengirimkan email konfirmasi ke <span className="font-semibold text-foreground">{email}</span>. 
            Silakan buka pesan tersebut dan klik tautan verifikasi di dalamnya sebelum masuk ke aplikasi.
          </p>
          <div className="pt-4 border-t border-border">
            <Link to="/login">
              <Button className="w-full">
                Kembali ke Halaman Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-primary mb-4">
              <User className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Daftar Akun Baru
            </h1>
            <p className="text-muted-foreground">
              Mulai buat dan kelola invoice secara profesional & aman
            </p>
          </div>

          <form onSubmit={handleRegister} className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card space-y-5">
            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Nama Lengkap</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Contoh: Aditya Fakhri"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <Label htmlFor="username">Username (Huruf kecil & angka)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">@</span>
                <Input
                  id="username"
                  placeholder="adityafakhri"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="pl-8"
                  disabled={isLoading}
                />
              </div>
              {errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Alamat Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
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
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
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
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                
                {password && (
                  <div className="space-y-1 mt-1.5">
                    <div className="flex gap-1 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div className={cn("h-full transition-all duration-300", 
                        strength.score >= 1 ? strength.color : "bg-transparent", 
                        strength.score >= 1 ? "w-1/4" : "w-0"
                      )} />
                      <div className={cn("h-full transition-all duration-300", 
                        strength.score >= 2 ? strength.color : "bg-transparent",
                        strength.score >= 2 ? "w-1/4" : "w-0"
                      )} />
                      <div className={cn("h-full transition-all duration-300", 
                        strength.score >= 3 ? strength.color : "bg-transparent",
                        strength.score >= 3 ? "w-1/4" : "w-0"
                      )} />
                      <div className={cn("h-full transition-all duration-300", 
                        strength.score >= 4 ? strength.color : "bg-transparent",
                        strength.score >= 4 ? "w-1/4" : "w-0"
                      )} />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block text-right">
                      Kekuatan: {strength.label}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Pekerjaan */}
            <div className="space-y-1.5">
              <Label htmlFor="pekerjaan">Pekerjaan</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-[10px] w-4.5 h-4.5 text-muted-foreground z-10" />
                <Select value={pekerjaan} onValueChange={setPekerjaan} disabled={isLoading}>
                  <SelectTrigger className="pl-10 h-10 w-full bg-background">
                    <SelectValue placeholder="Pilih Pekerjaan Anda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Freelancer">Freelancer / Pekerja Lepas</SelectItem>
                    <SelectItem value="Pemilik Bisnis">Pemilik Bisnis / Owner</SelectItem>
                    <SelectItem value="Karyawan">Karyawan Swasta/PNS</SelectItem>
                    <SelectItem value="Lainnya">Lainnya (Tulis Manual)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {errors.pekerjaan && <p className="text-xs text-destructive">{errors.pekerjaan}</p>}
            </div>

            {/* Input Manual Pekerjaan (jika pilih lainnya) */}
            {pekerjaan === 'Lainnya' && (
              <div className="space-y-1.5 animate-slide-in">
                <Label htmlFor="customPekerjaan">Tulis Pekerjaan Anda</Label>
                <Input
                  id="customPekerjaan"
                  placeholder="Contoh: Arsitek Jasa Desain"
                  value={customPekerjaan}
                  onChange={(e) => setCustomPekerjaan(e.target.value)}
                  disabled={isLoading}
                />
                {errors.customPekerjaan && <p className="text-xs text-destructive">{errors.customPekerjaan}</p>}
              </div>
            )}

            {/* Tujuan Penggunaan */}
            <div className="space-y-1.5">
              <Label htmlFor="tujuanPenggunaan">Tujuan Penggunaan (Pakai InvoiceYuk buat apa?)</Label>
              <div className="relative">
                <Target className="absolute left-3 top-3 w-4.5 h-4.5 text-muted-foreground" />
                <Textarea
                  id="tujuanPenggunaan"
                  placeholder="Contoh: Untuk menagih klien jasa desain interior bulanan"
                  value={tujuanPenggunaan}
                  onChange={(e) => setTujuanPenggunaan(e.target.value)}
                  className="pl-10 min-h-[70px]"
                  disabled={isLoading}
                  rows={2}
                />
              </div>
              {errors.tujuanPenggunaan && <p className="text-xs text-destructive">{errors.tujuanPenggunaan}</p>}
            </div>

            <Button type="submit" className="w-full h-10" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Pendaftaran Diproses...
                </>
              ) : (
                'Daftar Sekarang'
              )}
            </Button>

            <p className="text-sm text-muted-foreground text-center pt-2">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-primary hover:underline font-semibold">
                Masuk ke Akun Anda
              </Link>
            </p>
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

export default Register;
