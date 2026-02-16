import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clinics from "./pages/Clinics";
import ContentCalendar from "./pages/ContentCalendar";
import AIContent from "./pages/AIContent";
import Analytics from "./pages/Analytics";
import IntakeForms from "./pages/IntakeForms";
import Employees from "./pages/Employees";
import AdminReview from "./pages/AdminReview";
import Settings from "./pages/Settings";
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
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/clinics" element={<ProtectedRoute allowedRoles={["admin"]}><Clinics /></ProtectedRoute>} />
          <Route path="/content" element={<ProtectedRoute allowedRoles={["admin", "concierge"]}><ContentCalendar /></ProtectedRoute>} />
          <Route path="/ai-content" element={<ProtectedRoute allowedRoles={["admin", "concierge"]}><AIContent /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/intake-forms" element={<ProtectedRoute><IntakeForms /></ProtectedRoute>} />
          <Route path="/employees" element={<ProtectedRoute allowedRoles={["admin"]}><Employees /></ProtectedRoute>} />
          <Route path="/review" element={<ProtectedRoute allowedRoles={["admin"]}><AdminReview /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
