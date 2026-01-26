import { useState } from 'react';
import { 
  Calendar, 
  BookHeart, 
  ScrollText, 
  Landmark, 
  Clock, 
  Target,
  ChevronRight,
  X,
  BookOpen,
  Users
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { PRESET_PLANS } from '@/hooks/useReadingPlans';
import { useNavigate } from 'react-router-dom';

interface AddPlanModalProps {
  open: boolean;
  onClose: () => void;
  onSelectPreset: (presetId: string, duration?: number) => void;
  availablePlans?: any[];
  onSelectAvailable?: (plan: any) => void;
}

const iconMap: Record<string, React.ElementType> = {
  'calendar': Calendar,
  'book-heart': BookHeart,
  'scroll-text': ScrollText,
  'landmark': Landmark,
};

export function AddPlanModal({ 
  open, 
  onClose, 
  onSelectPreset,
  availablePlans = [],
  onSelectAvailable,
}: AddPlanModalProps) {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  const handleSelectPreset = (presetId: string) => {
    const preset = Object.values(PRESET_PLANS).find(p => p.id === presetId);
    
    if (preset?.type === 'annual') {
      onSelectPreset(presetId);
      onClose();
    } else if (preset && 'durations' in preset && preset.durations) {
      setSelectedPlan(presetId);
      setSelectedDuration(null);
    }
  };

  const handleConfirmDuration = () => {
    if (selectedPlan && selectedDuration) {
      onSelectPreset(selectedPlan, selectedDuration);
      onClose();
      setSelectedPlan(null);
      setSelectedDuration(null);
    }
  };

  const selectedPreset = selectedPlan 
    ? Object.values(PRESET_PLANS).find(p => p.id === selectedPlan) 
    : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedPlan ? 'Escolha a duração' : 'Adicionar Plano de Leitura'}
          </DialogTitle>
        </DialogHeader>

        {!selectedPlan ? (
          <Tabs defaultValue="presets" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="presets">Planos do Sistema</TabsTrigger>
              <TabsTrigger value="church">Da Igreja</TabsTrigger>
            </TabsList>

            <TabsContent value="presets" className="space-y-3 mt-4">
              {Object.values(PRESET_PLANS).map(preset => {
                const IconComponent = iconMap[preset.icon] || BookOpen;
                
                return (
                  <Card
                    key={preset.id}
                    className="p-4 cursor-pointer hover:shadow-md transition-all group"
                    onClick={() => handleSelectPreset(preset.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "p-3 rounded-xl bg-gradient-to-br",
                        preset.color
                      )}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{preset.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {preset.description}
                        </p>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            <BookOpen className="h-3 w-3 mr-1" />
                            {preset.totalChapters} capítulos
                          </Badge>
                          
                          {preset.type === 'annual' || !('durations' in preset) ? (
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              365 dias
                            </Badge>
                          ) : 'durations' in preset ? (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {preset.durations.join(', ')} dias
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="church" className="space-y-3 mt-4">
              {/* Enter with code */}
              <Card 
                className="p-4 bg-gradient-to-r from-muted/50 to-muted border-dashed cursor-pointer hover:border-primary transition-colors"
                onClick={() => {
                  onClose();
                  navigate('/planos/entrar');
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Entrar com código</h4>
                    <p className="text-sm text-muted-foreground">
                      Recebeu um convite? Entre com o código
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>

              {availablePlans.length > 0 ? (
                availablePlans.map(plan => (
                  <Card
                    key={plan.id}
                    className="p-4 cursor-pointer hover:shadow-md transition-all"
                    onClick={() => onSelectAvailable?.(plan)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-secondary">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{plan.titulo}</h3>
                        {plan.descricao && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {plan.descricao}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {plan.duracao_dias} dias
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {plan.total_inscritos || 0} participantes
                          </Badge>
                        </div>
                      </div>
                      
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    Nenhum plano da igreja disponível
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          /* Duration selection */
          <div className="space-y-4">
            {selectedPreset && (
              <>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <div className={cn(
                    "p-2 rounded-lg bg-gradient-to-br",
                    selectedPreset.color
                  )}>
                    {(() => {
                      const IconComponent = iconMap[selectedPreset.icon] || BookOpen;
                      return <IconComponent className="h-5 w-5 text-white" />;
                    })()}
                  </div>
                  <div>
                    <p className="font-medium">{selectedPreset.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPreset.totalChapters} capítulos
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Em quantos dias deseja completar?</p>
                  
                  {'durations' in selectedPreset && <div className="grid grid-cols-3 gap-2">
                    {selectedPreset.durations.map(duration => {
                      const chaptersPerDay = Math.ceil(selectedPreset.totalChapters / duration);
                      const isSelected = selectedDuration === duration;
                      
                      return (
                        <Card
                          key={duration}
                          className={cn(
                            "p-4 cursor-pointer text-center transition-all",
                            isSelected 
                              ? "border-primary bg-primary/5 shadow-md" 
                              : "hover:border-primary/50"
                          )}
                          onClick={() => setSelectedDuration(duration)}
                        >
                          <p className="text-2xl font-bold">{duration}</p>
                          <p className="text-xs text-muted-foreground">dias</p>
                          
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-sm font-medium text-primary">
                              ~{chaptersPerDay} cap/dia
                            </p>
                          </div>
                        </Card>
                      );
                    })}
                  </div>}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setSelectedPlan(null)}
                  >
                    Voltar
                  </Button>
                  <Button 
                    className="flex-1"
                    disabled={!selectedDuration}
                    onClick={handleConfirmDuration}
                  >
                    Começar Plano
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
