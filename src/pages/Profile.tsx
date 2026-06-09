import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  KeyRound, 
  Save,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  Globe,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { mapDatabaseError, isDuplicateError, isFieldError, logErrorSecurely } from '@/lib/errors';
import { CurrencyCode, CURRENCIES, isValidCurrencyCode } from '@/lib/invoice';

const profileSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(100, 'Nama terlalu panjang'),
  username: z.string().min(3, 'Username minimal 3 karakter').max(50, 'Username terlalu panjang').regex(/^[a-z0-9_]+$/, 'Username hanya boleh huruf kecil, angka, dan underscore'),
});

const passwordSchema = z.object({
  oldPassword: z.string().min(6, 'Password lama minimal 6 karakter'),
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
  confirmPassword: z.string().min(6, 'Konfirmasi password baru minimal 6 karakter'),
});

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  // Profile form
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState<{ name?: string; username?: string }>({});
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyCode>('IDR');

  // Password form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{ oldPassword?: string; newPassword?: string; confirmPassword?: string }>({});

  useEffect(() => {
    if (user) {
      setName(user.name);
      setUsername(user.username);
      // Load default currency from localStorage
      const saved = localStorage.getItem(`default-currency-${user.id}`);
      if (saved && isValidCurrencyCode(saved)) {
        setDefaultCurrency(saved);
      }
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setProfileErrors({});

    const validation = profileSchema.safeParse({ name, username: username.toLowerCase() });

    if (!validation.success) {
      const fieldErrors: { name?: string; username?: string } = {};
      validation.error.errors.forEach(err => {
        if (err.path[0] === 'name') fieldErrors.name = err.message;
        if (err.path[0] === 'username') fieldErrors.username = err.message;
      });
      setProfileErrors(fieldErrors);
      return;
    }

    setIsSavingProfile(true);
    try {
      const { data, error } = await supabase.rpc('update_user_profile', {
        _user_id: user?.id,
        _name: name.trim(),
        _username: username.trim().toLowerCase(),
      });

      if (error) {
        if (isDuplicateError(error) && isFieldError(error, 'username')) {
          setProfileErrors({ username: 'Username sudah digunakan' });
          return;
        }
        throw error;
      }

      updateUser({ name: name.trim(), username: username.trim().toLowerCase() });
      toast({ title: 'Berhasil!', description: 'Profil berhasil diperbarui' });
    } catch (error) {
      logErrorSecurely('handleSaveProfile', error);
      toast({ 
        title: 'Error', 
        description: mapDatabaseError(error), 
        variant: 'destructive' 
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordErrors({});

    const validation = passwordSchema.safeParse({ oldPassword, newPassword, confirmPassword });

    if (!validation.success) {
      const fieldErrors: { oldPassword?: string; newPassword?: string; confirmPassword?: string } = {};
      validation.error.errors.forEach(err => {
        if (err.path[0] === 'oldPassword') fieldErrors.oldPassword = err.message;
        if (err.path[0] === 'newPassword') fieldErrors.newPassword = err.message;
        if (err.path[0] === 'confirmPassword') fieldErrors.confirmPassword = err.message;
      });
      setPasswordErrors(fieldErrors);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrors({ confirmPassword: 'Password baru tidak sama' });
      return;
    }

    if (oldPassword === newPassword) {
      setPasswordErrors({ newPassword: 'Password baru tidak boleh sama dengan password lama' });
      return;
    }

    setIsSavingPassword(true);
    try {
      // Re-authenticate user to verify old password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: oldPassword,
      });

      if (signInError) {
        setPasswordErrors({ oldPassword: 'Password lama salah' });
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast({
          title: 'Error',
          description: updateError.message,
          variant: 'destructive',
        });
        return;
      }

      toast({ title: 'Berhasil!', description: 'Password berhasil diubah' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      logErrorSecurely('handleChangePassword', error);
      toast({ 
        title: 'Error', 
        description: mapDatabaseError(error), 
        variant: 'destructive' 
      });
    } finally {
      setIsSavingPassword(false);
    }
  };



  return (
    <div className="w-full">
      <div className="pb-10">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-black text-primary uppercase tracking-tight mb-8 flex items-center gap-3">
            <Settings className="w-7 h-7 text-accent" />
            Pengaturan
          </h1>

          {/* Profile Section */}
          <section className="bg-card rounded-xl border-2 border-primary p-6 md:p-8 shadow-neo mb-8">
            <h2 className="text-xl font-black text-primary mb-6 flex items-center gap-2 uppercase tracking-tight">
              <User className="w-5 h-5 text-accent" />
              Informasi Akun
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-primary font-bold uppercase tracking-wider text-xs">Nama Lengkap</Label>
                <Input
                  id="name"
                  placeholder="Nama lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {profileErrors.name && (
                  <p className="text-xs text-destructive">{profileErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-primary font-bold uppercase tracking-wider text-xs">Username</Label>
                <Input
                  id="username"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                />
                {profileErrors.username && (
                  <p className="text-xs text-destructive">{profileErrors.username}</p>
                )}
              </div>

              <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full sm:w-auto">
                {isSavingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Simpan Profil
              </Button>
            </div>
          </section>

          {/* Default Currency Section */}
          <section className="bg-card rounded-xl border-2 border-primary p-6 md:p-8 shadow-neo mb-8">
            <h2 className="text-xl font-black text-primary mb-6 flex items-center gap-2 uppercase tracking-tight">
              <Globe className="w-5 h-5 text-accent" />
              Mata Uang Default
            </h2>
            <p className="text-sm font-semibold text-muted-foreground mb-4">
              Pilih mata uang default untuk invoice baru. Kamu tetap bisa mengubahnya per invoice.
            </p>
            <div className="flex items-center gap-3">
              <Select
                value={defaultCurrency}
                onValueChange={(val) => {
                  if (isValidCurrencyCode(val)) {
                    setDefaultCurrency(val);
                    if (user) {
                      localStorage.setItem(`default-currency-${user.id}`, val);
                    }
                    toast({ title: 'Berhasil!', description: `Mata uang default diubah ke ${val}` });
                  }
                }}
              >
                <SelectTrigger className="w-full max-w-xs h-10">
                  <SelectValue placeholder="Pilih Mata Uang" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Change Password Section */}
          <section className="bg-card rounded-xl border-2 border-primary p-6 md:p-8 shadow-neo">
            <h2 className="text-xl font-black text-primary mb-6 flex items-center gap-2 uppercase tracking-tight">
              <KeyRound className="w-5 h-5 text-accent" />
              Ganti Password
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="oldPassword" className="text-primary font-bold uppercase tracking-wider text-xs">Password Lama</Label>
                <div className="relative">
                  <Input
                    id="oldPassword"
                    type={showOldPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.oldPassword && (
                  <p className="text-xs text-destructive">{passwordErrors.oldPassword}</p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-primary font-bold uppercase tracking-wider text-xs">Password Baru</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="text-xs text-destructive">{passwordErrors.newPassword}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-primary font-bold uppercase tracking-wider text-xs">Konfirmasi Password Baru</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="text-xs text-destructive">{passwordErrors.confirmPassword}</p>
                )}
                {newPassword && confirmPassword && newPassword === confirmPassword && (
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Password cocok
                  </p>
                )}
              </div>

              <Button onClick={handleChangePassword} disabled={isSavingPassword} className="w-full sm:w-auto">
                {isSavingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <KeyRound className="w-4 h-4 mr-2" />
                )}
                Ganti Password
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
