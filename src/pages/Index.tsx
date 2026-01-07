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
    { number: "01", title: "Login Dashboard", description: "Masuk pakai username dan PIN" },
    { number: "02", title: "Isi Data Dokumen", description: "Masukin info bisnis, klien, dan item" },
    { number: "03", title: "Download PDF", description: "Export PDF & kirim ke klien" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              Invoice & Quotation Generator untuk Bisnis Modern
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-foreground leading-tight mb-6 animate-fade-in delay-100">
              Bikin Invoice & Quotation
              <br />
              <span className="text-gradient">Gampang Banget!</span> 👋
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in delay-200">
              Cepat, rapi, profesional. Klien langsung <span className="text-foreground font-semibold">respect</span>. 
              Biar usaha kecil rasa corporate besar.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in delay-300">
              <Link to="/pin-login">
                <Button variant="hero" size="xl" className="w-full sm:w-auto">
                  <LogIn className="w-5 h-5" />
                  Masuk Dashboard
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline-light" size="xl" className="w-full sm:w-auto">
                  Lihat Fitur
                </Button>
              </a>
            </div>

            {/* Social Proof */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-in delay-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                100% Gratis
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                Akses dengan PIN
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                Export PDF Langsung
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Invoice Preview Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Preview Card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-accent rounded-3xl blur-3xl opacity-10 transform scale-95" />
              <div className="relative bg-card rounded-2xl shadow-elegant border border-border p-6 md:p-10">
                {/* Mini Invoice Preview */}
                <div className="bg-background rounded-xl p-6 md:p-8 border border-border">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <img src={logoInvoiceYuk} alt="InvoiceYuk Logo" className="h-12 w-auto mb-3" />
                      <h3 className="font-bold text-lg text-foreground">Studio Kreatif Lo</h3>
                      <p className="text-sm text-muted-foreground">studio@bisnis.co</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-muted-foreground">INVOICE</p>
                      <p className="text-2xl font-bold text-foreground">#INV-2026-001</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Tagihan Untuk:</p>
                      <p className="font-semibold text-foreground">PT. Klien Keren</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground mb-1">Tanggal:</p>
                      <p className="font-semibold text-foreground">29 Desember 2024</p>
                    </div>
                  </div>

                  <div className="border-t border-b border-border py-4 mb-4">
                    <div className="flex justify-between text-sm font-medium text-muted-foreground mb-2">
                      <span>Item</span>
                      <span>Total</span>
                    </div>
                    <div className="flex justify-between text-foreground">
                      <span>Desain Logo Premium</span>
                      <span className="font-semibold">Rp 2.500.000</span>
                    </div>
                    <div className="flex justify-between text-foreground mt-2">
                      <span>Social Media Kit</span>
                      <span className="font-semibold">Rp 1.500.000</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-foreground">Total</span>
                    <span className="text-2xl font-extrabold text-gradient">Rp 4.000.000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simpel Banget, Tinggal 3 Langkah
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Karena bikin invoice gak perlu ribet. Cukup login, isi, download. Selesai!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div 
                key={step.number}
                className="relative text-center group"
              >
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-full h-0.5 bg-border" />
                )}
                
                <div className="relative z-10 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary text-primary-foreground text-2xl font-bold mb-4 shadow-card group-hover:shadow-glow transition-shadow duration-300">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Kenapa Harus Pakai InvoiceYuk?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Karena invoice & quotation bukan cuma formalitas, tapi branding bisnis lo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-accent/30 hover:shadow-elegant transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center bg-gradient-primary rounded-3xl p-10 md:p-16 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-foreground/10 rounded-full blur-2xl" />
            
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Siap Bikin Dokumen Profesional?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
                Invoice & quotation elegan = pembayaran makin niat. Mulai sekarang, gratis!
              </p>
              <Link to="/pin-login">
                <Button variant="accent" size="xl">
                  <LogIn className="w-5 h-5" />
                  Masuk Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={logoInvoiceYuk} alt="InvoiceYuk Logo" className="h-8 w-auto" />
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Fitur</a>
              <a href="#how-it-works" className="hover:text-foreground transition-colors">Cara Kerja</a>
              <Link to="/pin-login" className="hover:text-foreground transition-colors">Dashboard</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 InvoiceYuk. Bikin invoice gak pake ribet.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
