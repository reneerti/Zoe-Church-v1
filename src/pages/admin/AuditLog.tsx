import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Search, Filter, RefreshCw, User, Database, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type AuditEntry = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  acao: string;
  tabela: string | null;
  registro_id: string | null;
  dados_anteriores: any;
  dados_novos: any;
  descricao: string | null;
  unidade_id: string | null;
  created_at: string | null;
};

export default function AuditLog() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTabela, setFilterTabela] = useState<string>("all");
  const [filterAcao, setFilterAcao] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [filterTabela, filterAcao]);

  const fetchLogs = async () => {
    setLoading(true);
    
    let query = supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    
    if (filterTabela !== "all") {
      query = query.eq("tabela", filterTabela);
    }
    
    if (filterAcao !== "all") {
      query = query.eq("acao", filterAcao);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Erro ao buscar logs:", error);
    } else {
      setLogs(data || []);
    }
    
    setLoading(false);
  };

  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      log.user_email?.toLowerCase().includes(searchLower) ||
      log.tabela?.toLowerCase().includes(searchLower) ||
      log.descricao?.toLowerCase().includes(searchLower) ||
      log.acao?.toLowerCase().includes(searchLower)
    );
  });

  const getAcaoBadge = (acao: string) => {
    switch (acao) {
      case "criar":
        return <Badge className="bg-green-500">Criar</Badge>;
      case "atualizar":
        return <Badge className="bg-blue-500">Atualizar</Badge>;
      case "deletar":
        return <Badge className="bg-red-500">Deletar</Badge>;
      default:
        return <Badge variant="secondary">{acao}</Badge>;
    }
  };

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case "super_user":
        return <Badge className="bg-purple-500">Super User</Badge>;
      case "master":
        return <Badge className="bg-orange-500">Master</Badge>;
      case "usuario":
        return <Badge variant="secondary">Usuário</Badge>;
      default:
        return <Badge variant="outline">Sistema</Badge>;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
  };

  const tabelas = [...new Set(logs.map(l => l.tabela).filter(Boolean))];
  const acoes = [...new Set(logs.map(l => l.acao).filter(Boolean))];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-bold">Audit Log</h1>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLogs}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 pb-20">
        {/* Filtros */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por email, tabela, descrição..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterTabela} onValueChange={setFilterTabela}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tabela" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas tabelas</SelectItem>
                  {tabelas.map(t => (
                    <SelectItem key={t} value={t!}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterAcao} onValueChange={setFilterAcao}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas ações</SelectItem>
                  {acoes.map(a => (
                    <SelectItem key={a} value={a!}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5" />
              Registros de Auditoria
              <Badge variant="secondary" className="ml-2">{filteredLogs.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {filteredLogs.map(log => (
                  <Dialog key={log.id}>
                    <DialogTrigger asChild>
                      <div 
                        className="p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedLog(log)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getAcaoBadge(log.acao)}
                            <span className="font-mono text-sm">{log.tabela}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDate(log.created_at)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span>{log.user_email || "Sistema"}</span>
                            {getRoleBadge(log.user_role)}
                          </div>
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {log.descricao}
                          </span>
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          {getAcaoBadge(log.acao)}
                          <span className="font-mono">{log.tabela}</span>
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Usuário</p>
                            <p className="font-medium">{log.user_email || "Sistema"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Role</p>
                            {getRoleBadge(log.user_role)}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Data/Hora</p>
                            <p className="font-medium">{formatDate(log.created_at)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Registro ID</p>
                            <p className="font-mono text-xs">{log.registro_id || "-"}</p>
                          </div>
                        </div>
                        
                        {log.dados_anteriores && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Dados Anteriores</p>
                            <pre className="p-3 rounded-lg bg-red-500/10 text-xs overflow-x-auto">
                              {JSON.stringify(log.dados_anteriores, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {log.dados_novos && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Dados Novos</p>
                            <pre className="p-3 rounded-lg bg-green-500/10 text-xs overflow-x-auto">
                              {JSON.stringify(log.dados_novos, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
                
                {filteredLogs.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum registro encontrado
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
