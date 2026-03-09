import { create } from 'zustand';
import { Invoice, InvoiceItem } from '@/lib/invoice';
import { supabase } from '@/integrations/supabase/client';
import { logErrorSecurely } from '@/lib/errors';
import type { Json } from '@/integrations/supabase/types';

interface InvoiceStore {
  invoices: Invoice[];
  isLoading: boolean;
  fetchInvoices: (userId: string) => Promise<void>;
  addInvoice: (invoice: Invoice, userId: string) => Promise<void>;
  updateInvoice: (id: string, invoice: Partial<Invoice>, userId: string) => Promise<void>;
  deleteInvoice: (id: string, userId: string) => Promise<void>;
  toggleStatus: (id: string, userId: string) => Promise<void>;
  getInvoice: (id: string) => Invoice | undefined;
  clearInvoices: () => void;
}

export const useInvoiceStore = create<InvoiceStore>()((set, get) => ({
  invoices: [],
  isLoading: false,

  fetchInvoices: async (userId: string) => {
    set({ isLoading: true });
    try {
      // Use SECURITY DEFINER RPC function for server-side user_id enforcement
      const { data, error } = await supabase.rpc('fetch_user_invoices', {
        _user_id: userId
      });

      if (error) throw error;

      const invoices: Invoice[] = (data || []).map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        businessName: inv.business_name,
        businessLogo: inv.business_logo || undefined,
        clientName: inv.client_name,
        clientContact: inv.client_contact || undefined,
        clientAddress: inv.client_address || undefined,
        invoiceDate: inv.invoice_date,
        dueDate: inv.due_date,
        items: (inv.items as unknown) as InvoiceItem[],
        tax: inv.tax ? Number(inv.tax) : undefined,
        notes: inv.notes || undefined,
        paymentInfo: (inv.payment_info as unknown) as Invoice['paymentInfo'] || undefined,
        signatureName: inv.signature_name || undefined,
        signatureImage: inv.signature_image || undefined,
        signatureFont: (inv.signature_font as Invoice['signatureFont']) || undefined,
        socialMedia: (inv.social_media as unknown) as Invoice['socialMedia'] || undefined,
        status: inv.status as 'paid' | 'unpaid',
        template: inv.template as Invoice['template'],
        currency: (inv.currency as Invoice['currency']) || 'IDR',
        createdAt: inv.created_at,
      }));

      set({ invoices, isLoading: false });
    } catch (error) {
      logErrorSecurely('fetchInvoices', error);
      set({ isLoading: false });
    }
  },

  addInvoice: async (invoice: Invoice, userId: string) => {
    try {
      // Items, payment_info, and social_media should be passed as objects, not JSON strings
      // The Supabase client will handle JSON serialization for jsonb columns
      const { data, error } = await supabase.rpc('create_invoice', {
        _user_id: userId,
        _invoice_number: invoice.invoiceNumber,
        _business_name: invoice.businessName,
        _business_logo: invoice.businessLogo || '',
        _client_name: invoice.clientName,
        _client_contact: invoice.clientContact || '',
        _client_address: invoice.clientAddress || '',
        _invoice_date: invoice.invoiceDate,
        _due_date: invoice.dueDate,
        _items: invoice.items as unknown as Json,
        _tax: invoice.tax || 0,
        _notes: invoice.notes || '',
        _payment_info: (invoice.paymentInfo || {}) as unknown as Json,
        _signature_name: invoice.signatureName || '',
        _signature_image: invoice.signatureImage || '',
        _signature_font: invoice.signatureFont || '',
        _social_media: (invoice.socialMedia || {}) as unknown as Json,
        _status: invoice.status,
        _template: invoice.template,
      });

      if (error) throw error;

      const newInvoice = { ...invoice, id: data };
      set((state) => ({ invoices: [newInvoice, ...state.invoices] }));
    } catch (error) {
      logErrorSecurely('addInvoice', error);
      throw error;
    }
  },

  updateInvoice: async (id: string, updatedInvoice: Partial<Invoice>, userId: string) => {
    try {
      const currentInvoice = get().invoices.find(inv => inv.id === id);
      if (!currentInvoice) return;

      const merged = { ...currentInvoice, ...updatedInvoice };

      const { error } = await supabase.rpc('update_invoice', {
        _invoice_id: id,
        _user_id: userId,
        _invoice_number: merged.invoiceNumber,
        _business_name: merged.businessName,
        _business_logo: merged.businessLogo || '',
        _client_name: merged.clientName,
        _client_contact: merged.clientContact || '',
        _client_address: merged.clientAddress || '',
        _invoice_date: merged.invoiceDate,
        _due_date: merged.dueDate,
        _items: merged.items as unknown as Json,
        _tax: merged.tax || 0,
        _notes: merged.notes || '',
        _payment_info: (merged.paymentInfo || {}) as unknown as Json,
        _signature_name: merged.signatureName || '',
        _signature_image: merged.signatureImage || '',
        _signature_font: merged.signatureFont || '',
        _social_media: (merged.socialMedia || {}) as unknown as Json,
        _status: merged.status,
        _template: merged.template,
      });

      if (error) throw error;

      set((state) => ({
        invoices: state.invoices.map((inv) =>
          inv.id === id ? { ...inv, ...updatedInvoice } : inv
        ),
      }));
    } catch (error) {
      logErrorSecurely('updateInvoice', error);
      throw error;
    }
  },

  deleteInvoice: async (id: string, userId: string) => {
    try {
      const { error } = await supabase.rpc('delete_invoice', {
        _invoice_id: id,
        _user_id: userId,
      });

      if (error) throw error;

      set((state) => ({
        invoices: state.invoices.filter((inv) => inv.id !== id),
      }));
    } catch (error) {
      logErrorSecurely('deleteInvoice', error);
      throw error;
    }
  },

  toggleStatus: async (id: string, userId: string) => {
    const invoice = get().invoices.find(inv => inv.id === id);
    if (!invoice) return;

    const newStatus = invoice.status === 'paid' ? 'unpaid' : 'paid';
    await get().updateInvoice(id, { status: newStatus }, userId);
  },

  getInvoice: (id: string) => get().invoices.find((inv) => inv.id === id),

  clearInvoices: () => set({ invoices: [] }),
}));
