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
  EyeOff,
  KeyRound,
  Check,
  X,
  AlertCircle
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore, AppRole } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

interface PinUser {
  id: string;
  name: string;
  role: AppRole;
  created_at: string;
}

interface PinResetRequest {
  id: string;
  user_id: string;
  user_name: string;
  requested_at: string;
}

const userSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(100, 'Nama terlalu panjang'),
  pin: z.string().length(6, 'PIN harus 6 digit').regex(/^\d+$/, 'PIN harus angka'),
  role: z.enum(['admin', 'user']),
});

const AdminUsers = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [users, setUsers] = useState<PinUser[]>([]);
  const [resetRequests, setResetRequests] = useState<PinResetRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Reset PIN dialog
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<string>('');
  const [resetUserName, setResetUserName] = useState<string>('');
  const [resetNewPin, setResetNewPin] = useState('');
  const [showResetPin, setShowResetPin] = useState(false);
  const [resetPinError, setResetPinError] = useState('');

  // Form state
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('user');
  const [errors, setErrors] = useState<{ name?: string; pin?: string }>({});

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
    fetchResetRequests();
  }, [isAuthenticated, user, navigate]);

  const fetchUsers = async () => {
    try {
      const { data: pinUsers, error: pinError } = await supabase
        .from('pin_users')
        .select('id, name, created_at')
        .order('created_at', { ascending: false });

      if (pinError) throw pinError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles: PinUser[] = (pinUsers || []).map(pu => ({
        id: pu.id,
        name: pu.name,
        created_at: pu.created_at,
        role: (roles?.find(r => r.user_id === pu.id)?.role as AppRole) || 'user',
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ 
        title: 'Error', 
        description: 'Gagal memuat data user', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResetRequests = async () => {
    try {
      const { data: requests, error } = await supabase
        .from('pin_reset_requests')
        .select('id, user_id, requested_at')
        .eq('status', 'pending')
        .order('requested_at', { ascending: true });

      if (error) throw error;

      // Get user names for requests
      const requestsWithNames: PinResetRequest[] = [];
      for (const req of requests || []) {
        const { data: userData } = await supabase
          .from('pin_users')
          .select('name')
          .eq('id', req.user_id)
          .single();
        
        requestsWithNames.push({
          id: req.id,
          user_id: req.user_id,
          user_name: userData?.name || 'Unknown',
          requested_at: req.requested_at,
        });
      }

      setResetRequests(requestsWithNames);
    } catch (error) {
      console.error('Error fetching reset requests:', error);
    }
  };

  const handleAddUser = async () => {
    setErrors({});
    
    const validation = userSchema.safeParse({
      name: newName,
      pin: newPin,
      role: newRole,
    });

    if (!validation.success) {
      const fieldErrors: { name?: string; pin?: string } = {};
      validation.error.errors.forEach(err => {
        if (err.path[0] === 'name') fieldErrors.name = err.message;
        if (err.path[0] === 'pin') fieldErrors.pin = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('create_pin_user', {
        _name: newName.trim(),
        _pin: newPin,
        _role: newRole,
      });

      if (error) throw error;

      toast({ title: 'Berhasil!', description: `User ${newName} berhasil ditambahkan` });
      setNewName('');
      setNewPin('');
      setNewRole('user');
      setShowPin(false);
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      toast({ 
        title: 'Error', 
        description: 'Gagal menambahkan user', 
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
      const { error } = await supabase.rpc('delete_pin_user', { _user_id: userId });

      if (error) throw error;

      toast({ title: 'Berhasil!', description: `User ${userName} berhasil dihapus` });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({ 
        title: 'Error', 
        description: 'Gagal menghapus user', 
        variant: 'destructive' 
      });
    }
  };

  const openResetDialog = (userId: string, userName: string) => {
    setResetUserId(userId);
    setResetUserName(userName);
    setResetNewPin('');
    setShowResetPin(false);
    setResetPinError('');
    setIsResetDialogOpen(true);
  };

  const handleResetPin = async () => {
    if (resetNewPin.length !== 6 || !/^\d+$/.test(resetNewPin)) {
      setResetPinError('PIN harus 6 digit angka');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('reset_user_pin', {
        _user_id: resetUserId,
        _new_pin: resetNewPin,
        _admin_id: user?.id,
      });

      if (error) throw error;

      toast({ title: 'Berhasil!', description: `PIN ${resetUserName} berhasil direset` });
      setIsResetDialogOpen(false);
      fetchResetRequests();
    } catch (error) {
      console.error('Error resetting PIN:', error);
      toast({ 
        title: 'Error', 
        description: 'Gagal mereset PIN', 
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectReset = async (requestId: string, userName: string) => {
    try {
      const { error } = await supabase.rpc('reject_pin_reset', {
        _request_id: requestId,
        _admin_id: user?.id,
      });

      if (error) throw error;

      toast({ title: 'Ditolak', description: `Permintaan reset PIN ${userName} ditolak` });
      fetchResetRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({ 
        title: 'Error', 
        description: 'Gagal menolak permintaan', 
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
                    Masukkan nama dan PIN untuk user baru
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama User</Label>
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

          {/* Tabs */}
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Daftar User
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-2 relative">
                <KeyRound className="w-4 h-4" />
                Reset PIN
                {resetRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    {resetRequests.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users">
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
                          <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {u.id !== user?.id && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-muted-foreground hover:text-accent"
                              onClick={() => openResetDialog(u.id, u.name)}
                            >
                              <KeyRound className="w-4 h-4" />
                            </Button>
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
                                    Apakah kamu yakin ingin menghapus user "{u.name}"? Aksi ini tidak bisa dibatalkan.
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
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Reset Requests Tab */}
            <TabsContent value="requests">
              {resetRequests.length === 0 ? (
                <div className="text-center py-20">
                  <AlertCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Tidak ada permintaan</h3>
                  <p className="text-muted-foreground">Belum ada user yang mengajukan reset PIN</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {resetRequests.map((req) => (
                    <div 
                      key={req.id} 
                      className="bg-card rounded-xl border border-border p-4 shadow-card flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                          <KeyRound className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{req.user_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(req.requested_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                          onClick={() => openResetDialog(req.user_id, req.user_name)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRejectReset(req.id, req.user_name)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Reset PIN Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset PIN</DialogTitle>
            <DialogDescription>
              Masukkan PIN baru untuk {resetUserName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resetPin">PIN Baru (6 digit)</Label>
              <div className="relative">
                <Input
                  id="resetPin"
                  type={showResetPin ? 'text' : 'password'}
                  maxLength={6}
                  placeholder="******"
                  value={resetNewPin}
                  onChange={(e) => {
                    setResetNewPin(e.target.value.replace(/\D/g, ''));
                    setResetPinError('');
                  }}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPin(!showResetPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showResetPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {resetPinError && (
                <p className="text-xs text-destructive">{resetPinError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleResetPin} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Reset PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
