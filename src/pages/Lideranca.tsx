import { useState, useEffect } from "react";
import { ChevronLeft, Phone, Mail, MessageCircle, Pencil, User, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EditLeaderModal } from "@/components/lideranca/EditLeaderModal";
import { AddLeaderModal } from "@/components/lideranca/AddLeaderModal";

type Leader = {
  id: string;
  nome: string;
  cargo: string | null;
  email: string;
  telefone: string | null;
  foto_url: string | null;
  ordem: number | null;
  is_principal: boolean | null;
};

export default function Lideranca() {
  const navigate = useNavigate();
  const { session, isMaster, isSuperUser } = useAuth();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLeader, setEditingLeader] = useState<Leader | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const fetchLeaders = async () => {
    try {
      const { data, error } = await supabase
        .from("masters")
        .select("id, nome, cargo, email, telefone, foto_url, ordem, is_principal")
        .eq("is_active", true)
        .order("ordem", { ascending: true, nullsFirst: false })
        .order("nome", { ascending: true });

      if (error) throw error;
      setLeaders(data || []);
    } catch (error) {
      console.error("Error fetching leaders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaders();
  }, []);

  const handleEdit = (leader: Leader) => {
    setEditingLeader(leader);
    setEditModalOpen(true);
  };

  const formatWhatsApp = (phone: string | null) => {
    if (!phone) return "";
    // Remove all non-numeric characters
    return phone.replace(/\D/g, "");
  };

  const canEdit = isMaster || isSuperUser;

  return (
    <>
      <header className="sticky top-0 z-40 glass safe-area-inset-top">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-bold text-lg">Liderança</h1>
          </div>
          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setAddModalOpen(true)}
              title="Adicionar líder"
            >
              <Plus className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>

      <PageContainer>
        <div className="pt-4 space-y-4">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-2xl bg-card border border-border">
                <div className="flex gap-4">
                  <Skeleton className="w-20 h-20 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-full mt-2" />
                  </div>
                </div>
              </div>
            ))
          ) : leaders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum líder cadastrado</p>
            </div>
          ) : (
            leaders.map((leader, index) => (
              <LeaderCard
                key={leader.id}
                leader={leader}
                delay={index * 50}
                canEdit={canEdit}
                onEdit={() => handleEdit(leader)}
              />
            ))
          )}
        </div>
      </PageContainer>

      <BottomNav />

      {/* Add Modal */}
      <AddLeaderModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSave={fetchLeaders}
      />

      {/* Edit Modal */}
      <EditLeaderModal
        leader={editingLeader}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSave={fetchLeaders}
      />
    </>
  );
}

function LeaderCard({
  leader,
  delay,
  canEdit,
  onEdit
}: {
  leader: Leader;
  delay: number;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const whatsappNumber = leader.telefone?.replace(/\D/g, "") || "";

  return (
    <div
      className={cn(
        "p-4 rounded-2xl bg-card border border-border transition-all duration-200 hover:shadow-md opacity-0 animate-fade-in"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex gap-4">
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
          {leader.foto_url ? (
            <img
              src={leader.foto_url}
              alt={leader.nome}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.fallback')?.classList.remove('hidden');
              }}
            />
          ) : null}
          <User className={cn("h-8 w-8 text-muted-foreground fallback", leader.foto_url && "hidden")} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold">{leader.nome}</h3>
              {leader.cargo && <p className="text-sm text-primary">{leader.cargo}</p>}
            </div>
            {canEdit && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 flex-shrink-0"
                onClick={onEdit}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {whatsappNumber && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3"
                onClick={() => window.open(`https://wa.me/55${whatsappNumber}`, "_blank")}
              >
                <MessageCircle className="h-4 w-4 mr-1 text-convertidos" />
                WhatsApp
              </Button>
            )}
            {leader.telefone && (
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => window.open(`tel:${leader.telefone}`, "_self")}
              >
                <Phone className="h-4 w-4" />
              </Button>
            )}
            {leader.email && (
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => window.open(`mailto:${leader.email}`, "_self")}
              >
                <Mail className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
