import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import BuatInvoice from "./pages/BuatInvoice";
import BuatQuotation from "./pages/BuatQuotation";
import EditInvoice from "./pages/EditInvoice";
import Riwayat from "./pages/Riwayat";
import PreviewInvoice from "./pages/PreviewInvoice";
import PinLogin from "./pages/PinLogin";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import AdminUsers from "./pages/AdminUsers";
import Laporan from "./pages/Laporan";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuthStore } from "./store/authStore";

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
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/pin-login" element={<PinLogin />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
            <Route path="/buat-invoice" element={<ProtectedRoute><BuatInvoice /></ProtectedRoute>} />
            <Route path="/buat-quotation" element={<ProtectedRoute><BuatQuotation /></ProtectedRoute>} />
            <Route path="/edit-invoice/:id" element={<ProtectedRoute><EditInvoice /></ProtectedRoute>} />
            <Route path="/riwayat" element={<ProtectedRoute><Riwayat /></ProtectedRoute>} />
            <Route path="/preview/:id" element={<ProtectedRoute><PreviewInvoice /></ProtectedRoute>} />
            <Route path="/laporan" element={<ProtectedRoute><Laporan /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
