import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Biblia from "./pages/Biblia";
import LivroCapitulos from "./pages/LivroCapitulos";
import LeituraCapitulo from "./pages/LeituraCapitulo";
import Harpa from "./pages/Harpa";
import HinoDetalhes from "./pages/HinoDetalhes";
import Agenda from "./pages/Agenda";
import Devocional from "./pages/Devocional";
import Ofertas from "./pages/Ofertas";
import Videos from "./pages/Videos";
import Lideranca from "./pages/Lideranca";
import NovosConvertidos from "./pages/NovosConvertidos";
import Perfil from "./pages/Perfil";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import AdminImport from "./pages/AdminImport";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminConvites from "./pages/admin/Convites";
import AdminAuditLog from "./pages/admin/AuditLog";
import AceitarConvite from "./pages/AceitarConvite";
import MasterDashboard from "./pages/master/Dashboard";
import TermosAceite from "./pages/TermosAceite";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/biblia" element={<Biblia />} />
            <Route path="/biblia/:bookId" element={<LivroCapitulos />} />
            <Route path="/biblia/:bookId/:chapter" element={<LeituraCapitulo />} />
            <Route path="/harpa" element={<Harpa />} />
            <Route path="/harpa/:hinoId" element={<HinoDetalhes />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/devocional" element={<Devocional />} />
            <Route path="/ofertas" element={<Ofertas />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/lideranca" element={<Lideranca />} />
            <Route path="/novos-convertidos" element={<NovosConvertidos />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/termos" element={<TermosAceite />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/import" element={<AdminImport />} />
            <Route path="/admin/unidade/:unidadeId/convites" element={<AdminConvites />} />
            <Route path="/admin/audit" element={<AdminAuditLog />} />
            
            {/* Master Routes */}
            <Route path="/:slug/painel" element={<MasterDashboard />} />
            
            {/* Convite */}
            <Route path="/convite/:codigo" element={<AceitarConvite />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
