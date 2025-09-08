import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "@/components/layout/Header";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Bands from "./pages/Bands";
import Events from "./pages/Events";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Financeiro from "./pages/Financeiro";
import { AuthProvider } from "@/contexts/AuthProvider";
import { TenantProvider } from "@/contexts/TenantProvider";
import { ProtectedRoute } from "@/components/routing/ProtectedRoute";
import { TestHooks } from "@/components/TestHooks";
import { SkipLinks } from "@/components/accessibility/SkipLinks";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ErrorBoundary level="critical">
        <AuthProvider>
          <TenantProvider>
            <BrowserRouter>
            <SkipLinks />
            <Header />
            <main id="main-content" role="main">
              <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <Events />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bands"
              element={
                <ProtectedRoute>
                  <Bands />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financeiro"
              element={
                <ProtectedRoute>
                  <Financeiro />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test-hooks"
              element={
                <ProtectedRoute>
                  <TestHooks />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            </BrowserRouter>
          </TenantProvider>
        </AuthProvider>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
