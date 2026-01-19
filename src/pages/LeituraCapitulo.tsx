import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Share2, 
  Settings2,
  Check,
  BookOpen,
  Info,
  Copy,
  Type
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageContainer } from '@/components/layout/PageContainer'; // Corrigido: Named Import
import useBibleData from '@/hooks/useBibleData'; // Corrigido: Default Import
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

const LeituraCapitulo = () => {
  const { livroId, capitulo } = useParams();
  const navigate = useNavigate();
  
  // Hook de dados da bíblia
  const { versiculos, loading, livroNome, proximoCapitulo, capituloAnterior } = useBibleData(livroId, Number(capitulo));

  // Estados de Preferências e Interação
  const [fontSize, setFontSize] = useState(18);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [isRead, setIsRead] = useState(false);
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');
  const [showNumbers, setShowNumbers] = useState(true);

  // Carregar preferências e status de leitura
  useEffect(() => {
    const savedFontSize = localStorage.getItem('zoe-bible-font-size');
    const savedFontFamily = localStorage.getItem('zoe-bible-font-family');
    if (savedFontSize) setFontSize(Number(savedFontSize));
    if (savedFontFamily) setFontFamily(savedFontFamily as 'serif' | 'sans');
    
    const checkReadStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('book_id', livroId)
          .eq('chapter', capitulo)
          .single();
        if (data) setIsRead(true);
      }
    };
    checkReadStatus();
    setSelectedVerses([]); // Reseta seleção ao mudar de capítulo
  }, [livroId, capitulo]);

  const handleToggleVerse = (num: number) => {
    setSelectedVerses(prev => 
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  const handleCopy = () => {
    const textToCopy = versiculos
      ?.filter(v => selectedVerses.includes(v.versiculo))
      .map(v => `${v.versiculo}. ${v.texto}`)
      .join('\n');
    
    if (textToCopy) {
      navigator.clipboard.writeText(`*${livroNome} ${capitulo}*\n\n${textToCopy}`);
      toast.success("Versículos copiados!");
      setSelectedVerses([]);
    }
  };

  const handleShare = async () => {
    const textToShare = versiculos
      ?.filter(v => selectedVerses.includes(v.versiculo))
      .map(v => `${v.versiculo}. ${v.texto}`)
      .join('\n');
    
    const finalMsg = `*${livroNome} ${capitulo}*\n\n${textToShare}\n\n_Lido via Zoe App_`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Bíblia Zoe', text: finalMsg });
      } catch (err) { console.log(err); }
    } else {
      handleCopy();
    }
    setSelectedVerses([]);
  };

  const markAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Faça login para salvar seu progresso");
      return;
    }

    const { error } = await supabase
      .from('user_progress')
      .upsert({ 
        user_id: user.id, 
        book_id: livroId, 
        chapter: Number(capitulo),
        completed_at: new Date().toISOString()
      });

    if (!error) {
      setIsRead(true);
      toast.success("Capítulo marcado como lido! 🙌");
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col min-h-screen bg-background pb-32">
        {/* Navbar Superior */}
        <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b">
          <div className="flex items-center justify-between p-4 max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold leading-none tracking-tight">
                  {livroNome || <Skeleton className="h-5 w-24" />}
                </h1>
                <p className="text-[10px] uppercase font-bold text-primary/80 mt-1">Capítulo {capitulo}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                    <Settings2 className="h-5 w-5" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader className="text-left">
                    <DrawerTitle className="flex items-center gap-2">
                      <Type className="h-5 w-5" /> Ajustes de Leitura
                    </DrawerTitle>
                  </DrawerHeader>
                  <div className="p-6 space-y-8">
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Tamanho do Texto</span>
                        <span className="text-primary">{fontSize}px</span>
                      </div>
                      <Slider 
                        value={[fontSize]} 
                        min={14} max={32} step={1} 
                        onValueChange={(v) => {
                          setFontSize(v[0]);
                          localStorage.setItem('zoe-bible-font-size', v[0].toString());
                        }} 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant={fontFamily === 'serif' ? 'default' : 'outline'} 
                        className="w-full"
                        onClick={() => { setFontFamily('serif'); localStorage.setItem('zoe-bible-font-family', 'serif'); }}
                      >Fonte Clássica</Button>
                      <Button 
                        variant={fontFamily === 'sans' ? 'default' : 'outline'} 
                        className="w-full"
                        onClick={() => { setFontFamily('sans'); localStorage.setItem('zoe-bible-font-family', 'sans'); }}
                      >Fonte Moderna</Button>
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>

              {selectedVerses.length > 0 && (
                <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                  <Button variant="ghost" size="icon" onClick={handleCopy}><Copy className="h-5 w-5" /></Button>
                  <Button variant="ghost" size="icon" onClick={handleShare} className="text-primary"><Share2 className="h-5 w-5" /></Button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Corpo da Leitura Sequencial */}
        <main className="flex-1 px-6 pt-8 max-w-2xl mx-auto w-full">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-[95%]" /><Skeleton className="h-4 w-[98%]" /><Skeleton className="h-4 w-[90%]" />
            </div>
          ) : (
            <div 
              className={`
                ${fontFamily === 'serif' ? 'font-serif' : 'font-