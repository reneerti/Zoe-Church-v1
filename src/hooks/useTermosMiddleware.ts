import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Rotas que não precisam de verificação de termos
const ROTAS_PUBLICAS = [
  "/auth",
  "/termos",
  "/convite",
];

export function useTermosMiddleware() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [verificando, setVerificando] = useState(true);
  const [aceitouTermos, setAceitouTermos] = useState(false);

  useEffect(() => {
    const verificarTermos = async () => {
      // Não verificar se ainda está carregando auth
      if (authLoading) return;

      // Não verificar se não está logado
      if (!user) {
        setVerificando(false);
        return;
      }

      // Não verificar rotas públicas
      const isRotaPublica = ROTAS_PUBLICAS.some(rota => 
        location.pathname.startsWith(rota)
      );
      
      if (isRotaPublica) {
        setVerificando(false);
        return;
      }

      // Super users não precisam aceitar termos
      if (profile?.role === "super_user") {
        setAceitouTermos(true);
        setVerificando(false);
        return;
      }

      try {
        // Verificar se usuário aceitou os termos
        const { data: usuario } = await supabase
          .from("usuarios")
          .select("aceite_termos, aceite_privacidade")
          .eq("user_id", user.id)
          .single();

        if (usuario) {
          if (usuario.aceite_termos && usuario.aceite_privacidade) {
            setAceitouTermos(true);
          } else {
            // Redirecionar para aceitar termos
            navigate("/termos", { replace: true });
          }
        } else {
          // Verificar se é master
          const { data: master } = await supabase
            .from("masters")
            .select("id")
            .eq("user_id", user.id)
            .single();

          if (master) {
            // Masters não precisam aceitar termos separadamente
            setAceitouTermos(true);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar termos:", error);
      } finally {
        setVerificando(false);
      }
    };

    verificarTermos();
  }, [user, profile, authLoading, location.pathname, navigate]);

  return { verificando, aceitouTermos };
}
