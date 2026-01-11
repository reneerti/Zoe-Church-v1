import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TermosMiddleware } from "@/components/TermosMiddleware";
import { ProtectedRoute, SuperUserRoute, MasterRoute, AuthenticatedRoute } from "@/components/auth/ProtectedRoute";
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
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";
import AdminImport from "./pages/AdminImport";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminConvites from "./pages/admin/Convites";
import AdminAuditLog from "./pages/admin/AuditLog";
import AceitarConvite from "./pages/AceitarConvite";
import MasterDashboard from "./pages/master/Dashboard";
import MasterPlanos from "./pages/master/Planos";
import MasterNotificacoes from "./pages/master/Notificacoes";
import TermosAceite from "./pages/TermosAceite";
import MeusPlanos from "./pages/MeusPlanos";
import EntrarPlano from "./pages/EntrarPlano";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TermosMiddleware>
            <Routes>
              {/* Public Routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/termos" element={<TermosAceite />} />
              <Route path="/convite/:codigo" element={<AceitarConvite />} />
              
              {/* Authenticated Routes - Any logged user */}
              <Route path="/" element={<AuthenticatedRoute><Index /></AuthenticatedRoute>} />
              <Route path="/biblia" element={<AuthenticatedRoute><Biblia /></AuthenticatedRoute>} />
              <Route path="/biblia/busca" element={<AuthenticatedRoute><BuscaBiblia /></AuthenticatedRoute>} />
              <Route path="/biblia/:bookId" element={<AuthenticatedRoute><LivroCapitulos /></AuthenticatedRoute>} />
              <Route path="/biblia/:bookId/:chapter" element={<AuthenticatedRoute><LeituraCapitulo /></AuthenticatedRoute>} />
              <Route path="/harpa" element={<AuthenticatedRoute><Harpa /></AuthenticatedRoute>} />
              <Route path="/harpa/:numero" element={<AuthenticatedRoute><HinoDetalhes /></AuthenticatedRoute>} />
              <Route path="/harpa/:numero/apresentar" element={<AuthenticatedRoute><HinoApresentacao /></AuthenticatedRoute>} />
              <Route path="/agenda" element={<AuthenticatedRoute><Agenda /></AuthenticatedRoute>} />
              <Route path="/devocional" element={<AuthenticatedRoute><Devocional /></AuthenticatedRoute>} />
              <Route path="/ofertas" element={<AuthenticatedRoute><Ofertas /></AuthenticatedRoute>} />
              <Route path="/videos" element={<AuthenticatedRoute><Videos /></AuthenticatedRoute>} />
              <Route path="/lideranca" element={<AuthenticatedRoute><Lideranca /></AuthenticatedRoute>} />
              <Route path="/novos-convertidos" element={<AuthenticatedRoute><NovosConvertidos /></AuthenticatedRoute>} />
              <Route path="/perfil" element={<AuthenticatedRoute><Perfil /></AuthenticatedRoute>} />
              <Route path="/chat" element={<AuthenticatedRoute><Chat /></AuthenticatedRoute>} />
              <Route path="/planos" element={<AuthenticatedRoute><MeusPlanos /></AuthenticatedRoute>} />
              <Route path="/planos/entrar" element={<AuthenticatedRoute><EntrarPlano /></AuthenticatedRoute>} />
              <Route path="/planos/entrar/:codigo" element={<AuthenticatedRoute><EntrarPlano /></AuthenticatedRoute>} />
              
              {/* Super User Routes */}
              <Route path="/admin" element={<SuperUserRoute><AdminDashboard /></SuperUserRoute>} />
              <Route path="/admin/import" element={<SuperUserRoute><AdminImport /></SuperUserRoute>} />
              <Route path="/admin/unidade/:unidadeId/convites" element={<SuperUserRoute><AdminConvites /></SuperUserRoute>} />
              <Route path="/admin/audit" element={<SuperUserRoute><AdminAuditLog /></SuperUserRoute>} />
              
              {/* Master Routes */}
              <Route path="/:slug/painel" element={<MasterRoute><MasterDashboard /></MasterRoute>} />
              <Route path="/:slug/painel/planos" element={<MasterRoute><MasterPlanos /></MasterRoute>} />
              <Route path="/:slug/painel/notificacoes" element={<MasterRoute><MasterNotificacoes /></MasterRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TermosMiddleware>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
