import { ChevronLeft, Play, Calendar, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";

// Sample videos
const videos = [
  {
    id: 1,
    title: "Culto de Celebração - O Poder da Ressurreição",
    description: "Mensagem especial do Pr. João Silva sobre a vitória de Cristo.",
    thumbnail: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&auto=format",
    date: new Date(),
    views: 1250,
    duration: "45:32",
    featured: true,
  },
  {
    id: 2,
    title: "Estudo Bíblico - Romanos 8",
    description: "Série de estudos no livro de Romanos.",
    thumbnail: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&auto=format",
    date: subDays(new Date(), 2),
    views: 856,
    duration: "38:15",
    featured: false,
  },
  {
    id: 3,
    title: "Louvor e Adoração - Noite de Intimidade",
    description: "Uma noite especial de louvor e adoração.",
    thumbnail: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format",
    date: subDays(new Date(), 5),
    views: 2340,
    duration: "1:22:45",
    featured: false,
  },
  {
    id: 4,
    title: "Conferência de Jovens 2024",
    description: "Momentos marcantes da nossa conferência anual.",
    thumbnail: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&auto=format",
    date: subDays(new Date(), 10),
    views: 3120,
    duration: "2:15:00",
    featured: false,
  },
];

export default function Videos() {
  const navigate = useNavigate();
  const featuredVideo = videos.find((v) => v.featured);
  const otherVideos = videos.filter((v) => !v.featured);

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 glass safe-area-inset-top">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-bold text-lg">Vídeos</h1>
          </div>
        </div>
      </header>

      <PageContainer>
        {/* Featured Video */}
        {featuredVideo && (
          <div className="py-4">
            <div 
              className="relative overflow-hidden rounded-2xl opacity-0 animate-fade-in cursor-pointer group"
              onClick={() => {}}
            >
              <div className="aspect-video w-full bg-muted">
                <img 
                  src={featuredVideo.thumbnail} 
                  alt={featuredVideo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="h-7 w-7 text-videos fill-videos ml-1" />
                </div>
              </div>

              {/* Duration Badge */}
              <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-black/70 text-white text-xs font-medium">
                {featuredVideo.duration}
              </div>
            </div>

            <div className="mt-3">
              <h2 className="font-semibold text-lg">{featuredVideo.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{featuredVideo.description}</p>
              
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {featuredVideo.views.toLocaleString('pt-BR')} visualizações
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(featuredVideo.date, "dd/MM/yyyy")}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Other Videos */}
        <div className="py-4">
          <h3 className="font-semibold mb-4">Mais Vídeos</h3>
          
          <div className="space-y-4">
            {otherVideos.map((video, index) => (
              <VideoCard key={video.id} video={video} delay={index * 50} />
            ))}
          </div>
        </div>
      </PageContainer>

      <BottomNav />
    </>
  );
}

function VideoCard({ 
  video, 
  delay 
}: { 
  video: typeof videos[0]; 
  delay: number;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 opacity-0 animate-fade-in cursor-pointer group"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Thumbnail */}
      <div className="relative w-40 flex-shrink-0 overflow-hidden rounded-xl">
        <div className="aspect-video w-full bg-muted">
          <img 
            src={video.thumbnail} 
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="h-8 w-8 text-white fill-white" />
        </div>

        {/* Duration */}
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-medium">
          {video.duration}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-1">
        <h4 className="font-medium text-sm line-clamp-2">{video.title}</h4>
        
        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
          <span>{video.views.toLocaleString('pt-BR')} views</span>
          <span>•</span>
          <span>{format(video.date, "dd/MM")}</span>
        </div>
      </div>
    </div>
  );
}
