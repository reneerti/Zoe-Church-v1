import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useBibleVersions, useBibleBooks } from '@/hooks/useBibleData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BottomNav } from '@/components/layout/BottomNav';
import { ArrowLeft, Search, Filter, BookOpen, X } from 'lucide-react';

interface ResultadoBusca {
  id: string;
  versao: string;
  livro: string;
  livro_abrev: string;
  capitulo: number;
  versiculo: number;
  texto: string;
  referencia: string;
  relevancia?: number;
  similaridade?: number;
}

type ModoBusca = 'exato' | 'todas' | 'qualquer' | 'prefixo' | 'similar';

export default function BuscaBiblia() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [termo, setTermo] = useState(searchParams.get('q') || '');
  const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filtros, setFiltros] = useState({
    versao: searchParams.get('v') || 'NVI',
    livro: searchParams.get('l') || '',
    testamento: searchParams.get('t') || '',
    modo: (searchParams.get('m') as ModoBusca) || 'todas',
  });
  
  const { data: versoes } = useBibleVersions();
  const { data: livros } = useBibleBooks();
  
  const buscar = useCallback(async () => {
    if (termo.length < 2) {
      setResultados([]);
      return;
    }
    
    setLoading(true);
    
    try {
      let funcao: string;
      let params: Record<string, unknown> = {
        termo_busca: termo,
        versao_codigo: filtros.versao || null,
        limite: 50,
      };
      
      switch (filtros.modo) {
        case 'exato':
          funcao = 'buscar_biblia_exato';
          if (filtros.livro) {
            const livro = livros?.find(l => l.abbreviation === filtros.livro);
            params.livro_id_param = livro?.id || null;
          }
          if (filtros.testamento) params.testamento_param = filtros.testamento;
          break;
        case 'prefixo':
          funcao = 'buscar_biblia_prefixo';
          break;
        case 'similar':
          funcao = 'buscar_biblia_similar';
          params.similaridade_minima = 0.3;
          break;
        default:
          funcao = 'buscar_biblia_palavras';
          params.modo = filtros.modo;
          if (filtros.livro) {
            const livro = livros?.find(l => l.abbreviation === filtros.livro);
            params.livro_id_param = livro?.id || null;
          }
          if (filtros.testamento) params.testamento_param = filtros.testamento;
          break;
      }
      
      const { data, error } = await supabase.rpc(funcao as any, params);
      
      if (error) throw error;
      setResultados((data as ResultadoBusca[]) || []);
      
      // Update URL params
      const newParams = new URLSearchParams();
      newParams.set('q', termo);
      if (filtros.versao) newParams.set('v', filtros.versao);
      if (filtros.livro) newParams.set('l', filtros.livro);
      if (filtros.testamento) newParams.set('t', filtros.testamento);
      if (filtros.modo !== 'todas') newParams.set('m', filtros.modo);
      setSearchParams(newParams, { replace: true });
      
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setLoading(false);
    }
  }, [termo, filtros, livros, setSearchParams]);
  
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (termo.length >= 2) {
        buscar();
      }
    }, 300);
    
    return () => clearTimeout(debounce);
  }, [termo, filtros, buscar]);
  
  const destacarTermo = (texto: string, busca: string) => {
    if (!busca) return texto;
    const regex = new RegExp(`(${busca.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const partes = texto.split(regex);
    
    return partes.map((parte, i) =>
      regex.test(parte) ? (
        <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">
          {parte}
        </mark>
      ) : (
        parte
      )
    );
  };
  
  const navegarParaVersiculo = (resultado: ResultadoBusca) => {
    const livro = livros?.find(l => l.abbreviation === resultado.livro_abrev);
    if (livro) {
      navigate(`/biblia/${livro.id}/${resultado.capitulo}`);
    }
  };
  
  const modoLabels: Record<ModoBusca, string> = {
    exato: 'Frase exata',
    todas: 'Todas as palavras',
    qualquer: 'Qualquer palavra',
    prefixo: 'Começa com',
    similar: 'Similar (fuzzy)',
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/biblia')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Buscar na Bíblia..."
              className="pl-9 pr-9"
              autoFocus
            />
            {termo && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setTermo('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <Button 
            variant={showFilters ? 'default' : 'outline'} 
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Filters */}
        {showFilters && (
          <div className="px-4 pb-4 grid grid-cols-2 gap-2">
            <Select value={filtros.modo} onValueChange={(v) => setFiltros(f => ({ ...f, modo: v as ModoBusca }))}>
              <SelectTrigger>
                <SelectValue placeholder="Modo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(modoLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filtros.versao} onValueChange={(v) => setFiltros(f => ({ ...f, versao: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Versão" />
              </SelectTrigger>
              <SelectContent>
                {versoes?.map(v => (
                  <SelectItem key={v.id} value={v.code}>{v.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filtros.testamento} onValueChange={(v) => setFiltros(f => ({ ...f, testamento: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Testamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="AT">Antigo Testamento</SelectItem>
                <SelectItem value="NT">Novo Testamento</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filtros.livro} onValueChange={(v) => setFiltros(f => ({ ...f, livro: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Livro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os livros</SelectItem>
                {livros?.map(l => (
                  <SelectItem key={l.id} value={l.abbreviation}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </header>
      
      {/* Results */}
      <div className="p-4 space-y-3">
        {loading && (
          <>
            {[1, 2, 3, 4, 5].map(i => (
              <Card key={i} className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-16 w-full" />
              </Card>
            ))}
          </>
        )}
        
        {!loading && resultados.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground">
              {resultados.length} resultado{resultados.length !== 1 ? 's' : ''} encontrado{resultados.length !== 1 ? 's' : ''}
              {filtros.modo === 'similar' && ' (busca por similaridade)'}
            </p>
            
            {resultados.map((resultado) => (
              <Card
                key={resultado.id}
                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navegarParaVersiculo(resultado)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-primary">{resultado.referencia}</span>
                  </div>
                  <Badge variant="outline">{resultado.versao}</Badge>
                </div>
                
                <p className="text-sm leading-relaxed">
                  {destacarTermo(resultado.texto, termo)}
                </p>
                
                {resultado.relevancia !== undefined && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Relevância:</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${Math.min(resultado.relevancia * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {resultado.similaridade !== undefined && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Similaridade:</span>
                    <span className="text-xs font-medium">{Math.round(resultado.similaridade * 100)}%</span>
                  </div>
                )}
              </Card>
            ))}
          </>
        )}
        
        {!loading && termo.length >= 2 && resultados.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Nenhum resultado encontrado
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Tente outras palavras ou ajuste os filtros
            </p>
            {filtros.modo !== 'similar' && (
              <Button
                variant="outline"
                onClick={() => setFiltros(f => ({ ...f, modo: 'similar' }))}
              >
                Tentar busca por similaridade
              </Button>
            )}
          </div>
        )}
        
        {!loading && termo.length < 2 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              Digite pelo menos 2 caracteres
            </h3>
            <p className="text-muted-foreground text-sm">
              para buscar na Bíblia
            </p>
          </div>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}