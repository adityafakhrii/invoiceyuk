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
import SidebarLayout from "./components/SidebarLayout";
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
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
