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

export const isValidCurrencyCode = (code: string): code is CurrencyCode => {
  return CURRENCIES.some((c) => c.code === code);
};

export type InvoiceStatus = 'paid' | 'unpaid' | 'cancelled' | 'paid_dp';

export type TaxType = 'addition' | 'withholding';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  businessName: string;
  businessLogo?: string;
  clientName: string;
  clientContact?: string;
  clientAddress?: string;
  invoiceDate: string;
  dueDate?: string;
  items: InvoiceItem[];
  tax?: number;
  taxType?: TaxType;
  notes?: string;
  paymentInfo?: PaymentInfo;
  signatureName?: string;
  signatureImage?: string;
  signatureFont?: SignatureFont;
  socialMedia?: SocialMedia;
  status: InvoiceStatus;
  template: 'simple' | 'elegant' | 'corporate';
  currency: CurrencyCode;
  downPayment?: number; // DP amount (absolute value, not percentage)
  dpType?: 'amount' | 'percent'; // How DP was entered
  dpPercent?: number; // DP percentage (stored for display)
  category?: string;
  createdAt: string;
}

export const signatureFonts: { id: SignatureFont; name: string; fontFamily: string }[] = [
  { id: 'dancing', name: 'Dancing Script', fontFamily: "'Dancing Script', cursive" },
  { id: 'vibes', name: 'Great Vibes', fontFamily: "'Great Vibes', cursive" },
  { id: 'pacifico', name: 'Pacifico', fontFamily: "'Pacifico', cursive" },
];

export const calculateSubtotal = (items: InvoiceItem[]): number => {
  return items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
};

export const calculateTaxAmount = (
  subtotal: number,
  tax?: number,
  currency: CurrencyCode = 'IDR'
): number => {
  if (!tax || tax <= 0) return 0;
  const rawTax = (subtotal * tax) / 100;
  return currency === 'IDR' ? Math.round(rawTax) : Math.round(rawTax * 100) / 100;
};

export const calculateTotal = (
  items: InvoiceItem[],
  tax?: number,
  taxType: TaxType = 'addition',
  currency: CurrencyCode = 'IDR'
): number => {
  const subtotal = calculateSubtotal(items);
  const taxAmount = calculateTaxAmount(subtotal, tax, currency);
  if (taxType === 'withholding') {
    return Math.max(0, subtotal - taxAmount);
  }
  return subtotal + taxAmount;
};

export const calculateGrossFromNet = (
  netAmount: number,
  taxPercent: number,
  currency: CurrencyCode = 'IDR'
): { gross: number; taxAmount: number; net: number } => {
  if (!taxPercent || taxPercent <= 0 || taxPercent >= 100 || netAmount <= 0) {
    return { gross: netAmount, taxAmount: 0, net: netAmount };
  }
  const taxRate = taxPercent / 100;
  const rawGross = netAmount / (1 - taxRate);
  const gross = currency === 'IDR' ? Math.round(rawGross) : Math.round(rawGross * 100) / 100;
  const taxAmount = calculateTaxAmount(gross, taxPercent, currency);
  const calculatedNet = gross - taxAmount;
  return { gross, taxAmount, net: calculatedNet };
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

export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
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

export interface InvoiceTemplateStyle {
  headerBg: string;
  headerText: string;
  accentColor: string;
  tableBorder: string;
}

export const INVOICE_TEMPLATE_STYLES: Record<'simple' | 'elegant' | 'corporate', InvoiceTemplateStyle> = {
  elegant: {
    headerBg: 'bg-gradient-to-r from-navy-800 to-navy-600',
    headerText: 'text-primary-foreground',
    accentColor: 'text-accent',
    tableBorder: 'border-navy-100',
  },
  corporate: {
    headerBg: 'bg-navy-900',
    headerText: 'text-primary-foreground',
    accentColor: 'text-navy-700',
    tableBorder: 'border-navy-200',
  },
  simple: {
    headerBg: 'bg-card',
    headerText: 'text-foreground',
    accentColor: 'text-accent',
    tableBorder: 'border-border',
  },
};

export interface TemplatePreviewStyle {
  header: string;
  headerText: string;
  accent: string;
}

export const TEMPLATE_PREVIEW_STYLES: Record<'simple' | 'elegant' | 'corporate', TemplatePreviewStyle> = {
  elegant: {
    header: 'bg-gradient-to-r from-slate-800 to-slate-600',
    headerText: 'text-white',
    accent: 'bg-emerald-500',
  },
  corporate: {
    header: 'bg-slate-900',
    headerText: 'text-white',
    accent: 'bg-slate-700',
  },
  simple: {
    header: 'bg-gray-100',
    headerText: 'text-gray-800',
    accent: 'bg-emerald-500',
  },
};

