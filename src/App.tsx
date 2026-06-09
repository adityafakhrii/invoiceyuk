import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
const NotFound = lazy(() => import("./pages/NotFound"));

// Custom Neo-Brutalist loader for lazy loading fallback
const PageLoader = () => (
  <div className="w-full min-h-[60vh] flex flex-col items-center justify-center">
    <div className="w-12 h-12 border-4 border-primary border-t-accent rounded-full animate-spin shadow-neo-sm" />
    <p className="mt-4 font-bold text-primary uppercase text-sm tracking-widest animate-pulse">Loading Page...</p>
  </div>
);

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
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
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
