import { Trophy, Flame, BookOpen, Heart, MessageSquare, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface ScoreCardProps {
  score: {
    score_total: number;
    nivel: number;
    nivel_nome: string;
    xp_atual: number;
    xp_proximo_nivel: number;
    streak_atual: number;
    streak_maximo: number;
    capitulos_lidos: number;
    versiculos_marcados: number;
    devocionais_lidos: number;
    devocionais_criados: number;
    badges: any[];
  } | null;
  compact?: boolean;
}

const NIVEIS = [
  { nivel: 1, nome: "Semente", xpMin: 0 },
  { nivel: 2, nome: "Broto", xpMin: 100 },
  { nivel: 3, nome: "Mudinha", xpMin: 300 },
  { nivel: 4, nome: "Árvore", xpMin: 600 },
  { nivel: 5, nome: "Frutífero", xpMin: 1000 },
  { nivel: 6, nome: "Discípulo", xpMin: 1500 },
  { nivel: 7, nome: "Missionário", xpMin: 2100 },
  { nivel: 8, nome: "Apóstolo", xpMin: 2800 },
  { nivel: 9, nome: "Profeta", xpMin: 3600 },
  { nivel: 10, nome: "Mestre", xpMin: 5000 },
];

export function ScoreCard({ score, compact = false }: ScoreCardProps) {
  if (!score) return null;

  const progressPercent = score.xp_proximo_nivel > 0 
    ? (score.xp_atual / score.xp_proximo_nivel) * 100 
    : 0;

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nível {score.nivel}</p>
                <p className="font-bold text-lg">{score.nivel_nome}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{score.score_total}</p>
              <p className="text-xs text-muted-foreground">pontos</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{score.xp_atual} XP</span>
              <span>{score.xp_proximo_nivel} XP</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
          {score.streak_atual > 0 && (
            <div className="flex items-center gap-1 mt-3 text-orange-500">
              <Flame className="h-4 w-4" />
              <span className="text-sm font-medium">{score.streak_atual} dias seguidos!</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Sua Jornada
          </span>
          <Badge variant="secondary" className="text-lg px-3">
            {score.score_total} pts
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nível e XP */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-muted-foreground">Nível {score.nivel}</p>
              <p className="font-bold text-xl">{score.nivel_nome}</p>
            </div>
            <Award className="h-10 w-10 text-primary" />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{score.xp_atual} XP</span>
            <span>Próximo nível: {score.xp_proximo_nivel} XP</span>
          </div>
          <Progress value={progressPercent} />
        </div>

        {/* Streak */}
        <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="font-medium">Sequência Atual</p>
              <p className="text-sm text-muted-foreground">
                Recorde: {score.streak_maximo} dias
              </p>
            </div>
          </div>
          <p className="text-2xl font-bold text-orange-500">{score.streak_atual}</p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted/50 rounded-xl text-center">
            <BookOpen className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-bold">{score.capitulos_lidos}</p>
            <p className="text-xs text-muted-foreground">Capítulos Lidos</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-xl text-center">
            <Heart className="h-5 w-5 mx-auto mb-1 text-red-500" />
            <p className="text-lg font-bold">{score.versiculos_marcados}</p>
            <p className="text-xs text-muted-foreground">Versículos Marcados</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-xl text-center">
            <MessageSquare className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-lg font-bold">{score.devocionais_lidos}</p>
            <p className="text-xs text-muted-foreground">Devocionais Lidos</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-xl text-center">
            <Award className="h-5 w-5 mx-auto mb-1 text-purple-500" />
            <p className="text-lg font-bold">{score.devocionais_criados}</p>
            <p className="text-xs text-muted-foreground">Devocionais Criados</p>
          </div>
        </div>

        {/* Badges */}
        {score.badges && score.badges.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Conquistas</p>
            <div className="flex flex-wrap gap-2">
              {score.badges.map((badge: any, index: number) => (
                <Badge key={index} variant="outline" className="gap-1">
                  {badge.emoji} {badge.nome}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
