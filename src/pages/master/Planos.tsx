import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBibleBooks } from '@/hooks/useBibleData';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, BookOpen, Calendar, Users, Trash2, Eye, Send, Pencil } from 'lucide-react';
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
  });
  
  useEffect(() => {
    if (unidadeId) {
      fetchData();
    }
  }, [unidadeId]);
  
  const fetchData = async () => {
    setLoading(true);
    
    try {
      // Buscar planos existentes
      const { data: planosData, error: planosError } = await supabase
        .from('planos_leitura')
        .select('*')
        .eq('unidade_id', unidadeId)
        .order('created_at', { ascending: false });
      
      if (planosError) throw planosError;
      setPlanos(planosData || []);
      
      // Buscar templates
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
      // 1. Criar o plano
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
          status: 'rascunho',
          duracao_dias: 0,
          criado_por: user?.id,
        })
        .select()
        .single();
      
      if (planoError) throw planoError;
      
      // 2. Gerar itens baseado no template
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
      });
      fetchData();
      
    } catch (error) {
      console.error('Erro ao criar plano:', error);
      toast.error('Erro ao criar plano');
    } finally {
      setCriando(false);
    }
  };
  
  const publicarPlano = async (planoId: string) => {
    try {
      const { error } = await supabase
        .from('planos_leitura')
        .update({ 
          status: 'publicado',
          publicado_em: new Date().toISOString(),
        })
        .eq('id', planoId);
      
      if (error) throw error;
      
      toast.success('Plano publicado!');
      fetchData();
      
    } catch (error) {
      console.error('Erro ao publicar:', error);
      toast.error('Erro ao publicar plano');
    }
  };
  
  const excluirPlano = async (planoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return;
    
    try {
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
              <p className="text-sm text-muted-foreground">Gerencie planos para sua comunidade</p>
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
                <div>
                  <h3 className="font-semibold">{plano.titulo}</h3>
                  <p className="text-sm text-muted-foreground">
                    {plano.duracao_dias} dias • Criado em {format(new Date(plano.created_at), "d 'de' MMM", { locale: ptBR })}
                  </p>
                </div>
                <Badge variant={plano.status === 'publicado' ? 'default' : 'secondary'}>
                  {plano.status === 'publicado' ? 'Publicado' : 'Rascunho'}
                </Badge>
              </div>
              
              {plano.descricao && (
                <p className="text-sm text-muted-foreground mb-3">{plano.descricao}</p>
              )}
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Users className="h-4 w-4" />
                <span>{plano.total_inscritos} inscritos</span>
              </div>
              
              <div className="flex gap-2">
                {plano.status === 'rascunho' && (
                  <Button size="sm" onClick={() => publicarPlano(plano.id)}>
                    <Send className="h-4 w-4 mr-1" />
                    Publicar
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-destructive"
                  onClick={() => excluirPlano(plano.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
            {/* Templates */}
            <div>
              <Label>Modelo (opcional)</Label>
              <Select value={form.template} onValueChange={selecionarTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um modelo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                  <SelectItem value="biblia_1_ano">Bíblia em 1 Ano</SelectItem>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.titulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Título */}
            <div>
              <Label>Título do Plano</Label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))}
                placeholder="Ex: Bíblia em 1 Ano - 2026"
              />
            </div>
            
            {/* Descrição */}
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={form.descricao}
                onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Descreva o plano para os membros..."
                rows={2}
              />
            </div>
            
            {/* Data de início */}
            <div>
              <Label>Data de Início</Label>
              <Input
                type="date"
                value={form.dataInicio}
                onChange={(e) => setForm(f => ({ ...f, dataInicio: e.target.value }))}
              />
            </div>
            
            {/* Configurações para plano personalizado */}
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
            
            {/* Opções de dias */}
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.incluiSabado}
                  onCheckedChange={(v) => setForm(f => ({ ...f, incluiSabado: v }))}
                />
                <Label>Incluir Sábado</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.incluiDomingo}
                  onCheckedChange={(v) => setForm(f => ({ ...f, incluiDomingo: v }))}
                />
                <Label>Incluir Domingo</Label>
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
    </div>
  );
}