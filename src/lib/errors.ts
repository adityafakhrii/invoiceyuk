/**
 * Secure error handling utility
 * Maps database errors to user-friendly messages without exposing internals
 */

interface PostgresError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

/**
 * Maps database errors to safe, user-friendly messages
 * Never exposes raw database errors, table names, or schema details
 */
export function mapDatabaseError(error: unknown): string {
  const pgError = error as PostgresError;
  
  // PostgreSQL error codes
  if (pgError?.code === '23505') {  // Unique violation
    if (pgError.message?.toLowerCase().includes('username')) {
      return 'Username sudah digunakan';
    }
    if (pgError.message?.toLowerCase().includes('invoice_number')) {
      return 'Nomor invoice sudah ada';
    }
    return 'Data sudah ada di sistem';
  }
  
  if (pgError?.code === '23503') {  // Foreign key violation
    return 'Data terkait tidak ditemukan';
  }
  
  if (pgError?.code === '23502') {  // Not null violation
    return 'Data wajib harus diisi';
  }
  
  if (pgError?.code === '23514') {  // Check constraint violation
    return 'Data tidak valid';
  }

  // Check for custom function exceptions (safe messages from our RPC functions)
  const message = pgError?.message?.toLowerCase() || '';
  
  // Rate limiting
  if (message.includes('terlalu banyak percobaan') || message.includes('too many')) {
    return 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.';
  }
  
  // Authentication/Authorization errors
  if (message.includes('only admins') || message.includes('access denied')) {
    return 'Akses ditolak - hanya admin';
  }
  
  if (message.includes('authentication required') || message.includes('caller id is required')) {
    return 'Sesi tidak valid';
  }
  
  // Validation errors - these are safe to show as they come from our own validation
  if (message.includes('is required')) {
    if (message.includes('name')) return 'Nama wajib diisi';
    if (message.includes('username')) return 'Username wajib diisi';
    if (message.includes('pin')) return 'PIN wajib diisi';
    if (message.includes('invoice')) return 'Nomor invoice wajib diisi';
    if (message.includes('business')) return 'Nama bisnis wajib diisi';
    if (message.includes('client')) return 'Nama klien wajib diisi';
    return 'Data wajib diisi';
  }
  
  if (message.includes('too long')) {
    return 'Data terlalu panjang';
  }
  
  if (message.includes('at least 3 characters')) {
    return 'Username minimal 3 karakter';
  }
  
  if (message.includes('exactly 6 digits')) {
    return 'PIN harus 6 digit angka';
  }
  
  if (message.includes('lowercase letters, numbers')) {
    return 'Username hanya boleh huruf kecil, angka, dan underscore';
  }
  
  if (message.includes('must be a valid json array')) {
    return 'Format item tidak valid';
  }
  
  if (message.includes('must be paid or unpaid')) {
    return 'Status tidak valid';
  }
  
  if (message.includes('invalid template')) {
    return 'Template tidak valid';
  }

  // Generic fallback - never show raw error
  return 'Terjadi kesalahan. Silakan coba lagi atau hubungi admin.';
}

/**
 * Checks if the error is a duplicate key/unique constraint violation
 */
export function isDuplicateError(error: unknown): boolean {
  const pgError = error as PostgresError;
  return pgError?.code === '23505' || 
    (pgError?.message?.toLowerCase().includes('duplicate key') ?? false) ||
    (pgError?.message?.toLowerCase().includes('unique') ?? false);
}

/**
 * Checks if the error is related to a specific field
 */
export function isFieldError(error: unknown, fieldName: string): boolean {
  const pgError = error as PostgresError;
  return pgError?.message?.toLowerCase().includes(fieldName.toLowerCase()) ?? false;
}

/**
 * Securely logs errors - only in development mode
 * In production, errors should be sent to a monitoring service
 */
export function logErrorSecurely(context: string, error: unknown): void {
  // Only log detailed errors in development
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
  }
  // In production, consider sending to error tracking service like Sentry
  // Example: Sentry.captureException(error, { tags: { context } });
}
