import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clinics from "./pages/Clinics";
import ClinicDetail from "./pages/ClinicDetail";
import SocialMedia from "./pages/SocialMedia";
import WebsiteDepartment from "./pages/WebsiteDepartment";
import SeoDepartment from "./pages/SeoDepartment";
import GoogleAdsDepartment from "./pages/GoogleAdsDepartment";
import AdminReview from "./pages/AdminReview";
import Employees from "./pages/Employees";
import ClientsPage from "./pages/Clients";
import Settings from "./pages/Settings";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DataDeletion from "./pages/DataDeletion";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/data-deletion" element={<DataDeletion />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/social" element={<ProtectedRoute><SocialMedia /></ProtectedRoute>} />
          <Route path="/website" element={<ProtectedRoute><WebsiteDepartment /></ProtectedRoute>} />
          <Route path="/seo" element={<ProtectedRoute><SeoDepartment /></ProtectedRoute>} />
          <Route path="/google-ads" element={<ProtectedRoute><GoogleAdsDepartment /></ProtectedRoute>} />
          <Route path="/clinics" element={<ProtectedRoute allowedRoles={["admin", "concierge"]}><Clinics /></ProtectedRoute>} />
          <Route path="/clinics/:id" element={<ProtectedRoute><ClinicDetail /></ProtectedRoute>} />
          {/* Redirects from old routes to Social Media tabs */}
          <Route path="/content" element={<Navigate to="/social?tab=calendar" replace />} />
          <Route path="/content-requests" element={<Navigate to="/social?tab=requests" replace />} />
          <Route path="/ai-content" element={<Navigate to="/social?tab=requests" replace />} />
          <Route path="/intake-forms" element={<Navigate to="/social?tab=intake" replace />} />
          <Route path="/analytics" element={<Navigate to="/social?tab=analytics" replace />} />
          <Route path="/employees" element={<ProtectedRoute allowedRoles={["admin"]}><Employees /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute allowedRoles={["admin"]}><ClientsPage /></ProtectedRoute>} />
          <Route path="/review" element={<ProtectedRoute allowedRoles={["admin"]}><AdminReview /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
