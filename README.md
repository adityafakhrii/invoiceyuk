# InvoiceYuk - Aplikasi Manajemen Invoice

**InvoiceYuk** adalah aplikasi web modern yang dirancang untuk membantu para profesional dan pemilik usaha kecil dalam membuat, mengelola, dan melacak invoice dengan mudah dan efisien. Dibangun dengan tumpukan teknologi modern, aplikasi ini menawarkan antarmuka yang bersih, responsif, dan intuitif.

## 🚀 Live Demo

Anda dapat mencoba aplikasi secara langsung melalui tautan berikut:

**URL**: [https://invoiceyuk.vercel.app](https://invoiceyuk.vercel.app)

Gunakan kredensial di bawah ini untuk masuk ke akun demo:
- **Username**: `demo`
- **PIN**: `123321`

## ✨ Fitur Utama

- **Manajemen Invoice Lengkap**: Buat, lihat, edit, dan hapus invoice dengan mudah.
- **Otentikasi Aman**: Sistem login berbasis PIN yang aman dengan manajemen sesi.
- **Dasbor Interaktif**: Visualisasikan data invoice Anda dengan ringkasan statistik dan bagan.
- **Ekspor ke PDF**: Unduh invoice dalam format PDF profesional dengan satu klik.
- **Kustomisasi Fleksibel**: Pilih dari berbagai templat invoice dan atur mata uang sesuai kebutuhan.
- **Manajemen Klien & Bisnis**: Simpan informasi bisnis dan klien untuk pembuatan invoice yang lebih cepat.
- **Riwayat Invoice**: Lacak semua invoice yang pernah Anda buat dan kelola status pembayarannya (Lunas/Belum Lunas).
- **Desain Responsif**: Akses dan kelola invoice Anda dari perangkat apa pun, baik desktop maupun mobile.
- **Panel Admin**: Antarmuka khusus untuk admin mengelola pengguna terdaftar.

## 🚀 Tumpukan Teknologi

Proyek ini dibangun menggunakan serangkaian teknologi modern untuk memastikan performa, skalabilitas, dan kemudahan pengembangan.

- **Frontend**:
  - **Framework**: [React](https://reactjs.org/)
  - **Build Tool**: [Vite](https://vitejs.dev/)
  - **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
  - **Styling**: [Tailwind CSS](https://tailwindcss.com/)
  - **Komponen UI**: [Shadcn/ui](https://ui.shadcn.com/)
  - **Manajemen State**: [Zustand](https://github.com/pmndrs/zustand)
  - **Routing**: [React Router](https://reactrouter.com/)
  - **Manajemen Formulir**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
  - **Visualisasi Data**: [Recharts](https://recharts.org/)

- **Backend**:
  - **Platform**: [Supabase](https://supabase.io/)
  - **Database**: PostgreSQL
  - **Fitur**: Otentikasi, Penyimpanan, dan Fungsi RPC (Remote Procedure Call)

## 🛠️ Menjalankan Proyek Secara Lokal

Untuk menjalankan proyek ini di lingkungan pengembangan lokal Anda, ikuti langkah-langkah berikut:

### **Prasyarat**

- [Node.js](https://nodejs.org/) (versi 18 atau lebih baru)
- [Bun](https://bun.sh/) (opsional, sebagai package manager alternatif)
- Akun [Supabase](https://supabase.io/) untuk setup database dan otentikasi.

### **1. Kloning Repositori**

```bash
git clone https://github.com/username/invoiceyuk.git
cd invoiceyuk
```

### **2. Instalasi Dependensi**

Gunakan `npm`, `yarn`, atau `bun` untuk menginstal semua dependensi yang diperlukan.

```bash
npm install
```
atau
```bash
bun install
```

### **3. Konfigurasi Lingkungan (Environment)**

1. Buat file `.env` di direktori root proyek.
2. Dapatkan **URL Proyek** dan **Kunci Anon (Public)** dari dasbor Supabase Anda (Settings > API).
3. Tambahkan variabel berikut ke dalam file `.env` Anda:

```env
VITE_SUPABASE_URL="URL_PROYEK_SUPABASE_ANDA"
VITE_SUPABASE_ANON_KEY="KUNCI_ANON_SUPABASE_ANDA"
```

### **4. Setup Database Supabase**

Jalankan migrasi database yang tersedia di direktori `supabase/migrations` menggunakan Supabase CLI atau langsung dari editor SQL di dasbor Supabase untuk membuat tabel dan fungsi RPC yang diperlukan.

### **5. Jalankan Server Pengembangan**

Setelah konfigurasi selesai, jalankan server pengembangan Vite.

```bash
npm run dev
```

Aplikasi sekarang akan berjalan di `http://localhost:5173` (atau port lain yang tersedia).

## 📜 Skrip yang Tersedia

- **`npm run dev`**: Menjalankan aplikasi dalam mode pengembangan.
- **`npm run build`**: Membuat build aplikasi untuk produksi.
- **`npm run lint`**: Menjalankan linter untuk memeriksa kualitas kode.
- **`npm run preview`**: Menjalankan build produksi secara lokal untuk pengujian.
