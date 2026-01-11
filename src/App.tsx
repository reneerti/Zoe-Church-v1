import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
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
import Chat from "./pages/Chat";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminImport from "./pages/AdminImport";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/biblia" element={<Biblia />} />
            <Route path="/biblia/:livro" element={<LivroCapitulos />} />
            <Route path="/biblia/:livro/:capitulo" element={<LeituraCapitulo />} />
            <Route path="/harpa" element={<Harpa />} />
            <Route path="/harpa/:numero" element={<HinoDetalhes />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/devocional" element={<Devocional />} />
            <Route path="/ofertas" element={<Ofertas />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/lideranca" element={<Lideranca />} />
            <Route path="/novos-convertidos" element={<NovosConvertidos />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/admin/import" element={<AdminImport />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
