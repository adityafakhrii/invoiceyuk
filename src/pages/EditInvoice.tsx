import { useNavigate, useParams, Link } from 'react-router-dom';
import InvoiceForm from '@/components/InvoiceForm';
import { useInvoiceStore } from '@/store/invoiceStore';
import { useAuthStore } from '@/store/authStore';
import { Invoice } from '@/lib/invoice';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

const EditInvoice = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getInvoice, updateInvoice } = useInvoiceStore();

  const invoice = id ? getInvoice(id) : undefined;

  const handleSubmit = async (formData: Omit<Invoice, 'id' | 'createdAt' | 'status'>) => {
    if (!id || !user) {
      toast({
        title: 'Oops!',
        description: 'Gagal mengupdate invoice. Pastikan lo udah login.',
        variant: 'destructive',
      });
      return;
    }

    const updatedInvoice: Partial<Invoice> = {
      ...formData,
    };

    await updateInvoice(id, updatedInvoice, user.id);
    toast({ title: 'Mantap! 🎉', description: 'Invoice berhasil diupdate' });
    navigate(`/preview/${id}`);
  };

  if (!invoice) {
    return (
      <div className="w-full">
        <main className="pt-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Invoice Tidak Ditemukan</h1>
          <p className="text-muted-foreground mb-6">Invoice yang lo cari gak ada nih</p>
          <Link to="/riwayat">
            <Button variant="hero">Ke Riwayat Invoice</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <InvoiceForm
      title="Edit Invoice"
      submitButtonText="Update Invoice"
      initialData={invoice}
      onSubmit={handleSubmit}
    />
  );
};

export default EditInvoice;
