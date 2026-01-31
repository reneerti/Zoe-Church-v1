import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NetworkProvider } from "@/contexts/NetworkContext";
import { TermosMiddleware } from "@/components/TermosMiddleware";
import { ProtectedRoute, MasterRoute } from "@/components/auth/ProtectedRoute";
import { NetworkStatus } from "@/components/NetworkStatus";
import { SyncIndicator } from "@/components/SyncIndicator";
import { queryClient } from "@/lib/queryClient";
import { SyncService } from "@/services/syncService";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Biblia from "./pages/Biblia";
import LivroCapitulos from "./pages/LivroCapitulos";
import LeituraCapitulo from "./pages/LeituraCapitulo";
import BuscaBiblia from "./pages/BuscaBiblia";
import Harpa from "./pages/Harpa";
import HinoDetalhes from "./pages/HinoDetalhes";
import HinoApresentacao from "./pages/HinoApresentacao";
import Agenda from "./pages/Agenda";
import Devocional from "./pages/Devocional";
import Ofertas from "./pages/Ofertas";
import Videos from "./pages/Videos";
import Lideranca from "./pages/Lideranca";
import NovosConvertidos from "./pages/NovosConvertidos";
import Perfil from "./pages/Perfil";
import Chat from "./pages/Chat";
import MasterDashboard from "./pages/master/Dashboard";
import MasterPlanos from "./pages/master/Planos";
import MasterNotificacoes from "./pages/master/Notificacoes";
import TermosAceite from "./pages/TermosAceite";
import MeusPlanos from "./pages/MeusPlanos";
import EntrarPlano from "./pages/EntrarPlano";
import Notificacoes from "./pages/Notificacoes";
import Instalar from "./pages/Instalar";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/Dashboard";

const SyncInitializer = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      SyncService.initialize(user.id);
      return () => {
        SyncService.cleanup();
      };
    }
  }, [user?.id]);

  return null;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <NetworkProvider>
              <SyncInitializer />
              <NetworkStatus />
              <SyncIndicator />
              <TermosMiddleware>
                <Routes>
                  <Route path="/termos-aceite" element={<TermosAceite />} />
                  <Route path="/instalar" element={<Instalar />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<Index />} />
                  <Route path="/biblia" element={<Biblia />} />
                  <Route path="/biblia/:livro" element={<LivroCapitulos />} />
                  <Route path="/biblia/:livro/:capitulo" element={<LeituraCapitulo />} />
                  <Route path="/biblia/busca" element={<BuscaBiblia />} />
                  <Route path="/harpa" element={<Harpa />} />
                  <Route path="/harpa/:numero" element={<HinoDetalhes />} />
                  <Route path="/harpa/:numero/apresentacao" element={<HinoApresentacao />} />
                  <Route path="/agenda" element={<Agenda />} />
                  <Route path="/devocional" element={<Devocional />} />
                  <Route path="/ofertas" element={<Ofertas />} />
                  <Route path="/videos" element={<Videos />} />
                  <Route path="/lideranca" element={<Lideranca />} />
                  <Route path="/convertidos" element={<NovosConvertidos />} />
                  <Route path="/perfil" element={<Perfil />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/meus-planos" element={<MeusPlanos />} />
                  <Route path="/plano/:id" element={<EntrarPlano />} />
                  <Route path="/notificacoes" element={<Notificacoes />} />
                  <Route path="/master/dashboard" element={<MasterDashboard />} />
                  <Route path="/master/planos" element={<MasterPlanos />} />
                  <Route path="/master/notificacoes" element={<MasterNotificacoes />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                </Routes>
              </TermosMiddleware>
            </NetworkProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
