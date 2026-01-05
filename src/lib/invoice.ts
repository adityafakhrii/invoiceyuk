export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface PaymentInfo {
  method: string;
  accountName: string;
  accountNumber: string;
}

export interface SocialMedia {
  whatsapp?: string;
  instagram?: string;
  email?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  businessName: string;
  businessLogo?: string;
  clientName: string;
  clientContact?: string;
  clientAddress?: string;
  invoiceDate: string;
  dueDate: string;
  items: InvoiceItem[];
  tax?: number;
  notes?: string;
  paymentInfo?: PaymentInfo;
  signatureName?: string;
  signatureImage?: string;
  socialMedia?: SocialMedia;
  status: 'paid' | 'unpaid';
  template: 'simple' | 'elegant' | 'corporate';
  createdAt: string;
}

export const calculateSubtotal = (items: InvoiceItem[]): number => {
  return items.reduce((sum, item) => sum + item.quantity * item.price, 0);
};

export const calculateTotal = (items: InvoiceItem[], tax?: number): number => {
  const subtotal = calculateSubtotal(items);
  const taxAmount = tax ? (subtotal * tax) / 100 : 0;
  return subtotal + taxAmount;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const generateInvoiceNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${year}${month}-${random}`;
};

// Saved business names store
const SAVED_BUSINESS_NAMES_KEY = 'saved-business-names';

export const getSavedBusinessNames = (): string[] => {
  try {
    const saved = localStorage.getItem(SAVED_BUSINESS_NAMES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const saveBusinessName = (name: string): void => {
  const names = getSavedBusinessNames();
  if (!names.includes(name) && name.trim()) {
    names.unshift(name);
    localStorage.setItem(SAVED_BUSINESS_NAMES_KEY, JSON.stringify(names.slice(0, 10)));
  }
};
