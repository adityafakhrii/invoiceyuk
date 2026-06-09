import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Users, 
  Shield, 
  User,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { mapDatabaseError, logErrorSecurely } from '@/lib/errors';

interface PinUser {
  id: string;
  name: string;
  username: string;
  email: string | null;
  role: AppRole;
  pekerjaan?: string | null;
  tujuan_penggunaan?: string | null;
  created_at: string;
}

const AdminUsers = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<PinUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('pin_users')
        .select(`
          id,
          name,
          username,
          email,
          pekerjaan,
          tujuan_penggunaan,
          created_at,
          user_roles (
            role
          )
        `) as unknown as { data: {
          id: string;
          name: string;
          username: string;
          email: string | null;
          pekerjaan: string | null;
          tujuan_penggunaan: string | null;
          created_at: string;
          user_roles: { role: AppRole }[] | null | { role: AppRole };
        }[] | null; error: unknown };

      if (error) throw error;

      const usersWithRoles: PinUser[] = (data || []).map((u) => {
        const roles = u.user_roles;
        const role = Array.isArray(roles) 
          ? (roles[0]?.role || 'user') 
          : ((roles as { role: AppRole })?.role || 'user');
        return {
          id: u.id,
          name: u.name,
          username: u.username,
          email: u.email,
          pekerjaan: u.pekerjaan,
          tujuan_penggunaan: u.tujuan_penggunaan,
          role: role as AppRole,
          created_at: u.created_at,
        };
      });

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
      const { error } = await supabase
        .from('pin_users')
        .delete()
        .eq('id', userId);

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

  return (
    <div className="w-full">
      <div className="pb-10">
        <div className="max-w-3xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-primary mb-2 flex items-center gap-3 uppercase tracking-tight">
                <Users className="w-7 h-7 text-accent" />
                Kelola User
              </h1>
              <p className="text-sm font-semibold text-navy-700">
                Lihat dan kelola pengguna terdaftar di InvoiceYuk
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero">
                  <Plus className="w-4 h-4" />
                  Tambah User
                </Button>
              </DialogTrigger>
              <DialogContent className="border-2 border-primary shadow-neo max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-primary font-black uppercase tracking-tight text-xl">Tambah User Baru</DialogTitle>
                  <DialogDescription className="font-semibold text-muted-foreground pt-1">
                    Bagaimana cara menambahkan pengguna baru dengan Supabase Auth?
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-3 font-semibold text-navy-800 text-sm leading-relaxed">
                  <p>
                    Saat ini aplikasi menggunakan **Supabase Auth (Email & Password)** yang aman. 
                    Pengguna baru harus didaftarkan secara mandiri melalui halaman registrasi publik.
                  </p>
                  <div className="bg-secondary p-3 rounded-lg border-2 border-primary/50 text-xs text-primary font-mono select-all text-center">
                    {window.location.origin}/register
                  </div>
                  <p>
                    Silakan bagikan tautan di atas kepada rekan atau pengguna baru yang ingin didaftarkan.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="default" onClick={() => setIsDialogOpen(false)}>
                    Mengerti
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
              <p className="text-muted-foreground">Silakan bagikan tautan registrasi untuk mendaftarkan user baru</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((u) => (
                <div 
                  key={u.id} 
                  className="bg-card rounded-xl border-2 border-primary p-4 shadow-neo flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-neo-accent hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all duration-150"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 border-primary shadow-neo-sm ${
                      u.role === 'admin' ? 'bg-accent/10' : 'bg-primary/10'
                    }`}>
                      {u.role === 'admin' ? (
                        <Shield className="w-5 h-5 text-accent" />
                      ) : (
                        <User className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-extrabold text-primary text-base">{u.name}</p>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border border-primary ${
                          u.role === 'admin' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-primary'
                        }`}>
                          {u.role}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-muted-foreground">@{u.username} • {u.email || 'Tidak ada email'}</p>
                      {(u.pekerjaan || u.tujuan_penggunaan) && (
                        <div className="text-xs bg-secondary/50 p-2 rounded border border-primary/20 space-y-1 font-semibold text-navy-800 mt-2 max-w-md">
                          {u.pekerjaan && <p><span className="text-muted-foreground">Pekerjaan:</span> {u.pekerjaan}</p>}
                          {u.tujuan_penggunaan && <p><span className="text-muted-foreground">Tujuan:</span> {u.tujuan_penggunaan}</p>}
                        </div>
                      )}
                    </div>
                  </div>

                  {u.id !== user?.id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive self-end sm:self-center border-2 border-transparent hover:border-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border-2 border-primary shadow-neo">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-primary font-black uppercase tracking-tight text-xl">Hapus User?</AlertDialogTitle>
                          <AlertDialogDescription className="font-semibold text-muted-foreground">
                            Apakah kamu yakin ingin menghapus user "{u.name}"? Semua invoice milik user ini juga akan dihapus dari sistem.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-2 border-primary">Batal</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 border-2 border-primary shadow-neo-sm"
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
      </div>
    </div>
  );
};

export default AdminUsers;
