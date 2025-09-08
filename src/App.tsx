import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "@/components/layout/Header";
import { createLazyPage } from "@/lib/lazy-loader";
import { AuthProvider } from "@/contexts/AuthProvider";
import { TenantProvider } from "@/contexts/TenantProvider";
import { ProtectedRoute } from "@/components/routing/ProtectedRoute";
import { SkipLinks } from "@/components/accessibility/SkipLinks";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";

// Lazy load das páginas principais
const Index = createLazyPage(() => import("./pages/Index"), "Página Inicial");
const Dashboard = createLazyPage(() => import("./pages/Dashboard"), "Dashboard");
const Bands = createLazyPage(() => import("./pages/Bands"), "Bandas");
const Events = createLazyPage(() => import("./pages/Events"), "Eventos");
const Financeiro = createLazyPage(() => import("./pages/Financeiro"), "Financeiro");
const Auth = createLazyPage(() => import("./pages/Auth"), "Autenticação");
const NotFound = createLazyPage(() => import("./pages/NotFound"), "Página Não Encontrada");
const TestHooks = createLazyPage(() => import("./components/TestHooks"), "Testes");

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
