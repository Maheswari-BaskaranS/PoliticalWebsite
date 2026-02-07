import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import Members from "./pages/admin/Members";
import Events from "./pages/admin/Events";
import Banners from "./pages/admin/Banners";
import Content from "./pages/admin/Content";
import States from "./pages/admin/States";
import Cities from "./pages/admin/Cities";
import Areas from "./pages/admin/Areas";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/members" element={<Members />} />
          <Route path="/admin/events" element={<Events />} />
          <Route path="/admin/banners" element={<Banners />} />
          <Route path="/admin/content" element={<Content />} />
          <Route path="/admin/states" element={<States />} />
          <Route path="/admin/cities" element={<Cities />} />
          <Route path="/admin/areas" element={<Areas />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
