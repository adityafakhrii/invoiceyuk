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
  FileEdit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import LandingNavbar from '@/components/LandingNavbar';
import logoInvoiceYuk from '@/assets/logo-invoiceyuk.png';

const Index = () => {
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
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden border-b-2 border-primary bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:24px_24px] [background-position:center] bg-opacity-[0.03]">
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-md border-2 border-primary bg-secondary text-primary text-sm font-bold mb-8 shadow-neo-sm">
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
              <Link to="/login">
                <Button variant="default" size="xl" className="w-full sm:w-auto text-base">
                  <LogIn className="w-5 h-5" />
                  Coba Sekarang
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="xl" className="w-full sm:w-auto text-base">
                  Lihat Fitur
                </Button>
              </a>
            </div>

            {/* Social Proof */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm font-bold text-navy-600">
              <div className="flex items-center gap-2 border-2 border-primary px-3 py-1.5 rounded-md bg-white shadow-neo-sm">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                100% Gratis
              </div>
              <div className="flex items-center gap-2 border-2 border-primary px-3 py-1.5 rounded-md bg-white shadow-neo-sm">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                Akses Email & Password
              </div>
              <div className="flex items-center gap-2 border-2 border-primary px-3 py-1.5 rounded-md bg-white shadow-neo-sm">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                Export PDF Langsung
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
              <div className="relative bg-card rounded-2xl border-2 border-primary shadow-neo p-6 md:p-10">
                <div className="absolute top-4 right-4 bg-accent text-accent-foreground border-2 border-primary px-3 py-1 rounded text-xs font-black uppercase tracking-wider shadow-neo-sm">
                  Preview Template
                </div>
                {/* Mini Invoice Preview */}
                <div className="bg-background rounded-xl p-6 md:p-8 border-2 border-primary shadow-neo-sm mt-4">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <img src={logoInvoiceYuk} alt="InvoiceYuk Logo" className="h-12 w-12 rounded-lg border-2 border-primary mb-3" />
                      <h3 className="font-extrabold text-xl text-primary">Studio Kreatif Lo</h3>
                      <p className="text-sm font-bold text-muted-foreground">studio@bisnis.co</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-accent tracking-widest uppercase mb-1">INVOICE</p>
                      <p className="text-2xl font-black text-primary">#INV-2026-001</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
                    <div>
                      <p className="text-muted-foreground font-bold mb-1">Tagihan Untuk:</p>
                      <p className="font-extrabold text-primary text-base">PT. Klien Keren</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground font-bold mb-1">Tanggal:</p>
                      <p className="font-extrabold text-primary text-base">29 Desember 2024</p>
                    </div>
                  </div>

                  <div className="border-t-2 border-b-2 border-primary py-4 mb-6">
                    <div className="flex justify-between text-xs font-black text-primary uppercase tracking-wider mb-2">
                      <span>Item</span>
                      <span>Total</span>
                    </div>
                    <div className="flex justify-between text-navy-800 text-sm font-bold">
                      <span>Desain Logo Premium</span>
                      <span className="font-extrabold">Rp 2.500.000</span>
                    </div>
                    <div className="flex justify-between text-navy-800 text-sm font-bold mt-2">
                      <span>Social Media Kit</span>
                      <span className="font-extrabold">Rp 1.500.000</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-secondary p-4 rounded-lg border-2 border-primary">
                    <span className="text-lg font-black text-primary uppercase tracking-wide">Total Tagihan</span>
                    <span className="text-2xl font-black text-accent">Rp 4.000.000</span>
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
              <Link to="/login">
                <Button variant="default" size="xl" className="shadow-neo bg-primary text-primary-foreground border-2 border-primary hover:bg-primary/90">
                  <LogIn className="w-5 h-5" />
                  Coba Sekarang
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
            <div className="flex items-center gap-8 text-sm font-bold text-navy-600">
              <a href="#features" className="hover:text-primary transition-colors">Fitur</a>
              <a href="#how-it-works" className="hover:text-primary transition-colors">Cara Kerja</a>
              <Link to="/login" className="hover:text-primary transition-colors">Dashboard</Link>
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
