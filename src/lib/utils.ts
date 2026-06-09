import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function translateError(message: string): string {
  if (!message) return 'Terjadi kesalahan. Silakan coba lagi.';
  const msg = message.toLowerCase();
  
  if (msg.includes('invalid login credentials')) {
    return 'Email atau password salah. Silakan periksa kembali.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Email belum dikonfirmasi. Silakan periksa kotak masuk atau spam email Anda.';
  }
  if (msg.includes('user already exists') || msg.includes('email already in use')) {
    return 'Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.';
  }
  if (msg.includes('password should be at least')) {
    return 'Password minimal harus 6 karakter.';
  }
  if (msg.includes('rate limit exceeded')) {
    return 'Terlalu banyak mencoba. Silakan tunggu beberapa saat lagi.';
  }
  if (msg.includes('network request failed')) {
    return 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
  }
  
  return message;
}
