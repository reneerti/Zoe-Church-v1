import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sendPushToUsers } from '@/hooks/useSendPushToUsers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Plus, Bell, Send, Trash2, Pencil, Users, Eye, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  status: string;
  destinatarios_tipo: string;
  total_enviados: number;
  total_lidos: number;
  programada_para: string | null;
  enviada_em: string | null;
  created_at: string;
}

export default function MasterNotificacoes() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { user, unidadeId } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editando, setEditando] = useState<Notificacao | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [totalMembros, setTotalMembros] = useState(0);
  
  const [form, setForm] = useState({
    titulo: '',
    mensagem: '',
    tipo: 'geral',
    destinatarios_tipo: 'todos',
    programada_para: '',
  });

  useEffect(() => {
    if (unidadeId) {
      fetchData();
    }
  }, [unidadeId]);

  const fetchData = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('unidade_id', unidadeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setNotificacoes(data || []);

      // Contar total de membros
      const { count } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('unidade_id', unidadeId)
        .eq('is_active', true);
      
      setTotalMembros(count || 0);
      
    } catch (error) {
      console.error('Erro ao carregar:', error);
      toast.error('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  const abrirDialog = (notificacao?: Notificacao) => {
    if (notificacao) {
      setEditando(notificacao);
      setForm({
        titulo: notificacao.titulo,
        mensagem: notificacao.mensagem,
        tipo: notificacao.tipo,
        destinatarios_tipo: notificacao.destinatarios_tipo,
        programada_para: notificacao.programada_para || '',
      });
    } else {
      setEditando(null);
      setForm({
        titulo: '',
        mensagem: '',
        tipo: 'geral',
        destinatarios_tipo: 'todos',
        programada_para: '',
      });
    }
    setShowDialog(true);
  };

  const salvar = async () => {
    if (!form.titulo.trim() || !form.mensagem.trim()) {
      toast.error('Preencha título e mensagem');
      return;
    }
    
    setSalvando(true);
    
    try {
      const dados = {
        unidade_id: unidadeId,
        titulo: form.titulo,
        mensagem: form.mensagem,
        tipo: form.tipo,
        destinatarios_tipo: form.destinatarios_tipo,
        programada_para: form.programada_para || null,
        criado_por: user?.id,
      };

      if (editando) {
        const { error } = await supabase
          .from('notificacoes')
          .update(dados)
          .eq('id', editando.id);
        
        if (error) throw error;
        toast.success('Notificação atualizada!');
      } else {
        const { error } = await supabase
          .from('notificacoes')
          .insert(dados);
        
        if (error) throw error;
        toast.success('Notificação criada!');
      }
      
      setShowDialog(false);
      fetchData();
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar notificação');
    } finally {
      setSalvando(false);
    }
  };

  const enviar = async (notificacao: Notificacao) => {
    try {
      // Buscar usuários da unidade
      const { data: usuarios, error: usuariosError } = await supabase
        .from('usuarios')
        .select('user_id')
        .eq('unidade_id', unidadeId)
        .eq('is_active', true)
        .not('user_id', 'is', null);
      
      if (usuariosError) throw usuariosError;

      const userIds = usuarios?.map(u => u.user_id).filter(Boolean) as string[];

      // Criar registros de notificação para cada usuário
      const registros = usuarios?.map(u => ({
        notificacao_id: notificacao.id,
        user_id: u.user_id,
      })) || [];

      if (registros.length > 0) {
        const { error: insertError } = await supabase
          .from('notificacoes_usuarios')
          .upsert(registros, { onConflict: 'notificacao_id,user_id' });
        
        if (insertError) throw insertError;
      }

      // Atualizar status da notificação
      const { error: updateError } = await supabase
        .from('notificacoes')
        .update({
          status: 'enviada',
          enviada_em: new Date().toISOString(),
          total_enviados: registros.length,
        })
        .eq('id', notificacao.id);
      
      if (updateError) throw updateError;

      // Enviar push notifications
      const pushResult = await sendPushToUsers({
        userIds,
        title: notificacao.titulo,
        body: notificacao.mensagem,
        data: {
          type: 'notification',
          notificationId: notificacao.id,
          url: '/notificacoes',
        },
      });

      const pushInfo = pushResult.sent > 0 
        ? ` (${pushResult.sent} push enviados)` 
        : '';

      toast.success(`Notificação enviada para ${registros.length} membros!${pushInfo}`);
      fetchData();
      
    } catch (error) {
      console.error('Erro ao enviar:', error);
      toast.error('Erro ao enviar notificação');
    }
  };

  const excluir = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notificacoes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Notificação excluída');
      fetchData();
      
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir notificação');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enviada':
        return <Badge className="bg-green-500">Enviada</Badge>;
      case 'agendada':
        return <Badge className="bg-blue-500">Agendada</Badge>;
      case 'cancelada':
        return <Badge variant="secondary">Cancelada</Badge>;
      default:
        return <Badge variant="outline">Rascunho</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    const cores: Record<string, string> = {
      geral: 'bg-gray-500',
      plano: 'bg-blue-500',
      evento: 'bg-purple-500',
      devocional: 'bg-pink-500',
    };
    return <Badge className={cores[tipo] || 'bg-gray-500'}>{tipo}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/${slug}/painel`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Notificações</h1>
              <p className="text-sm text-muted-foreground">Envie mensagens para sua comunidade</p>
            </div>
          </div>
          
          <Button onClick={() => abrirDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nova
          </Button>
        </div>
      </header>
      
      <div className="p-4 space-y-4">
        {/* Info card */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="font-semibold">{totalMembros} membros ativos</p>
              <p className="text-sm text-muted-foreground">Receberão suas notificações</p>
            </div>
          </div>
        </Card>

        {loading ? (
          <>
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-full mb-3" />
                <Skeleton className="h-8 w-32" />
              </Card>
            ))}
          </>
        ) : notificacoes.length > 0 ? (
          notificacoes.map(notif => (
            <Card key={notif.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{notif.titulo}</h3>
                    {getStatusBadge(notif.status)}
                    {getTipoBadge(notif.tipo)}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{notif.mensagem}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(notif.created_at), "d 'de' MMM", { locale: ptBR })}
                </span>
                {notif.status === 'enviada' && (
                  <>
                    <span className="flex items-center gap-1">
                      <Send className="h-3 w-3" />
                      {notif.total_enviados} enviados
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {notif.total_lidos} lidos
                    </span>
                  </>
                )}
                {notif.programada_para && notif.status !== 'enviada' && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Agendada: {format(new Date(notif.programada_para), "d/MM HH:mm")}
                  </span>
                )}
              </div>
              
              <div className="flex gap-2">
                {notif.status === 'rascunho' && (
                  <Button size="sm" onClick={() => enviar(notif)}>
                    <Send className="h-4 w-4 mr-1" />
                    Enviar Agora
                  </Button>
                )}
                {notif.status !== 'enviada' && (
                  <Button size="sm" variant="outline" onClick={() => abrirDialog(notif)}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir notificação?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => excluir(notif.id)}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <h3 className="font-medium text-muted-foreground">Nenhuma notificação</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Envie notificações para sua comunidade
            </p>
            <Button onClick={() => abrirDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Notificação
            </Button>
          </div>
        )}
      </div>
      
      {/* Dialog para criar/editar */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editando ? 'Editar Notificação' : 'Nova Notificação'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))}
                placeholder="Ex: Novo plano de leitura disponível!"
              />
            </div>
            
            <div>
              <Label>Mensagem</Label>
              <Textarea
                value={form.mensagem}
                onChange={(e) => setForm(f => ({ ...f, mensagem: e.target.value }))}
                placeholder="Escreva a mensagem para os membros..."
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm(f => ({ ...f, tipo: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Geral</SelectItem>
                    <SelectItem value="plano">Plano de Leitura</SelectItem>
                    <SelectItem value="evento">Evento</SelectItem>
                    <SelectItem value="devocional">Devocional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Destinatários</Label>
                <Select value={form.destinatarios_tipo} onValueChange={(v) => setForm(f => ({ ...f, destinatarios_tipo: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos ({totalMembros})</SelectItem>
                    <SelectItem value="ativos">Ativos (7 dias)</SelectItem>
                    <SelectItem value="inativos">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Agendar para (opcional)</Label>
              <Input
                type="datetime-local"
                value={form.programada_para}
                onChange={(e) => setForm(f => ({ ...f, programada_para: e.target.value }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}