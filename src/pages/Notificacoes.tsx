import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Bell, BellOff, Check, CheckCheck, 
  ChevronRight, Settings, Trash2, Volume2, VolumeX 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { BottomNav } from '@/components/layout/BottomNav';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Notificacao {
  id: string;
  notificacao_id: string;
  recebida_em: string;
  lida_em: string | null;
  clicada_em: string | null;
  notificacao: {
    id: string;
    titulo: string;
    mensagem: string;
    tipo: string;
    icone: string;
    link_acao: string | null;
    criado_por: string | null;
    created_at: string;
  };
}

interface NotificacaoConfigs {
  todas_ativadas: boolean;
  som_ativado: boolean;
  planos_leitura: boolean;
  devocionais: boolean;
  rede_social: boolean;
  avisos_gerais: boolean;
}

export default function Notificacoes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [configs, setConfigs] = useState<NotificacaoConfigs>({
    todas_ativadas: true,
    som_ativado: true,
    planos_leitura: true,
    devocionais: true,
    rede_social: true,
    avisos_gerais: true,
  });
  
  useEffect(() => {
    if (user) {
      fetchNotificacoes();
      loadConfigs();
    }
  }, [user]);
  
  const fetchNotificacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('notificacoes_usuarios')
        .select(`
          *,
          notificacao:notificacoes(*)
        `)
        .eq('user_id', user?.id)
        .order('recebida_em', { ascending: false });
      
      if (error) throw error;
      setNotificacoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadConfigs = () => {
    const saved = localStorage.getItem('notification_configs');
    if (saved) {
      setConfigs(JSON.parse(saved));
    }
  };
  
  const saveConfigs = (newConfigs: NotificacaoConfigs) => {
    setConfigs(newConfigs);
    localStorage.setItem('notification_configs', JSON.stringify(newConfigs));
    toast.success('Configurações salvas');
  };
  
  const marcarComoLida = async (notificacao: Notificacao) => {
    if (notificacao.lida_em) return;
    
    try {
      await supabase
        .from('notificacoes_usuarios')
        .update({ lida_em: new Date().toISOString() })
        .eq('id', notificacao.id);
      
      setNotificacoes(prev => 
        prev.map(n => n.id === notificacao.id 
          ? { ...n, lida_em: new Date().toISOString() } 
          : n
        )
      );
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };
  
  const marcarTodasComoLidas = async () => {
    try {
      const naoLidas = notificacoes.filter(n => !n.lida_em);
      
      for (const notif of naoLidas) {
        await supabase
          .from('notificacoes_usuarios')
          .update({ lida_em: new Date().toISOString() })
          .eq('id', notif.id);
      }
      
      setNotificacoes(prev => 
        prev.map(n => ({ ...n, lida_em: n.lida_em || new Date().toISOString() }))
      );
      
      toast.success('Todas as notificações foram marcadas como lidas');
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast.error('Erro ao marcar notificações');
    }
  };
  
  const handleClick = async (notificacao: Notificacao) => {
    await marcarComoLida(notificacao);
    
    // Registrar clique
    await supabase
      .from('notificacoes_usuarios')
      .update({ clicada_em: new Date().toISOString() })
      .eq('id', notificacao.id);
    
    // Navegar se houver link
    if (notificacao.notificacao.link_acao) {
      navigate(notificacao.notificacao.link_acao);
    }
  };
  
  const getIconeNotificacao = (tipo: string | null) => {
    switch (tipo) {
      case 'plano_leitura':
        return '📖';
      case 'devocional':
        return '🙏';
      case 'rede_social':
        return '❤️';
      case 'aviso':
        return '📢';
      case 'alerta':
        return '⚠️';
      default:
        return '🔔';
    }
  };
  
  const formatarData = (data: string) => {
    const date = parseISO(data);
    
    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    }
    
    if (isYesterday(date)) {
      return `Ontem às ${format(date, 'HH:mm')}`;
    }
    
    return format(date, "d 'de' MMM 'às' HH:mm", { locale: ptBR });
  };
  
  const naoLidas = notificacoes.filter(n => !n.lida_em).length;
  
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </h1>
              {naoLidas > 0 && (
                <p className="text-sm text-muted-foreground">
                  {naoLidas} não {naoLidas === 1 ? 'lida' : 'lidas'}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {naoLidas > 0 && (
              <Button variant="ghost" size="sm" onClick={marcarTodasComoLidas}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Marcar todas
              </Button>
            )}
            
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configurações de Notificações</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {/* Master Switch */}
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      {configs.todas_ativadas ? (
                        <Bell className="h-5 w-5 text-primary" />
                      ) : (
                        <BellOff className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">Todas as notificações</p>
                        <p className="text-xs text-muted-foreground">
                          Ativar/desativar todas as notificações
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={configs.todas_ativadas}
                      onCheckedChange={(checked) => 
                        saveConfigs({ ...configs, todas_ativadas: checked })
                      }
                    />
                  </div>
                  
                  <Separator />
                  
                  {/* Som */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      {configs.som_ativado ? (
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <VolumeX className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span>Sons de notificação</span>
                    </div>
                    <Switch
                      checked={configs.som_ativado}
                      disabled={!configs.todas_ativadas}
                      onCheckedChange={(checked) => 
                        saveConfigs({ ...configs, som_ativado: checked })
                      }
                    />
                  </div>
                  
                  <Separator />
                  
                  <p className="text-sm font-medium text-muted-foreground">
                    Tipos de notificação
                  </p>
                  
                  {/* Planos de Leitura */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📖</span>
                      <span>Planos de Leitura</span>
                    </div>
                    <Switch
                      checked={configs.planos_leitura}
                      disabled={!configs.todas_ativadas}
                      onCheckedChange={(checked) => 
                        saveConfigs({ ...configs, planos_leitura: checked })
                      }
                    />
                  </div>
                  
                  {/* Devocionais */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🙏</span>
                      <span>Devocionais</span>
                    </div>
                    <Switch
                      checked={configs.devocionais}
                      disabled={!configs.todas_ativadas}
                      onCheckedChange={(checked) => 
                        saveConfigs({ ...configs, devocionais: checked })
                      }
                    />
                  </div>
                  
                  {/* Rede Social */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">❤️</span>
                      <span>Curtidas e comentários</span>
                    </div>
                    <Switch
                      checked={configs.rede_social}
                      disabled={!configs.todas_ativadas}
                      onCheckedChange={(checked) => 
                        saveConfigs({ ...configs, rede_social: checked })
                      }
                    />
                  </div>
                  
                  {/* Avisos Gerais */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📢</span>
                      <span>Avisos da igreja</span>
                    </div>
                    <Switch
                      checked={configs.avisos_gerais}
                      disabled={!configs.todas_ativadas}
                      onCheckedChange={(checked) => 
                        saveConfigs({ ...configs, avisos_gerais: checked })
                      }
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>
      
      <div className="p-4 space-y-2">
        {loading ? (
          <>
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="p-4">
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              </Card>
            ))}
          </>
        ) : notificacoes.length > 0 ? (
          notificacoes.map(notif => (
            <Card
              key={notif.id}
              className={cn(
                "p-4 cursor-pointer transition-colors",
                !notif.lida_em && "bg-primary/5 border-primary/20",
                notif.lida_em && "opacity-80"
              )}
              onClick={() => handleClick(notif)}
            >
              <div className="flex gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-xl",
                  !notif.lida_em ? "bg-primary/10" : "bg-muted"
                )}>
                  {getIconeNotificacao(notif.notificacao?.tipo)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={cn(
                      "font-medium truncate",
                      !notif.lida_em && "font-semibold"
                    )}>
                      {notif.notificacao?.titulo || 'Notificação'}
                    </h3>
                    {!notif.lida_em && (
                      <Badge variant="default" className="shrink-0 h-2 w-2 p-0 rounded-full" />
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                    {notif.notificacao?.mensagem}
                  </p>
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatarData(notif.recebida_em)}
                  </p>
                </div>
                
                {notif.notificacao?.link_acao && (
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 self-center" />
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg mb-1">Nenhuma notificação</h3>
            <p className="text-sm text-muted-foreground">
              Você receberá avisos e atualizações aqui
            </p>
          </div>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}
