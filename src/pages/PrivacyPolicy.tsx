import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, Server, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoInvoiceYuk from '@/assets/logo-invoiceyuk.png';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#fafafa] text-foreground selection:bg-accent selection:text-accent-foreground py-12 px-4 md:py-20">
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-bold text-sm">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Home
          </Link>
        </div>

        {/* Branding */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <img src={logoInvoiceYuk} alt="InvoiceYuk Logo" className="h-10 w-10 border-2 border-primary rounded-none" />
          <span className="font-black text-2xl text-primary uppercase tracking-tight">InvoiceYuk</span>
        </div>

        {/* Policy Content Card */}
        <div className="bg-card border-2 border-primary rounded-2xl p-6 md:p-10 shadow-neo space-y-8">
          <div className="text-center border-b border-primary/10 pb-6">
            <h1 className="text-3xl md:text-4xl font-black text-primary uppercase tracking-tight mb-2">
              Kebijakan Privasi
            </h1>
            <p className="text-sm font-semibold text-muted-foreground">
              Terakhir diperbarui: 9 Juni 2026
            </p>
          </div>

          <div className="space-y-6 text-navy-800 leading-relaxed font-medium text-sm">
            <p>
              Selamat datang di <strong>InvoiceYuk</strong>. Kami berkomitmen untuk melindungi privasi dan keamanan informasi pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda ketika Anda menggunakan layanan kami.
            </p>

            {/* Section 1 */}
            <div className="space-y-3">
              <h2 className="text-lg font-black text-primary flex items-center gap-2 uppercase">
                <Lock className="w-5 h-5 text-accent" />
                1. Pengumpulan Informasi
              </h2>
              <p>
                Kami mengumpulkan informasi minimal yang diperlukan untuk menyediakan layanan pembuatan invoice yang aman, yaitu:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Data Akun</strong>: Alamat email, password terenkripsi, nama lengkap, dan username Anda ketika mendaftar.</li>
                <li><strong>Informasi Tambahan</strong>: Profil pekerjaan dan tujuan penggunaan aplikasi untuk verifikasi keamanan akun.</li>
                <li><strong>Data Dokumen</strong>: Informasi bisnis, nama klien, kontak klien, alamat klien, item layanan, tanda tangan, nomor rekening, dan detail invoice/quotation yang Anda buat.</li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="space-y-3">
              <h2 className="text-lg font-black text-primary flex items-center gap-2 uppercase">
                <Eye className="w-5 h-5 text-accent" />
                2. Penggunaan Informasi
              </h2>
              <p>
                Kami menggunakan data yang dikumpulkan untuk:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Menyediakan, menjalankan, dan memelihara fitur pembuatan invoice dan laporan keuangan Anda.</li>
                <li>Memverifikasi identitas Anda dan mengamankan akun Anda menggunakan sistem otentikasi Supabase Auth.</li>
                <li>Mengamankan database Anda menggunakan aturan Row Level Security (RLS) PostgreSQL, sehingga data Anda tidak dapat diakses oleh pengguna lain.</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="space-y-3">
              <h2 className="text-lg font-black text-primary flex items-center gap-2 uppercase">
                <Server className="w-5 h-5 text-accent" />
                3. Penyimpanan & Keamanan Data
              </h2>
              <p>
                Semua data disimpan di server database aman yang dihosting oleh <strong>Supabase</strong>. Keamanan data Anda diproteksi dengan:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Enkripsi kata sandi menggunakan hash standar industri (bcrypt/scrypt) yang dikelola oleh Supabase Auth.</li>
                <li>Row Level Security (RLS) PostgreSQL dinamis (`auth.uid() = user_id`) untuk memastikan isolasi penuh terhadap data Anda.</li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="space-y-3">
              <h2 className="text-lg font-black text-primary flex items-center gap-2 uppercase">
                <RefreshCw className="w-5 h-5 text-accent" />
                4. Hak Anda Atas Data
              </h2>
              <p>
                Anda memiliki kontrol penuh terhadap data Anda:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Anda dapat memperbarui profil bisnis Anda kapan saja melalui halaman Pengaturan.</li>
                <li>Anda dapat mengedit, menghapus, atau menduplikasi invoice/quotation Anda sendiri secara bebas.</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-primary/10 flex justify-center">
            <Link to="/">
              <Button variant="hero" size="lg">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Beranda
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
