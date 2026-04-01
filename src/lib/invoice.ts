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

export type SignatureFont = 'dancing' | 'vibes' | 'pacifico';

export type CurrencyCode = 'IDR' | 'USD' | 'EUR';

export const CURRENCIES: { code: CurrencyCode; label: string; symbol: string; locale: string }[] = [
  { code: 'IDR', label: 'Rupiah (IDR)', symbol: 'Rp', locale: 'id-ID' },
  { code: 'USD', label: 'US Dollar (USD)', symbol: '$', locale: 'en-US' },
  { code: 'EUR', label: 'Euro (EUR)', symbol: '€', locale: 'de-DE' },
];

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
  signatureFont?: SignatureFont;
  socialMedia?: SocialMedia;
  status: 'paid' | 'unpaid';
  template: 'simple' | 'elegant' | 'corporate';
  currency: CurrencyCode;
  downPayment?: number; // DP amount (absolute value, not percentage)
  category?: string;
  createdAt: string;
}

export const signatureFonts: { id: SignatureFont; name: string; fontFamily: string }[] = [
  { id: 'dancing', name: 'Dancing Script', fontFamily: "'Dancing Script', cursive" },
  { id: 'vibes', name: 'Great Vibes', fontFamily: "'Great Vibes', cursive" },
  { id: 'pacifico', name: 'Pacifico', fontFamily: "'Pacifico', cursive" },
];

export const calculateSubtotal = (items: InvoiceItem[]): number => {
  return items.reduce((sum, item) => sum + item.quantity * item.price, 0);
};

export const calculateTotal = (items: InvoiceItem[], tax?: number): number => {
  const subtotal = calculateSubtotal(items);
  const taxAmount = tax ? (subtotal * tax) / 100 : 0;
  return subtotal + taxAmount;
};

export const formatCurrency = (amount: number, currency: CurrencyCode = 'IDR'): string => {
  const config = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: currency === 'IDR' ? 0 : 2,
    maximumFractionDigits: currency === 'IDR' ? 0 : 2,
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
  const suffix = Date.now().toString(36).slice(-5).toUpperCase();
  return `INV-${year}${month}-${suffix}`;
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

// Saved categories store
const SAVED_CATEGORIES_KEY = 'saved-categories';

export const getSavedCategories = (): string[] => {
  try {
    const saved = localStorage.getItem(SAVED_CATEGORIES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const saveCategory = (name: string): void => {
  const cats = getSavedCategories();
  if (!cats.includes(name) && name.trim()) {
    cats.unshift(name);
    localStorage.setItem(SAVED_CATEGORIES_KEY, JSON.stringify(cats.slice(0, 20)));
  }
};
