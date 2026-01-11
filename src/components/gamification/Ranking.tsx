import { useState, useEffect } from "react";
import { Trophy, Medal, Crown, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface RankingUser {
  id: string;
  user_id: string;
  score_total: number;
  nivel: number;
  nivel_nome: string;
  streak_atual: number;
  usuario?: {
    nome: string | null;
    foto_url: string | null;
  };
}

export function Ranking() {
  const { profile } = useAuth();
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    if (profile?.unidadeId) {
      fetchRanking();
    }
  }, [profile?.unidadeId]);

  const fetchRanking = async () => {
    try {
      // Buscar top 20 do ranking
      const { data: scores, error } = await supabase
        .from("scores")
        .select("id, user_id, score_total, nivel, nivel_nome, streak_atual")
        .eq("unidade_id", profile?.unidadeId)
        .eq("visivel_ranking", true)
        .order("score_total", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Buscar dados dos usuários
      const userIds = scores?.map(s => s.user_id).filter(Boolean) || [];
      const { data: usuarios } = await supabase
        .from("usuarios")
        .select("user_id, nome, foto_url")
        .in("user_id", userIds);

      const usuariosMap = new Map(usuarios?.map(u => [u.user_id, u]) || []);

      const rankingComUsuarios = scores?.map(s => ({
        ...s,
        usuario: s.user_id ? usuariosMap.get(s.user_id) : undefined
      })) || [];

      setRanking(rankingComUsuarios);

      // Encontrar posição do usuário atual
      const currentUserRank = rankingComUsuarios.findIndex(
        r => r.user_id === profile?.id
      );
      if (currentUserRank >= 0) {
        setUserRank(currentUserRank + 1);
      }
    } catch (error) {
      console.error("Erro ao buscar ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center font-bold text-muted-foreground">{position}</span>;
    }
  };

  const getRankBgColor = (position: number) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/20 dark:to-yellow-950/10";
      case 2:
        return "bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800/20 dark:to-gray-900/10";
      case 3:
        return "bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/20 dark:to-amber-950/10";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Ranking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Ranking da Comunidade
          </span>
          {userRank && (
            <span className="text-sm font-normal text-muted-foreground">
              Sua posição: #{userRank}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {ranking.map((user, index) => {
              const position = index + 1;
              const isCurrentUser = user.user_id === profile?.id;

              return (
                <div
                  key={user.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    getRankBgColor(position)
                  } ${isCurrentUser ? "ring-2 ring-primary" : ""}`}
                >
                  <div className="w-8 flex justify-center">
                    {getRankIcon(position)}
                  </div>

                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.usuario?.foto_url || undefined} />
                    <AvatarFallback>
                      {user.usuario?.nome?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {user.usuario?.nome || "Anônimo"}
                      {isCurrentUser && " (você)"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Nível {user.nivel} - {user.nivel_nome}</span>
                      {user.streak_atual > 0 && (
                        <span className="flex items-center gap-1 text-orange-500">
                          <Flame className="h-3 w-3" />
                          {user.streak_atual}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-primary">{user.score_total}</p>
                    <p className="text-xs text-muted-foreground">pontos</p>
                  </div>
                </div>
              );
            })}

            {ranking.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum usuário no ranking ainda</p>
                <p className="text-sm">Seja o primeiro a conquistar pontos!</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
