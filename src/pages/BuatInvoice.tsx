import { useNavigate, useLocation } from 'react-router-dom';
import InvoiceForm from '@/components/InvoiceForm';
import { useInvoiceStore } from '@/store/invoiceStore';
import { useAuthStore } from '@/store/authStore';
import { Invoice } from '@/lib/invoice';
import { toast } from '@/hooks/use-toast';

const BuatInvoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const addInvoice = useInvoiceStore((state) => state.addInvoice);
  const { user } = useAuthStore();

  const duplicateFrom = (location.state as { duplicateFrom?: Invoice })?.duplicateFrom;

  const handleSubmit = async (formData: Omit<Invoice, 'id' | 'createdAt' | 'status'>) => {
    if (!user) {
      toast({
        title: 'Oops!',
        description: 'Lo harus login dulu buat bikin invoice',
        variant: 'destructive',
      });
      return;
    }

    const invoice: Invoice = {
      ...formData,
      id: Date.now().toString(),
      status: 'unpaid',
      createdAt: new Date().toISOString(),
    };

    await addInvoice(invoice, user.id);
    toast({ title: 'Mantap!', description: 'Invoice berhasil dibuat dan disimpan' });
    navigate('/riwayat');
  };

  return (
    <InvoiceForm
      title="Buat Invoice Baru"
      submitButtonText="Buat Invoice"
      initialData={duplicateFrom}
      isDuplicate={!!duplicateFrom}
      onSubmit={handleSubmit}
    />
  );
};

export default BuatInvoice;
