import { create } from 'zustand';
import { Invoice, InvoiceItem, InvoiceStatus } from '@/lib/invoice';
import { supabase } from '@/integrations/supabase/client';
import { logErrorSecurely } from '@/lib/errors';
import type { Json } from '@/integrations/supabase/types';

interface InvoiceStore {
  invoices: Invoice[];
  isLoading: boolean;
  fetchInvoices: (userId: string) => Promise<void>;
  addInvoice: (invoice: Invoice, userId: string) => Promise<string | undefined>;
  updateInvoice: (id: string, invoice: Partial<Invoice>, userId: string) => Promise<void>;
  deleteInvoice: (id: string, userId: string) => Promise<void>;
  toggleStatus: (id: string, userId: string, targetStatus?: InvoiceStatus) => Promise<void>;
  cancelInvoice: (id: string, userId: string) => Promise<void>;
  getInvoice: (id: string) => Invoice | undefined;
  clearInvoices: () => void;
}

export const useInvoiceStore = create<InvoiceStore>()((set, get) => ({
  invoices: [],
  isLoading: false,

  fetchInvoices: async (userId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

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
        taxType: ((inv as any).tax_type as Invoice['taxType']) || ((inv.payment_info as any)?._tax_type as Invoice['taxType']) || 'addition',
        notes: inv.notes || undefined,
        paymentInfo: (inv.payment_info as unknown) as Invoice['paymentInfo'] || undefined,
        signatureName: inv.signature_name || undefined,
        signatureImage: inv.signature_image || undefined,
        signatureFont: (inv.signature_font as Invoice['signatureFont']) || undefined,
        socialMedia: (inv.social_media as unknown) as Invoice['socialMedia'] || undefined,
        status: (inv.status || 'unpaid') as InvoiceStatus,
        template: inv.template as Invoice['template'],
        currency: (inv.currency as Invoice['currency']) || 'IDR',
        downPayment: inv.down_payment ? Number(inv.down_payment) : undefined,
        dpType: (inv.dp_type as 'amount' | 'percent') || undefined,
        dpPercent: inv.dp_percent ? Number(inv.dp_percent) : undefined,
        category: inv.category || undefined,
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
      const paymentInfoWithMeta = {
        ...(invoice.paymentInfo || {}),
        _tax_type: invoice.taxType || 'addition',
      };

      const payload: any = {
        user_id: userId,
        invoice_number: invoice.invoiceNumber,
        business_name: invoice.businessName,
        business_logo: invoice.businessLogo || '',
        client_name: invoice.clientName,
        client_contact: invoice.clientContact || '',
        client_address: invoice.clientAddress || '',
        invoice_date: invoice.invoiceDate,
        due_date: invoice.dueDate || null,
        items: invoice.items as unknown as Json,
        tax: invoice.tax || 0,
        tax_type: invoice.taxType || 'addition',
        notes: invoice.notes || '',
        payment_info: paymentInfoWithMeta as unknown as Json,
        signature_name: invoice.signatureName || '',
        signature_image: invoice.signatureImage || '',
        signature_font: invoice.signatureFont || '',
        social_media: (invoice.socialMedia || {}) as unknown as Json,
        status: invoice.status,
        template: invoice.template,
        category: invoice.category || '',
        down_payment: invoice.downPayment || null,
        dp_type: invoice.dpType || null,
        dp_percent: invoice.dpPercent || null,
        currency: invoice.currency || 'IDR',
      };

      let { data, error } = await supabase
        .from('invoices')
        .insert([payload])
        .select('id')
        .single();

      // Fallback if remote table does not have tax_type column yet
      if (error && (error.message?.includes('tax_type') || (error as any).code === 'PGRST204')) {
        delete payload.tax_type;
        const retry = await supabase
          .from('invoices')
          .insert([payload])
          .select('id')
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;

      const newInvoice = { ...invoice, id: data!.id };
      set((state) => ({ invoices: [newInvoice, ...state.invoices] }));
      return data!.id;
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

      const paymentInfoWithMeta = {
        ...(merged.paymentInfo || {}),
        _tax_type: merged.taxType || 'addition',
      };

      const payload: any = {
        invoice_number: merged.invoiceNumber,
        business_name: merged.businessName,
        business_logo: merged.businessLogo || '',
        client_name: merged.clientName,
        client_contact: merged.clientContact || '',
        client_address: merged.clientAddress || '',
        invoice_date: merged.invoiceDate,
        due_date: merged.dueDate || null,
        items: merged.items as unknown as Json,
        tax: merged.tax || 0,
        tax_type: merged.taxType || 'addition',
        notes: merged.notes || '',
        payment_info: paymentInfoWithMeta as unknown as Json,
        signature_name: merged.signatureName || '',
        signature_image: merged.signatureImage || '',
        signature_font: merged.signatureFont || '',
        social_media: (merged.socialMedia || {}) as unknown as Json,
        status: merged.status,
        template: merged.template,
        category: merged.category || '',
        down_payment: merged.downPayment || null,
        dp_type: merged.dpType || null,
        dp_percent: merged.dpPercent || null,
        currency: merged.currency || 'IDR',
      };

      let { error } = await supabase
        .from('invoices')
        .update(payload)
        .eq('id', id);

      // Fallback if remote table does not have tax_type column yet
      if (error && (error.message?.includes('tax_type') || (error as any).code === 'PGRST204')) {
        delete payload.tax_type;
        const retry = await supabase
          .from('invoices')
          .update(payload)
          .eq('id', id);
        error = retry.error;
      }

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
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        invoices: state.invoices.filter((inv) => inv.id !== id),
      }));
    } catch (error) {
      logErrorSecurely('deleteInvoice', error);
      throw error;
    }
  },

  toggleStatus: async (id: string, userId: string, targetStatus?: InvoiceStatus) => {
    const invoice = get().invoices.find(inv => inv.id === id);
    if (!invoice) return;

    if (targetStatus) {
      await get().updateInvoice(id, { status: targetStatus }, userId);
      return;
    }

    const hasDP = Boolean(invoice.downPayment && invoice.downPayment > 0);
    let newStatus: InvoiceStatus;

    if (hasDP) {
      if (invoice.status === 'unpaid') {
        newStatus = 'paid_dp';
      } else if (invoice.status === 'paid_dp') {
        newStatus = 'paid';
      } else {
        newStatus = 'unpaid';
      }
    } else {
      newStatus = invoice.status === 'paid' ? 'unpaid' : 'paid';
    }

    await get().updateInvoice(id, { status: newStatus }, userId);
  },

  cancelInvoice: async (id: string, userId: string) => {
    await get().updateInvoice(id, { status: 'cancelled' }, userId);
  },

  getInvoice: (id: string) => get().invoices.find((inv) => inv.id === id),

  clearInvoices: () => set({ invoices: [] }),
}));
