import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Type, 
  Sun, 
  Moon, 
  Coffee, 
  Plus, 
  Minus, 
  Maximize2, 
  Minimize2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Info,
  Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Resource } from '@/src/types';

interface ReaderProps {
  resource: Resource;
  onClose: () => void;
  onUpdatePosition?: (position: number) => void;
}

type Theme = 'light' | 'sepia' | 'dark';
type FontFace = 'serif' | 'sans' | 'mono';

export default function Reader({ resource, onClose, onUpdatePosition }: ReaderProps) {
  const [fontSize, setFontSize] = useState(20);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [theme, setTheme] = useState<Theme>('sepia');
  const [fontFace, setFontFace] = useState<FontFace>('serif');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastSavedPosition = useRef<number>(resource.lastReadPosition || 0);

  // Restore position on load
  useEffect(() => {
    if (scrollContainerRef.current && resource.lastReadPosition) {
      const container = scrollContainerRef.current;
      // We need to wait a bit for the layout to settle
      const timeout = setTimeout(() => {
        const position = resource.lastReadPosition || 0;
        container.scrollTop = position * (container.scrollHeight - container.clientHeight);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [resource.id]);

  // Track scroll and update progress
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const currentProgress = container.scrollTop / (container.scrollHeight - container.clientHeight);
    setProgress(currentProgress);
    
    // Save position if it changed significantly (more than 2%)
    if (Math.abs(currentProgress - lastSavedPosition.current) > 0.02) {
      onUpdatePosition?.(currentProgress);
      lastSavedPosition.current = currentProgress;
    }
  };

  // Auto-hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (showControls) {
      timeout = setTimeout(() => setShowControls(false), 5000);
    }
    return () => clearTimeout(timeout);
  }, [showControls]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const themes = {
    light: {
      bg: 'bg-[#FCFCFC]',
      text: 'text-slate-900',
      ui: 'bg-white border-slate-200 text-slate-600',
      accent: 'bg-blue-50 text-blue-600',
      progress: 'bg-blue-500'
    },
    sepia: {
      bg: 'bg-[#F4ECD8]',
      text: 'text-[#5B4636]',
      ui: 'bg-[#EBE3CF] border-[#D6CBB3] text-[#5B4636]',
      accent: 'bg-[#E1D4B7] text-[#5B4636]',
      progress: 'bg-[#5B4636]'
    },
    dark: {
      bg: 'bg-[#1A1A1A]',
      text: 'text-slate-300',
      ui: 'bg-[#2A2A2A] border-[#3A3A3A] text-slate-400',
      accent: 'bg-[#3A3A3A] text-white',
      progress: 'bg-white'
    }
  };

  const fonts = {
    serif: 'font-serif',
    sans: 'font-sans',
    mono: 'font-mono'
  };

  const currentTheme = themes[theme];

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] transition-colors duration-500 overflow-hidden flex flex-col",
        currentTheme.bg
      )}
      onMouseMove={() => setShowControls(true)}
      onClick={() => setShowControls(true)}
    >
      {/* Top Bar Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className={cn(
              "absolute top-0 inset-x-0 h-16 border-b flex items-center justify-between px-6 z-10 backdrop-blur-md",
              currentTheme.ui
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4">
              <button 
                onClick={onClose}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
                title="Sair da Leitura"
              >
                <X size={20} />
              </button>
              <div className="hidden md:flex items-center gap-2">
                <Bookmark size={14} className="text-orange-500" />
                <h2 className="text-sm font-black truncate max-w-[200px] uppercase tracking-tighter">
                  {resource.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-6">
              <div className="hidden sm:block text-[10px] font-black uppercase tracking-widest opacity-50">
                Lendo: {Math.round(progress * 100)}%
              </div>

              {/* Tooltip Info (Summary) */}
              {resource.summary && (
                <div className="group relative">
                  <button className="p-2 hover:bg-black/5 rounded-full transition-colors">
                    <Info size={20} />
                  </button>
                  <div className="absolute top-full right-0 mt-2 w-80 p-6 rounded-2xl bg-white shadow-2xl border border-slate-100 opacity-0 pointer-events-none group-hover:opacity-100 transition-all z-50 text-slate-800">
                    <h3 className="font-black text-xs uppercase tracking-widest mb-2 text-orange-600">Resumo Teológico</h3>
                    <p className="text-xs italic leading-relaxed">{resource.summary}</p>
                  </div>
                </div>
              )}

              {/* Theme Selector */}
              <div className="flex bg-black/5 p-1 rounded-full">
                <button 
                  onClick={() => setTheme('light')}
                  className={cn("p-1.5 rounded-full", theme === 'light' && "shadow-sm bg-white")}
                >
                  <Sun size={16} />
                </button>
                <button 
                  onClick={() => setTheme('sepia')}
                  className={cn("p-1.5 rounded-full", theme === 'sepia' && "shadow-sm bg-[#EBE3CF]")}
                >
                  <Coffee size={16} />
                </button>
                <button 
                  onClick={() => setTheme('dark')}
                  className={cn("p-1.5 rounded-full", theme === 'dark' && "shadow-sm bg-[#333]")}
                >
                  <Moon size={16} />
                </button>
              </div>

              {/* Fullscreen Toggle */}
              <button 
                onClick={toggleFullscreen}
                className="p-2 hover:bg-black/5 rounded-full transition-colors hidden sm:block"
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-24 md:py-40 scroll-smooth"
      >
        <div 
          className={cn(
            "max-w-3xl mx-auto transition-all duration-300 text-justify break-words hyphens-auto",
            fonts[fontFace],
            currentTheme.text
          )}
          style={{ 
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight
          }}
        >
          <div className="mb-24 text-center opacity-50">
            <BookOpen size={64} className="mx-auto mb-6 text-orange-500/50" />
            <h1 className="text-4xl font-black tracking-tighter leading-tight">{resource.title}</h1>
            <p className="text-sm mt-4 font-bold uppercase tracking-[0.2em]">Recurso Pastoral</p>
          </div>
          
          <div className="whitespace-pre-wrap select-text selection:bg-orange-200 selection:text-orange-950">
            {resource.extractedText}
          </div>

          <div className="mt-32 pt-16 border-t border-black/5 text-center">
            <div className="text-2xl opacity-20 mb-4">❖</div>
            <p className="text-[10px] uppercase tracking-widest font-black opacity-30">
              Fim da Leitura • Processado por IA Pastoral
            </p>
          </div>
        </div>
      </div>

      {/* Reading Progress Indicator (Bottom edge) */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-black/5 z-20">
        <div 
          className={cn("h-full transition-all duration-300", currentTheme.progress)}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Bottom Floating Controls (Font, Size & Line Height) */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-8 inset-x-0 flex justify-center z-10 px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={cn(
              "flex flex-col md:flex-row items-center gap-4 md:gap-8 px-6 py-4 rounded-[2.5rem] shadow-2xl border backdrop-blur-2xl transition-colors duration-500",
              currentTheme.ui
            )}>
              {/* Font Family */}
              <div className="flex bg-black/5 p-1 rounded-2xl">
                <button 
                  onClick={() => setFontFace('serif')}
                  className={cn("px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", fontFace === 'serif' ? (currentTheme.accent + " shadow-sm") : "opacity-50")}
                >
                  Serif
                </button>
                <button 
                  onClick={() => setFontFace('sans')}
                  className={cn("px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", fontFace === 'sans' ? (currentTheme.accent + " shadow-sm") : "opacity-50")}
                >
                  Sans
                </button>
              </div>

              <div className="hidden md:block w-px h-8 bg-black/10" />

              <div className="flex items-center gap-8">
                {/* Font Size */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                    className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors border border-black/5"
                  >
                    <Minus size={14} />
                  </button>
                  <div className="flex flex-col items-center min-w-[40px]">
                    <span className="text-[10px] font-black uppercase tracking-tighter opacity-40">Fonte</span>
                    <span className="text-xs font-black">{fontSize}</span>
                  </div>
                  <button 
                    onClick={() => setFontSize(Math.min(48, fontSize + 2))}
                    className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors border border-black/5"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="w-px h-6 bg-black/10" />

                {/* Line Height */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setLineHeight(Math.max(1.2, lineHeight - 0.1))}
                    className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors border border-black/5"
                  >
                    <Minus size={14} />
                  </button>
                  <div className="flex flex-col items-center min-w-[40px]">
                    <span className="text-[10px] font-black uppercase tracking-tighter opacity-40">Espaço</span>
                    <span className="text-xs font-black">{lineHeight.toFixed(1)}</span>
                  </div>
                  <button 
                    onClick={() => setLineHeight(Math.min(2.4, lineHeight + 0.1))}
                    className="w-8 h-8 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors border border-black/5"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
