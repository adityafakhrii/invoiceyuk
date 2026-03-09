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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { mapDatabaseError, isDuplicateError, isFieldError, logErrorSecurely } from '@/lib/errors';
import { CurrencyCode, CURRENCIES } from '@/lib/invoice';

const profileSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(100, 'Nama terlalu panjang'),
  username: z.string().min(3, 'Username minimal 3 karakter').max(50, 'Username terlalu panjang').regex(/^[a-z0-9_]+$/, 'Username hanya boleh huruf kecil, angka, dan underscore'),
});

const pinSchema = z.object({
  oldPin: z.string().length(6, 'PIN lama harus 6 digit').regex(/^\d+$/, 'PIN harus angka'),
  newPin: z.string().length(6, 'PIN baru harus 6 digit').regex(/^\d+$/, 'PIN harus angka'),
  confirmPin: z.string().length(6, 'Konfirmasi PIN harus 6 digit').regex(/^\d+$/, 'PIN harus angka'),
});

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUser } = useAuthStore();

  // Profile form
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState<{ name?: string; username?: string }>({});
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyCode>('IDR');

  // PIN form
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showOldPin, setShowOldPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [pinErrors, setPinErrors] = useState<{ oldPin?: string; newPin?: string; confirmPin?: string }>({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/pin-login');
      return;
    }
    if (user) {
      setName(user.name);
      setUsername(user.username);
    }
  }, [isAuthenticated, user, navigate]);

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

  const handleChangePin = async () => {
    setPinErrors({});

    const validation = pinSchema.safeParse({ oldPin, newPin, confirmPin });

    if (!validation.success) {
      const fieldErrors: { oldPin?: string; newPin?: string; confirmPin?: string } = {};
      validation.error.errors.forEach(err => {
        if (err.path[0] === 'oldPin') fieldErrors.oldPin = err.message;
        if (err.path[0] === 'newPin') fieldErrors.newPin = err.message;
        if (err.path[0] === 'confirmPin') fieldErrors.confirmPin = err.message;
      });
      setPinErrors(fieldErrors);
      return;
    }

    if (newPin !== confirmPin) {
      setPinErrors({ confirmPin: 'PIN baru tidak sama' });
      return;
    }

    if (oldPin === newPin) {
      setPinErrors({ newPin: 'PIN baru tidak boleh sama dengan PIN lama' });
      return;
    }

    setIsSavingPin(true);
    try {
      const { data, error } = await supabase.rpc('change_user_pin', {
        _user_id: user?.id,
        _old_pin: oldPin,
        _new_pin: newPin,
      });

      if (error) throw error;

      if (data === false) {
        setPinErrors({ oldPin: 'PIN lama salah' });
        return;
      }

      toast({ title: 'Berhasil!', description: 'PIN berhasil diubah' });
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (error) {
      logErrorSecurely('handleChangePin', error);
      toast({ 
        title: 'Error', 
        description: mapDatabaseError(error), 
        variant: 'destructive' 
      });
    } finally {
      setIsSavingPin(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link 
              to="/dashboard" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
            <User className="w-7 h-7 text-accent" />
            Pengaturan Profil
          </h1>

          {/* Profile Section */}
          <section className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card mb-6">
            <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Informasi Akun
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
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
                <Label htmlFor="username">Username</Label>
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

          {/* Change PIN Section */}
          <section className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card">
            <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-accent" />
              Ganti PIN
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="oldPin">PIN Lama</Label>
                <div className="relative">
                  <Input
                    id="oldPin"
                    type={showOldPin ? 'text' : 'password'}
                    maxLength={6}
                    placeholder="******"
                    value={oldPin}
                    onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPin(!showOldPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showOldPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pinErrors.oldPin && (
                  <p className="text-xs text-destructive">{pinErrors.oldPin}</p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="newPin">PIN Baru</Label>
                <div className="relative">
                  <Input
                    id="newPin"
                    type={showNewPin ? 'text' : 'password'}
                    maxLength={6}
                    placeholder="******"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPin(!showNewPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pinErrors.newPin && (
                  <p className="text-xs text-destructive">{pinErrors.newPin}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPin">Konfirmasi PIN Baru</Label>
                <div className="relative">
                  <Input
                    id="confirmPin"
                    type={showConfirmPin ? 'text' : 'password'}
                    maxLength={6}
                    placeholder="******"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pinErrors.confirmPin && (
                  <p className="text-xs text-destructive">{pinErrors.confirmPin}</p>
                )}
                {newPin && confirmPin && newPin === confirmPin && (
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    PIN cocok
                  </p>
                )}
              </div>

              <Button onClick={handleChangePin} disabled={isSavingPin} className="w-full sm:w-auto">
                {isSavingPin ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <KeyRound className="w-4 h-4 mr-2" />
                )}
                Ganti PIN
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Profile;
