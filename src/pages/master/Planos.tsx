import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBibleBooks } from '@/hooks/useBibleData';
import { sendPushToUnidade } from '@/hooks/useSendPushToUsers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, BookOpen, Calendar, Users, Trash2, Eye, Send, Pencil, Copy, QrCode, Share2, Link } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Plano {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  duracao_dias: number;
  data_inicio: string;
  status: string;
  total_inscritos: number;
  codigo_convite: string;
  permite_inscricao_publica: boolean;
  created_at: string;
}

interface Template {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  duracao_dias: number;
}

export default function MasterPlanos() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { user, unidadeId } = useAuth();
  const { data: livros } = useBibleBooks();
  
  const [loading, setLoading] = useState(true);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showCriarDialog, setShowCriarDialog] = useState(false);
  const [showCompartilharDialog, setShowCompartilharDialog] = useState(false);
  const [showEditarDialog, setShowEditarDialog] = useState(false);
  const [planoSelecionado, setPlanoSelecionado] = useState<Plano | null>(null);
  const [criando, setCriando] = useState(false);
  
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    tipo: 'personalizado',
    template: '',
    dataInicio: new Date().toISOString().split('T')[0],
    livrosSelecionados: [] as string[],
    capitulosPorDia: 3,
    incluiSabado: true,
    incluiDomingo: true,
    permiteInscricaoPublica: false,
  });

  const [editForm, setEditForm] = useState({
    titulo: '',
    descricao: '',
    permiteInscricaoPublica: false,
  });
  
  useEffect(() => {
    if (unidadeId) {
      fetchData();
    }
  }, [unidadeId]);
  
  const fetchData = async () => {
    setLoading(true);
    
    try {
      const { data: planosData, error: planosError } = await supabase
        .from('planos_leitura')
        .select('*')
        .eq('unidade_id', unidadeId)
        .order('created_at', { ascending: false });
      
      if (planosError) throw planosError;
      setPlanos(planosData || []);
      
      const { data: templatesData, error: templatesError } = await supabase
        .from('planos_templates')
        .select('*')
        .eq('is_active', true);
      
      if (templatesError) throw templatesError;
      setTemplates(templatesData || []);
      
    } catch (error) {
      console.error('Erro ao carregar:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };
  
  const criarPlano = async () => {
    if (!form.titulo.trim()) {
      toast.error('Digite um título para o plano');
      return;
    }
    
    setCriando(true);
    
    try {
      const { data: plano, error: planoError } = await supabase
        .from('planos_leitura')
        .insert({
          unidade_id: unidadeId,
          titulo: form.titulo,
          descricao: form.descricao,
          tipo: form.tipo,
          data_inicio: form.dataInicio,
          leituras_por_dia: form.capitulosPorDia,
          inclui_sabado: form.incluiSabado,
          inclui_domingo: form.incluiDomingo,
          permite_inscricao_publica: form.permiteInscricaoPublica,
          status: 'rascunho',
          duracao_dias: 0,
          criado_por: user?.id,
        })
        .select()
        .single();
      
      if (planoError) throw planoError;
      
      let itensGerados = 0;
      
      if (form.template === 'biblia_1_ano') {
        const { data, error } = await supabase.rpc('gerar_plano_biblia_1_ano', {
          p_plano_id: plano.id,
          p_data_inicio: form.dataInicio,
        });
        if (error) throw error;
        itensGerados = data;
        
      } else if (form.livrosSelecionados.length > 0) {
        const { data, error } = await supabase.rpc('gerar_plano_livros', {
          p_plano_id: plano.id,
          p_livros_abreviacoes: form.livrosSelecionados,
          p_data_inicio: form.dataInicio,
          p_capitulos_por_dia: form.capitulosPorDia,
        });
        if (error) throw error;
        itensGerados = data;
      }
      
      toast.success(`Plano criado com ${itensGerados} leituras!`);
      setShowCriarDialog(false);
      resetForm();
      fetchData();
      
    } catch (error) {
      console.error('Erro ao criar plano:', error);
      toast.error('Erro ao criar plano');
    } finally {
      setCriando(false);
    }
  };

  const resetForm = () => {
    setForm({
      titulo: '',
      descricao: '',
      tipo: 'personalizado',
      template: '',
      dataInicio: new Date().toISOString().split('T')[0],
      livrosSelecionados: [],
      capitulosPorDia: 3,
      incluiSabado: true,
      incluiDomingo: true,
      permiteInscricaoPublica: false,
    });
  };
  
  const publicarPlano = async (planoId: string) => {
    try {
      // Buscar dados do plano
      const plano = planos.find(p => p.id === planoId);
      
      const { error } = await supabase
        .from('planos_leitura')
        .update({ 
          status: 'publicado',
          publicado_em: new Date().toISOString(),
        })
        .eq('id', planoId);
      
      if (error) throw error;
      
      // Enviar push notification para todos os membros
      if (unidadeId && plano) {
        const pushResult = await sendPushToUnidade(
          unidadeId,
          '📖 Novo Plano de Leitura!',
          `${plano.titulo} está disponível. Inscreva-se agora!`,
          {
            type: 'plano',
            planoId: planoId,
            url: `/planos/entrar/${plano.codigo_convite}`,
          }
        );

        if (pushResult.sent > 0) {
          toast.success(`Plano publicado! ${pushResult.sent} push notifications enviados.`);
        } else {
          toast.success('Plano publicado e disponível para inscrições!');
        }
      } else {
        toast.success('Plano publicado e disponível para inscrições!');
      }
      
      fetchData();
      
    } catch (error) {
      console.error('Erro ao publicar:', error);
      toast.error('Erro ao publicar plano');
    }
  };

  const despublicarPlano = async (planoId: string) => {
    try {
      const { error } = await supabase
        .from('planos_leitura')
        .update({ status: 'rascunho' })
        .eq('id', planoId);
      
      if (error) throw error;
      
      toast.success('Plano movido para rascunho');
      fetchData();
      
    } catch (error) {
      console.error('Erro ao despublicar:', error);
      toast.error('Erro ao despublicar plano');
    }
  };

  const abrirEditar = (plano: Plano) => {
    setPlanoSelecionado(plano);
    setEditForm({
      titulo: plano.titulo,
      descricao: plano.descricao || '',
      permiteInscricaoPublica: plano.permite_inscricao_publica,
    });
    setShowEditarDialog(true);
  };

  const salvarEdicao = async () => {
    if (!planoSelecionado) return;
    
    try {
      const { error } = await supabase
        .from('planos_leitura')
        .update({
          titulo: editForm.titulo,
          descricao: editForm.descricao,
          permite_inscricao_publica: editForm.permiteInscricaoPublica,
        })
        .eq('id', planoSelecionado.id);
      
      if (error) throw error;
      
      toast.success('Plano atualizado!');
      setShowEditarDialog(false);
      fetchData();
      
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast.error('Erro ao atualizar plano');
    }
  };

  const abrirCompartilhar = (plano: Plano) => {
    setPlanoSelecionado(plano);
    setShowCompartilharDialog(true);
  };
  
  const excluirPlano = async (planoId: string) => {
    try {
      // Primeiro excluir os itens
      await supabase.from('planos_leitura_itens').delete().eq('plano_id', planoId);
      
      const { error } = await supabase
        .from('planos_leitura')
        .delete()
        .eq('id', planoId);
      
      if (error) throw error;
      
      toast.success('Plano excluído');
      fetchData();
      
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir plano');
    }
  };
  
  const toggleLivro = (abbrev: string) => {
    setForm(f => ({
      ...f,
      livrosSelecionados: f.livrosSelecionados.includes(abbrev)
        ? f.livrosSelecionados.filter(l => l !== abbrev)
        : [...f.livrosSelecionados, abbrev],
    }));
  };
  
  const selecionarTemplate = (templateId: string) => {
    if (templateId === 'biblia_1_ano') {
      setForm(f => ({
        ...f,
        template: 'biblia_1_ano',
        titulo: 'Bíblia em 1 Ano - ' + new Date().getFullYear(),
        descricao: 'Leia toda a Bíblia em 365 dias com leituras diárias organizadas.',
        tipo: 'anual',
      }));
    } else {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setForm(f => ({
          ...f,
          template: templateId,
          titulo: template.titulo,
          descricao: template.descricao,
          tipo: template.tipo,
        }));
      }
    }
  };

  const copiarLink = (codigo: string) => {
    const link = `${window.location.origin}/planos/entrar/${codigo}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  const copiarCodigo = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    toast.success('Código copiado!');
  };

  const getQrCodeUrl = (codigo: string) => {
    const link = `${window.location.origin}/planos/entrar/${codigo}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
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
              <h1 className="text-xl font-bold">Planos de Leitura</h1>
              <p className="text-sm text-muted-foreground">Crie e gerencie planos para sua comunidade</p>
            </div>
          </div>
          
          <Button onClick={() => setShowCriarDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
          </Button>
        </div>
      </header>
      
      <div className="p-4 space-y-4">
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
        ) : planos.length > 0 ? (
          planos.map(plano => (
            <Card key={plano.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{plano.titulo}</h3>
                    <Badge variant={plano.status === 'publicado' ? 'default' : 'secondary'}>
                      {plano.status === 'publicado' ? 'Publicado' : 'Rascunho'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {plano.duracao_dias} dias • Criado em {format(new Date(plano.created_at), "d 'de' MMM", { locale: ptBR })}
                  </p>
                </div>
                
                {plano.codigo_convite && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Código</p>
                    <code className="text-sm font-mono font-bold text-primary">{plano.codigo_convite}</code>
                  </div>
                )}
              </div>
              
              {plano.descricao && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{plano.descricao}</p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {plano.total_inscritos} inscritos
                </span>
                {plano.permite_inscricao_publica && (
                  <Badge variant="outline" className="text-xs">Público</Badge>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {plano.status === 'rascunho' ? (
                  <Button size="sm" onClick={() => publicarPlano(plano.id)}>
                    <Send className="h-4 w-4 mr-1" />
                    Publicar
                  </Button>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={() => abrirCompartilhar(plano)}>
                      <Share2 className="h-4 w-4 mr-1" />
                      Compartilhar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => despublicarPlano(plano.id)}>
                      Despublicar
                    </Button>
                  </>
                )}
                
                <Button size="sm" variant="outline" onClick={() => abrirEditar(plano)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir plano?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Todas as inscrições e progressos serão perdidos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => excluirPlano(plano.id)} className="bg-destructive text-destructive-foreground">
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
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <h3 className="font-medium text-muted-foreground">Nenhum plano criado</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Crie um plano de leitura para sua comunidade
            </p>
            <Button onClick={() => setShowCriarDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Plano
            </Button>
          </div>
        )}
      </div>
      
      {/* Dialog para criar plano */}
      <Dialog open={showCriarDialog} onOpenChange={setShowCriarDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Plano de Leitura</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Modelo (opcional)</Label>
              <Select value={form.template} onValueChange={selecionarTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um modelo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                  <SelectItem value="biblia_1_ano">📖 Bíblia em 1 Ano</SelectItem>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.titulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Título do Plano</Label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))}
                placeholder="Ex: Bíblia em 1 Ano - 2026"
              />
            </div>
            
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={form.descricao}
                onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Descreva o plano para os membros..."
                rows={2}
              />
            </div>
            
            <div>
              <Label>Data de Início</Label>
              <Input
                type="date"
                value={form.dataInicio}
                onChange={(e) => setForm(f => ({ ...f, dataInicio: e.target.value }))}
              />
            </div>
            
            {form.template !== 'biblia_1_ano' && (
              <>
                <div>
                  <Label>Capítulos por Dia</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={form.capitulosPorDia}
                    onChange={(e) => setForm(f => ({ ...f, capitulosPorDia: parseInt(e.target.value) || 3 }))}
                  />
                </div>
                
                <div>
                  <Label className="mb-2 block">Selecione os Livros</Label>
                  <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto p-2 border rounded-lg">
                    {livros?.map(livro => (
                      <Button
                        key={livro.id}
                        size="sm"
                        variant={form.livrosSelecionados.includes(livro.abbreviation) ? 'default' : 'outline'}
                        className="text-xs p-1 h-auto"
                        onClick={() => toggleLivro(livro.abbreviation)}
                      >
                        {livro.abbreviation}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {form.livrosSelecionados.length} livro(s) selecionado(s)
                  </p>
                </div>
              </>
            )}
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.incluiSabado}
                  onCheckedChange={(v) => setForm(f => ({ ...f, incluiSabado: v }))}
                />
                <Label>Sábado</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.incluiDomingo}
                  onCheckedChange={(v) => setForm(f => ({ ...f, incluiDomingo: v }))}
                />
                <Label>Domingo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.permiteInscricaoPublica}
                  onCheckedChange={(v) => setForm(f => ({ ...f, permiteInscricaoPublica: v }))}
                />
                <Label>Público</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCriarDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={criarPlano} disabled={criando}>
              {criando ? 'Criando...' : 'Criar Plano'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar */}
      <Dialog open={showEditarDialog} onOpenChange={setShowEditarDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={editForm.titulo}
                onChange={(e) => setEditForm(f => ({ ...f, titulo: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={editForm.descricao}
                onChange={(e) => setEditForm(f => ({ ...f, descricao: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={editForm.permiteInscricaoPublica}
                onCheckedChange={(v) => setEditForm(f => ({ ...f, permiteInscricaoPublica: v }))}
              />
              <Label>Permitir inscrição pública (qualquer pessoa com o código)</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditarDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarEdicao}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para compartilhar */}
      <Dialog open={showCompartilharDialog} onOpenChange={setShowCompartilharDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Compartilhar Plano</DialogTitle>
          </DialogHeader>
          
          {planoSelecionado && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="font-semibold mb-2">{planoSelecionado.titulo}</h3>
                <p className="text-sm text-muted-foreground">{planoSelecionado.descricao}</p>
              </div>

              {/* Código */}
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Código de acesso</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-2xl font-mono font-bold text-primary tracking-widest">
                    {planoSelecionado.codigo_convite}
                  </code>
                  <Button size="icon" variant="ghost" onClick={() => copiarCodigo(planoSelecionado.codigo_convite)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <img 
                  src={getQrCodeUrl(planoSelecionado.codigo_convite)} 
                  alt="QR Code" 
                  className="w-48 h-48 rounded-lg"
                />
              </div>

              {/* Link */}
              <div>
                <Label className="mb-2 block">Link de convite</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${window.location.origin}/planos/entrar/${planoSelecionado.codigo_convite}`}
                    className="text-xs"
                  />
                  <Button size="icon" variant="outline" onClick={() => copiarLink(planoSelecionado.codigo_convite)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Compartilhe o código ou QR Code com os membros para que eles possam participar do plano de leitura.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}