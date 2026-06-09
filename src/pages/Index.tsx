import { Link } from 'react-router-dom';
import { 
  Receipt, 
  Zap, 
  Download, 
  CheckCircle2, 
  Sparkles,
  Shield,
  Clock,
  LogIn,
  FileEdit,
  LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import LandingNavbar from '@/components/LandingNavbar';
import logoInvoiceYuk from '@/assets/logo-invoiceyuk.png';
import { useAuthStore } from '@/store/authStore';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

const Index = () => {
  const { user } = useAuthStore();
  const features = [
    {
      icon: Zap,
      title: "Super Cepat",
      description: "Isi form, klik, invoice/quotation jadi. Gak pake lama, gak pake ribet."
    },
    {
      icon: Sparkles,
      title: "Template Elegan",
      description: "Pilih template yang bikin dokumen lo keliatan premium & profesional."
    },
    {
      icon: Download,
      title: "Export PDF",
      description: "Download langsung jadi PDF. Siap kirim ke klien dalam hitungan detik."
    },
    {
      icon: Shield,
      title: "Branding Bisnis",
      description: "Tambah logo & nama bisnis. Biar keliatan makin kredibel."
    },
    {
      icon: Clock,
      title: "Riwayat Lengkap",
      description: "Semua dokumen tersimpan rapi. Gampang dicari kapan aja."
    },
    {
      icon: CheckCircle2,
      title: "Status Tracking",
      description: "Tandai invoice udah dibayar atau belum. Simple tapi penting."
    },
  ];

  const steps = [
    { number: "01", title: "Login Dashboard", description: "Masuk pakai email dan password" },
    { number: "02", title: "Isi Data Dokumen", description: "Masukin info bisnis, klien, dan item" },
    { number: "03", title: "Download PDF", description: "Export PDF & kirim ke klien" },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] text-foreground selection:bg-accent selection:text-accent-foreground">
      <LandingNavbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden border-b-2 border-primary bg-[radial-gradient(#94a3b8_1.5px,transparent_1.5px)] [background-size:24px_24px] [background-position:center]">
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center justify-center text-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-none border-2 border-primary bg-secondary text-primary text-[10px] xs:text-xs md:text-sm font-bold mb-8 shadow-neo-sm">
              Invoice & Quotation Generator untuk Bisnis Modern
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-primary leading-none tracking-tighter mb-8 uppercase">
              Bikin Invoice
              <br />
              <span className="text-accent underline decoration-primary decoration-4 underline-offset-8">Gampang Banget</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-navy-800 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
              Cepat, rapi, profesional. Klien langsung <span className="text-primary font-bold underline decoration-accent decoration-2">respect</span>. 
              Biar usaha kecil rasa corporate besar.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={user ? "/dashboard" : "/login"}>
                <Button variant="default" size="xl" className="w-full sm:w-auto text-base">
                  {user ? <LayoutDashboard className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  {user ? 'Ke Dashboard' : 'Coba Sekarang'}
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="xl" className="w-full sm:w-auto text-base bg-white">
                  Lihat Fitur
                </Button>
              </a>
            </div>

            {/* Social Proof */}
            <div className="mt-12 grid grid-cols-3 gap-2 sm:gap-4 md:flex md:flex-wrap md:justify-center md:gap-8 max-w-md sm:max-w-2xl md:max-w-none mx-auto text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-bold text-navy-600">
              <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left gap-1 sm:gap-2 border-2 border-primary px-1 py-1.5 sm:px-3 sm:py-2 bg-white shadow-neo-sm rounded-none">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent flex-shrink-0" />
                <span className="leading-tight">100% Gratis</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left gap-1 sm:gap-2 border-2 border-primary px-1 py-1.5 sm:px-3 sm:py-2 bg-white shadow-neo-sm rounded-none">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent flex-shrink-0" />
                <span className="leading-tight">Custom Logo</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left gap-1 sm:gap-2 border-2 border-primary px-1 py-1.5 sm:px-3 sm:py-2 bg-white shadow-neo-sm rounded-none">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent flex-shrink-0" />
                <span className="leading-tight">Export PDF</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Invoice Preview Section */}
      <section className="py-20 bg-background border-b-2 border-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Preview Card */}
            <div className="relative">
              <div className="relative bg-card rounded-none border-2 border-primary shadow-neo p-3 xs:p-4 md:p-10">
                <div className="flex justify-center md:block mb-6 md:mb-0">
                  <div className="md:absolute md:top-4 md:right-4 bg-accent text-accent-foreground border-2 border-primary px-3 py-1 rounded-none text-xs font-black uppercase tracking-wider shadow-neo-sm">
                    Preview Template
                  </div>
                </div>
                {/* Mini Invoice Preview */}
                <div className="bg-background rounded-none p-3 xs:p-4 md:p-8 border-2 border-primary shadow-neo-sm mt-4">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <img src={logoInvoiceYuk} alt="InvoiceYuk Logo" className="h-9 w-9 md:h-12 md:w-12 rounded-none border-2 border-primary mb-2 md:mb-3" />
                      <h3 className="font-extrabold text-sm md:text-xl text-primary leading-tight">Studio Kreatif Lo</h3>
                      <p className="text-[10px] md:text-sm font-bold text-muted-foreground">studio@bisnis.co</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] md:text-xs font-black text-accent tracking-widest uppercase mb-1">INVOICE</p>
                      <p className="text-sm md:text-2xl font-black text-primary whitespace-nowrap">#INV-2026-001</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 md:gap-4 mb-6 md:mb-8 text-[10px] md:text-sm">
                    <div>
                      <p className="text-muted-foreground font-bold mb-0.5 md:mb-1">Tagihan Untuk:</p>
                      <p className="font-extrabold text-primary text-xs md:text-base leading-tight">PT. Klien Keren</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground font-bold mb-0.5 md:mb-1">Tanggal:</p>
                      <p className="font-extrabold text-primary text-xs md:text-base leading-tight">29 Desember 2024</p>
                    </div>
                  </div>

                  <div className="border-t-2 border-b-2 border-primary py-3 md:py-4 mb-5 md:mb-6">
                    <div className="flex justify-between text-[10px] md:text-xs font-black text-primary uppercase tracking-wider mb-2">
                      <span>Item</span>
                      <span>Total</span>
                    </div>
                    <div className="flex justify-between text-navy-800 text-xs md:text-sm font-bold gap-2">
                      <span className="truncate">Desain Logo Premium</span>
                      <span className="font-extrabold whitespace-nowrap">Rp 2.500.000</span>
                    </div>
                    <div className="flex justify-between text-navy-800 text-xs md:text-sm font-bold mt-2 gap-2">
                      <span className="truncate">Social Media Kit</span>
                      <span className="font-extrabold whitespace-nowrap">Rp 1.500.000</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-secondary p-2.5 md:p-4 rounded-none border-2 border-primary">
                    <span className="text-[10px] xs:text-xs md:text-lg font-black text-primary uppercase tracking-wide">Total Tagihan</span>
                    <span className="text-sm md:text-2xl font-black text-accent whitespace-nowrap">Rp 4.000.000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-secondary border-b-2 border-primary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-primary uppercase tracking-tight mb-4">
              Simpel Banget, 3 Langkah
            </h2>
            <p className="text-navy-800 font-bold max-w-xl mx-auto">
              Karena bikin invoice gak perlu ribet. Cukup login, isi, download. Selesai!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step) => (
              <div 
                key={step.number}
                className="relative p-8 bg-card border-2 border-primary shadow-neo rounded-xl group hover:-translate-y-1 transition-all duration-200"
              >
                <div className="absolute -top-6 left-6 inline-flex items-center justify-center w-12 h-12 rounded-lg border-2 border-primary bg-accent text-accent-foreground text-xl font-black shadow-neo-sm">
                  {step.number}
                </div>
                <div className="pt-4">
                  <h3 className="text-xl font-black text-primary mb-3 uppercase tracking-tight">{step.title}</h3>
                  <p className="text-muted-foreground font-semibold text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-background border-b-2 border-primary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-primary uppercase tracking-tight mb-4">
              Kenapa Harus InvoiceYuk?
            </h2>
            <p className="text-navy-800 font-bold max-w-xl mx-auto">
              Karena invoice & quotation bukan cuma formalitas, tapi branding bisnis lo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="group p-8 rounded-xl bg-card border-2 border-primary shadow-neo hover:shadow-neo-accent hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all duration-150"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-lg bg-accent/10 border-2 border-primary flex items-center justify-center mb-6 shadow-neo-sm group-hover:bg-accent/20 transition-all">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-black text-primary mb-3 uppercase tracking-tight">{feature.title}</h3>
                <p className="text-muted-foreground text-sm font-semibold leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-secondary border-b-2 border-primary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-primary uppercase tracking-tight mb-4">
              Harga Paket Terbaik
            </h2>
            <p className="text-navy-800 font-bold max-w-xl mx-auto">
              Akses seluruh fitur premium tanpa biaya bulanan tersembunyi.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-card border-2 border-primary p-8 shadow-neo rounded-xl relative">
            {/* Gimmick Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground border-2 border-primary px-3 py-1 rounded text-xs font-black uppercase tracking-wider shadow-neo-sm whitespace-nowrap">
              Promo Terbatas
            </div>

            <div className="text-center mb-8 pb-6 border-b-2 border-primary/10">
              <h3 className="text-2xl font-black text-primary uppercase mb-2">Paket Lifetime</h3>
              <p className="text-muted-foreground text-sm font-semibold mb-6">Cocok untuk freelancer & pemilik UMKM</p>
              <div className="flex justify-center items-baseline gap-2">
                <span className="text-sm font-extrabold text-muted-foreground line-through">Rp 199.000</span>
                <span className="text-5xl font-black text-accent">Rp 0</span>
                <span className="text-sm font-bold text-navy-800">/ Selamanya</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                "Unlimited Pembuatan Invoice",
                "Unlimited Pembuatan Quotation (Penawaran)",
                "Ekspor PDF Cepat Satu Klik",
                "Kustomisasi Logo Bisnis Sendiri",
                "Dasbor Statistik & Bagan Keuangan",
                "Pelacakan Status Bayar (Paid/Unpaid)",
                "Penyimpanan Riwayat Aman di Cloud",
                "Akses Gratis Semua Fitur Baru"
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm font-bold text-navy-800">
                  <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link to={user ? "/dashboard" : "/login"}>
              <Button variant="default" size="xl" className="w-full shadow-neo bg-primary text-primary-foreground border-2 border-primary hover:bg-primary/95">
                {user ? 'Ke Dashboard' : 'Mulai Sekarang - 100% Gratis'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-background border-b-2 border-primary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-primary uppercase tracking-tight mb-4">
              Pertanyaan yang Sering Diajukan (FAQ)
            </h2>
            <p className="text-navy-800 font-bold max-w-xl mx-auto">
              Punya pertanyaan seputar InvoiceYuk? Temukan jawabannya di sini
            </p>
          </div>

          <div className="max-w-3xl mx-auto bg-card border-2 border-primary p-6 md:p-10 shadow-neo rounded-xl">
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="faq-1" className="border-2 border-primary p-4 bg-background shadow-neo-sm">
                <AccordionTrigger className="text-left font-black text-primary hover:no-underline hover:text-accent text-base md:text-lg">
                  Apakah InvoiceYuk benar-benar gratis?
                </AccordionTrigger>
                <AccordionContent className="text-navy-800 font-medium leading-relaxed mt-2 text-sm">
                  Ya, 100% gratis! Anda bisa membuat invoice dan quotation sebanyak apa pun yang Anda butuhkan tanpa biaya tersembunyi, tanpa batas jumlah dokumen, dan tanpa perlu mendaftarkan kartu kredit.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-2" className="border-2 border-primary p-4 bg-background shadow-neo-sm">
                <AccordionTrigger className="text-left font-black text-primary hover:no-underline hover:text-accent text-base md:text-lg">
                  Bagaimana keamanan data bisnis dan invoice saya dijamin?
                </AccordionTrigger>
                <AccordionContent className="text-navy-800 font-medium leading-relaxed mt-2 text-sm">
                  Data Anda disimpan dengan aman di server cloud database Supabase. Keamanan data dilindungi menggunakan sistem otentikasi Supabase Auth dan pembatasan Row Level Security (RLS) PostgreSQL dinamis, sehingga data Anda terisolasi secara penuh dan hanya bisa diakses oleh akun Anda sendiri.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-3" className="border-2 border-primary p-4 bg-background shadow-neo-sm">
                <AccordionTrigger className="text-left font-black text-primary hover:no-underline hover:text-accent text-base md:text-lg">
                  Apakah saya bisa menambahkan logo bisnis sendiri?
                </AccordionTrigger>
                <AccordionContent className="text-navy-800 font-medium leading-relaxed mt-2 text-sm">
                  Tentu saja! Anda dapat mengunggah logo bisnis Anda sendiri (dalam format gambar PNG/JPG) ketika mengisi formulir pembuatan invoice atau quotation. Logo tersebut akan tersemat secara otomatis pada template dokumen Anda.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-4" className="border-2 border-primary p-4 bg-background shadow-neo-sm">
                <AccordionTrigger className="text-left font-black text-primary hover:no-underline hover:text-accent text-base md:text-lg">
                  Bagaimana cara mengunduh invoice menjadi file PDF?
                </AccordionTrigger>
                <AccordionContent className="text-navy-800 font-medium leading-relaxed mt-2 text-sm">
                  Setelah selesai mengisi formulir dan menyimpannya, Anda akan diarahkan langsung ke halaman pratinjau invoice. Di halaman tersebut, Anda tinggal mengeklik tombol "Download PDF" dengan ikon unduhan untuk menyimpannya ke perangkat Anda dalam hitungan detik.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-5" className="border-2 border-primary p-4 bg-background shadow-neo-sm">
                <AccordionTrigger className="text-left font-black text-primary hover:no-underline hover:text-accent text-base md:text-lg">
                  Apakah saya bisa melacak status pembayaran invoice?
                </AccordionTrigger>
                <AccordionContent className="text-navy-800 font-medium leading-relaxed mt-2 text-sm">
                  Bisa. Melalui dashboard utama dan riwayat, Anda dapat melacak invoice mana saja yang sudah dibayar ("Paid"), belum dibayar ("Unpaid"), atau dibatalkan ("Canceled"). Anda juga bisa menandai status pembayaran tersebut secara instan.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-6" className="border-2 border-primary p-4 bg-background shadow-neo-sm">
                <AccordionTrigger className="text-left font-black text-primary hover:no-underline hover:text-accent text-base md:text-lg">
                  Apa perbedaan antara Invoice dan Quotation di InvoiceYuk?
                </AccordionTrigger>
                <AccordionContent className="text-navy-800 font-medium leading-relaxed mt-2 text-sm">
                  Invoice diterbitkan sebagai bukti penagihan pembayaran resmi setelah barang atau jasa diselesaikan. Sementara Quotation (penawaran harga) dikirimkan terlebih dahulu ke calon klien sebagai estimasi harga penawaran resmi yang memiliki batasan masa berlaku tertentu sebelum kesepakatan dicapai.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center bg-accent border-2 border-primary rounded-2xl p-10 md:p-16 shadow-neo relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-black text-primary-foreground mb-4 uppercase tracking-tight">
                Siap Bikin Dokumen Profesional?
              </h2>
              <p className="text-primary-foreground/90 font-bold mb-8 max-w-lg mx-auto text-base">
                Invoice & quotation elegan = pembayaran makin niat. Mulai sekarang, gratis!
              </p>
              <Link to={user ? "/dashboard" : "/login"}>
                <Button variant="default" size="xl" className="shadow-neo bg-primary text-primary-foreground border-2 border-primary hover:bg-primary/90">
                  {user ? <LayoutDashboard className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  {user ? 'Ke Dashboard' : 'Coba Sekarang'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t-2 border-primary">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={logoInvoiceYuk} alt="InvoiceYuk Logo" className="h-8 w-8 rounded-lg border-2 border-primary" />
              <span className="font-black text-lg text-primary uppercase tracking-tight">InvoiceYuk</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-bold text-navy-600">
              <a href="#how-it-works" className="hover:text-primary transition-colors">Cara Kerja</a>
              <a href="#features" className="hover:text-primary transition-colors">Fitur</a>
              <a href="#pricing" className="hover:text-primary transition-colors">Harga</a>
              <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
              <Link to={user ? "/dashboard" : "/login"} className="hover:text-primary transition-colors">Dashboard</Link>
            </div>
            <div className="flex flex-col items-center md:items-end gap-2">
              <p className="text-sm font-semibold text-muted-foreground">
                © 2026 InvoiceYuk. Bikin invoice gak pake ribet.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 text-xs font-bold text-muted-foreground">
                <Link to="/privacy" className="hover:text-primary transition-colors underline decoration-dotted">Kebijakan Privasi</Link>
                <span className="text-gray-300 hidden sm:inline">|</span>
                <a 
                  href="https://www.instagram.com/adityafakhrii" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1 hover:text-accent transition-colors text-primary font-bold"
                >
                  Made with <span className="text-red-500 animate-pulse">❤️</span> by @adityafakhrii
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
