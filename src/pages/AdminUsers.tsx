import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Users, 
  Shield, 
  User,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuthStore, AppRole } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { mapDatabaseError, isDuplicateError, isFieldError, logErrorSecurely } from '@/lib/errors';

interface PinUser {
  id: string;
  name: string;
  username: string;
  role: AppRole;
  created_at: string;
}

const userSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(100, 'Nama terlalu panjang'),
  username: z.string().min(3, 'Username minimal 3 karakter').max(50, 'Username terlalu panjang').regex(/^[a-z0-9_]+$/, 'Username hanya boleh huruf kecil, angka, dan underscore'),
  pin: z.string().length(6, 'PIN harus 6 digit').regex(/^\d+$/, 'PIN harus angka'),
  role: z.enum(['admin', 'user']),
});

const AdminUsers = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [users, setUsers] = useState<PinUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Form state
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('user');
  const [errors, setErrors] = useState<{ name?: string; username?: string; pin?: string }>({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/pin-login');
      return;
    }
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      toast({ 
        title: 'Akses Ditolak', 
        description: 'Hanya admin yang bisa mengakses halaman ini', 
        variant: 'destructive' 
      });
      return;
    }
    fetchUsers();
  }, [isAuthenticated, user, navigate]);

  const fetchUsers = async () => {
    try {
      // Use SECURITY DEFINER RPC function for server-side admin authorization
      const { data, error } = await supabase.rpc('list_all_users', {
        _caller_id: user?.id
      });

      if (error) throw error;

      const usersWithRoles: PinUser[] = (data || []).map((u: { user_id: string; user_name: string; username: string; user_role: AppRole; created_at: string }) => ({
        id: u.user_id,
        name: u.user_name,
        username: u.username,
        role: u.user_role,
        created_at: u.created_at,
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      logErrorSecurely('fetchUsers', error);
      toast({ 
        title: 'Error', 
        description: mapDatabaseError(error), 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    setErrors({});
    
    const validation = userSchema.safeParse({
      name: newName,
      username: newUsername.toLowerCase(),
      pin: newPin,
      role: newRole,
    });

    if (!validation.success) {
      const fieldErrors: { name?: string; username?: string; pin?: string } = {};
      validation.error.errors.forEach(err => {
        if (err.path[0] === 'name') fieldErrors.name = err.message;
        if (err.path[0] === 'username') fieldErrors.username = err.message;
        if (err.path[0] === 'pin') fieldErrors.pin = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('create_pin_user', {
        _name: newName.trim(),
        _username: newUsername.trim().toLowerCase(),
        _pin: newPin,
        _role: newRole,
        _caller_id: user?.id,
      });

      if (error) {
        if (isDuplicateError(error) && isFieldError(error, 'username')) {
          setErrors({ username: 'Username sudah digunakan' });
          return;
        }
        throw error;
      }

      toast({ title: 'Berhasil!', description: `User ${newName} berhasil ditambahkan` });
      setNewName('');
      setNewUsername('');
      setNewPin('');
      setNewRole('user');
      setShowPin(false);
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error) {
      logErrorSecurely('handleAddUser', error);
      toast({ 
        title: 'Error', 
        description: mapDatabaseError(error), 
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === user?.id) {
      toast({ 
        title: 'Tidak Bisa', 
        description: 'Kamu tidak bisa menghapus akun sendiri', 
        variant: 'destructive' 
      });
      return;
    }

    try {
      const { error } = await supabase.rpc('delete_pin_user', { _user_id: userId, _caller_id: user?.id });

      if (error) throw error;

      toast({ title: 'Berhasil!', description: `User ${userName} berhasil dihapus` });
      fetchUsers();
    } catch (error) {
      logErrorSecurely('handleDeleteUser', error);
      toast({ 
        title: 'Error', 
        description: mapDatabaseError(error), 
        variant: 'destructive' 
      });
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') return null;

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
        <div className="max-w-3xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Users className="w-7 h-7 text-accent" />
                Kelola User
              </h1>
              <p className="text-muted-foreground">
                Tambah dan kelola user yang bisa mengakses dashboard
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero">
                  <Plus className="w-4 h-4" />
                  Tambah User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah User Baru</DialogTitle>
                  <DialogDescription>
                    Masukkan data untuk user baru
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input
                      id="name"
                      placeholder="Contoh: John Doe"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive">{errors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Contoh: johndoe"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    />
                    {errors.username && (
                      <p className="text-xs text-destructive">{errors.username}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pin">PIN (6 digit)</Label>
                    <div className="relative">
                      <Input
                        id="pin"
                        type={showPin ? 'text' : 'password'}
                        maxLength={6}
                        placeholder="******"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.pin && (
                      <p className="text-xs text-destructive">{errors.pin}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleAddUser} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Tambah User
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Users List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Belum ada user</h3>
              <p className="text-muted-foreground">Klik tombol "Tambah User" untuk menambahkan user baru</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div 
                  key={u.id} 
                  className="bg-card rounded-xl border border-border p-4 shadow-card flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      u.role === 'admin' ? 'bg-accent/10' : 'bg-primary/10'
                    }`}>
                      {u.role === 'admin' ? (
                        <Shield className="w-5 h-5 text-accent" />
                      ) : (
                        <User className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{u.name}</p>
                      <p className="text-xs text-muted-foreground">@{u.username} • {u.role}</p>
                    </div>
                  </div>

                  {u.id !== user?.id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus User?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah kamu yakin ingin menghapus user "{u.name}"? Semua invoice milik user ini juga akan dihapus.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminUsers;
