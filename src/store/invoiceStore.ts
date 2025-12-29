import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Invoice } from '@/lib/invoice';

interface InvoiceStore {
  invoices: Invoice[];
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  toggleStatus: (id: string) => void;
  getInvoice: (id: string) => Invoice | undefined;
}

export const useInvoiceStore = create<InvoiceStore>()(
  persist(
    (set, get) => ({
      invoices: [],
      addInvoice: (invoice) =>
        set((state) => ({ invoices: [invoice, ...state.invoices] })),
      updateInvoice: (id, updatedInvoice) =>
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id ? { ...inv, ...updatedInvoice } : inv
          ),
        })),
      deleteInvoice: (id) =>
        set((state) => ({
          invoices: state.invoices.filter((inv) => inv.id !== id),
        })),
      toggleStatus: (id) =>
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id
              ? { ...inv, status: inv.status === 'paid' ? 'unpaid' : 'paid' }
              : inv
          ),
        })),
      getInvoice: (id) => get().invoices.find((inv) => inv.id === id),
    }),
    {
      name: 'invoice-storage',
    }
  )
);
