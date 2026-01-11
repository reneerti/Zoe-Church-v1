import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHarpaHymn } from "@/hooks/useHarpaData";
import { cn } from "@/lib/utils";

export default function HinoApresentacao() {
  const { numero } = useParams<{ numero: string }>();
  const navigate = useNavigate();
  const hymnNumber = parseInt(numero || "1");
  const { data: hymn, isLoading } = useHarpaHymn(hymnNumber);
  
  const [fontSize, setFontSize] = useState(28);
  const [currentVerse, setCurrentVerse] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const autoPlayIntervalRef = useRef<NodeJS.Timeout>();
  
  // Parse lyrics into verses/sections
  const verses = hymn?.lyrics
    ? hymn.lyrics.split(/\n\n+/).filter(v => v.trim())
    : [];
  
  // Add chorus as a separate section if it exists
  const allSections = hymn?.chorus 
    ? [...verses, `🎵 CORO 🎵\n\n${hymn.chorus}`]
    : verses;

  const totalSections = allSections.length;

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (!autoPlay) setShowControls(false);
    }, 3000);
  }, [autoPlay]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      resetControlsTimeout();
      switch (e.key) {
        case "ArrowRight":
        case " ":
          e.preventDefault();
          setCurrentVerse(v => Math.min(v + 1, totalSections - 1));
          break;
        case "ArrowLeft":
          setCurrentVerse(v => Math.max(v - 1, 0));
          break;
        case "ArrowUp":
          setFontSize(f => Math.min(f + 4, 72));
          break;
        case "ArrowDown":
          setFontSize(f => Math.max(f - 4, 16));
          break;
        case "Escape":
          navigate(-1);
          break;
        case "Home":
          setCurrentVerse(0);
          break;
        case "End":
          setCurrentVerse(totalSections - 1);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalSections, navigate, resetControlsTimeout]);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay) {
      autoPlayIntervalRef.current = setInterval(() => {
        setCurrentVerse(v => {
          if (v >= totalSections - 1) {
            setAutoPlay(false);
            return v;
          }
          return v + 1;
        });
      }, 5000);
    }
    
    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, [autoPlay, totalSections]);

  // Touch/swipe handlers for gesture navigation
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    resetControlsTimeout();
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      setCurrentVerse(v => Math.min(v + 1, totalSections - 1));
    } else if (isRightSwipe) {
      setCurrentVerse(v => Math.max(v - 1, 0));
    }
  };

  // Navigate hymns
  const navigateHymn = (direction: "prev" | "next") => {
    const newNumber = direction === "prev" ? hymnNumber - 1 : hymnNumber + 1;
    if (newNumber >= 1 && newNumber <= 640) {
      navigate(`/harpa/${newNumber}/apresentar`, { replace: true });
      setCurrentVerse(0);
    }
  };

  // Handle screen tap for controls
  const handleScreenTap = () => {
    resetControlsTimeout();
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">Carregando...</div>
      </div>
    );
  }

  if (!hymn) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center flex-col gap-4">
        <div className="text-white text-2xl">Hino não encontrado</div>
        <Button variant="outline" onClick={() => navigate("/harpa")}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden select-none"
      onClick={handleScreenTap}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-harpa rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-primary rounded-full blur-3xl" />
      </div>

      {/* Header controls */}
      <div 
        className={cn(
          "absolute top-0 left-0 right-0 z-50 transition-all duration-300 safe-area-inset-top",
          showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full"
        )}
      >
        <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); navigate(-1); }}
          >
            <X className="h-6 w-6" />
          </Button>
          
          <div className="text-center">
            <h1 className="text-white font-bold text-lg">
              {hymn.hymn_number}. {hymn.title}
            </h1>
            {hymn.author && (
              <p className="text-white/60 text-sm">{hymn.author}</p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); setAutoPlay(!autoPlay); }}
            >
              {autoPlay ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content - Current verse */}
      <div className="absolute inset-0 flex items-center justify-center p-8 md:p-16">
        <div 
          className="text-center text-white max-w-4xl animate-fade-in"
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
          key={currentVerse}
        >
          <div className="whitespace-pre-wrap font-serif">
            {allSections[currentVerse]}
          </div>
        </div>
      </div>

      {/* Side navigation arrows */}
      <button
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all",
          showControls ? "opacity-100" : "opacity-0",
          currentVerse === 0 && "opacity-30 cursor-not-allowed"
        )}
        onClick={(e) => { 
          e.stopPropagation(); 
          setCurrentVerse(v => Math.max(v - 1, 0)); 
        }}
        disabled={currentVerse === 0}
      >
        <ChevronLeft className="h-8 w-8" />
      </button>

      <button
        className={cn(
          "absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all",
          showControls ? "opacity-100" : "opacity-0",
          currentVerse === totalSections - 1 && "opacity-30 cursor-not-allowed"
        )}
        onClick={(e) => { 
          e.stopPropagation(); 
          setCurrentVerse(v => Math.min(v + 1, totalSections - 1)); 
        }}
        disabled={currentVerse === totalSections - 1}
      >
        <ChevronRight className="h-8 w-8" />
      </button>

      {/* Bottom controls */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 z-50 transition-all duration-300 safe-area-inset-bottom",
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full"
        )}
      >
        <div className="p-4 bg-gradient-to-t from-black/80 to-transparent">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-4 flex-wrap max-w-md mx-auto">
            {allSections.map((_, idx) => (
              <button
                key={idx}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all",
                  idx === currentVerse 
                    ? "bg-harpa scale-125" 
                    : "bg-white/40 hover:bg-white/60"
                )}
                onClick={(e) => { e.stopPropagation(); setCurrentVerse(idx); }}
              />
            ))}
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between max-w-md mx-auto">
            {/* Hymn navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); navigateHymn("prev"); }}
                disabled={hymnNumber <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Hino {hymnNumber - 1}
              </Button>
            </div>

            {/* Font size */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-8 w-8"
                onClick={(e) => { e.stopPropagation(); setFontSize(f => Math.max(f - 4, 16)); }}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-white/60 text-sm w-12 text-center">{fontSize}px</span>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-8 w-8"
                onClick={(e) => { e.stopPropagation(); setFontSize(f => Math.min(f + 4, 72)); }}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* Next hymn */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); navigateHymn("next"); }}
                disabled={hymnNumber >= 640}
              >
                Hino {hymnNumber + 1}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <p className="text-white/40 text-xs text-center mt-3">
            Deslize ou use ← → para navegar • ↑↓ ajustar fonte • ESC para sair
          </p>
        </div>
      </div>
    </div>
  );
}