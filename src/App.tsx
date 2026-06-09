import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import SidebarLayout from "./components/SidebarLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import { useAuthStore } from "./store/authStore";

// Lazy loaded pages
const Index = lazy(() => import("./pages/Index"));
const BuatInvoice = lazy(() => import("./pages/BuatInvoice"));
const BuatQuotation = lazy(() => import("./pages/BuatQuotation"));
const EditInvoice = lazy(() => import("./pages/EditInvoice"));
const Riwayat = lazy(() => import("./pages/Riwayat"));
const PreviewInvoice = lazy(() => import("./pages/PreviewInvoice"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const Laporan = lazy(() => import("./pages/Laporan"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Custom Neo-Brutalist loader for lazy loading fallback
const PageLoader = () => (
  <div className="w-full min-h-[60vh] flex flex-col items-center justify-center">
    <div className="w-12 h-12 border-4 border-primary border-t-accent rounded-full animate-spin shadow-neo-sm" />
    <p className="mt-4 font-bold text-primary uppercase text-sm tracking-widest animate-pulse">Loading Page...</p>
  </div>
);

// Route-level SEO & Meta Manager
const RouteSeoManager = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = 'InvoiceYuk';
    let description = 'InvoiceYuk - Platform bikin invoice dan quotation profesional yang super gampang. Cocok buat freelancer, UMKM, dan pebisnis online!';
    let noindex = false;

    if (path === '/') {
      title = 'InvoiceYuk - Bikin Invoice & Quotation, Gampang Banget!';
    } else if (path === '/privacy') {
      title = 'Kebijakan Privasi';
      description = 'Kebijakan Privasi InvoiceYuk. Pelajari bagaimana kami melindungi data bisnis, logo, dan rincian transaksi invoice Anda.';
    } else if (path === '/login') {
      title = 'Masuk ke Akun Anda';
      description = 'Masuk ke Dashboard InvoiceYuk untuk mengelola, membuat, dan mencetak invoice serta quotation bisnis Anda secara instan.';
    } else if (path === '/register') {
      title = 'Daftar Akun Baru';
      description = 'Buat akun gratis di InvoiceYuk dan mulai membuat invoice & quotation profesional untuk bisnis Anda dalam hitungan detik.';
    } else {
      // All other pages are private dashboard paths or 404s
      noindex = true;
      if (path === '/dashboard') {
        title = 'Dashboard';
      } else if (path === '/riwayat') {
        title = 'Riwayat Invoice';
      } else if (path === '/profile') {
        title = 'Profil Pengguna';
      } else if (path === '/buat-invoice') {
        title = 'Buat Invoice Baru';
      } else if (path === '/buat-quotation') {
        title = 'Buat Quotation Baru';
      } else if (path.startsWith('/edit-invoice/')) {
        title = 'Edit Invoice';
      } else if (path.startsWith('/preview/')) {
        title = 'Pratinjau Invoice';
      } else if (path === '/laporan') {
        title = 'Laporan Keuangan';
      } else if (path === '/admin/users') {
        title = 'Manajemen Pengguna';
      } else {
        title = 'Halaman Tidak Ditemukan';
      }
    }

    // Set Document Title
    document.title = title.includes('InvoiceYuk') ? title : `${title} | InvoiceYuk`;

    // Set Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // Set Meta Robots directive
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (noindex) {
      if (!metaRobots) {
        metaRobots = document.createElement('meta');
        metaRobots.setAttribute('name', 'robots');
        document.head.appendChild(metaRobots);
      }
      metaRobots.setAttribute('content', 'noindex, nofollow');
    } else {
      if (metaRobots) {
        metaRobots.setAttribute('content', 'index, follow');
      } else {
        metaRobots = document.createElement('meta');
        metaRobots.setAttribute('name', 'robots');
        metaRobots.setAttribute('content', 'index, follow');
        document.head.appendChild(metaRobots);
      }
    }
  }, [location]);

  return null;
};

// InvoiceYuk - Bikin Invoice, Gampang Banget!
const queryClient = new QueryClient();

const App = () => {
  // Check session expiry on mount (moved from render body to useEffect)
  useEffect(() => {
    useAuthStore.getState().checkSession();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouteSeoManager />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              
              {/* Authenticated routes wrapped in SidebarLayout */}
              <Route element={<ProtectedRoute><SidebarLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
                <Route path="/buat-invoice" element={<BuatInvoice />} />
                <Route path="/buat-quotation" element={<BuatQuotation />} />
                <Route path="/edit-invoice/:id" element={<EditInvoice />} />
                <Route path="/riwayat" element={<Riwayat />} />
                <Route path="/preview/:id" element={<PreviewInvoice />} />
                <Route path="/laporan" element={<Laporan />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
