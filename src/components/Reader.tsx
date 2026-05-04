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
  onAddHighlight?: (highlight: any) => void;
  onDeleteHighlight?: (id: string) => void;
}

type Theme = 'light' | 'sepia' | 'dark';
type FontFace = 'serif' | 'sans' | 'mono';
type TextAlign = 'left' | 'justify';

const HIGHLIGHT_COLORS = [
  { name: 'Amarelo', bg: 'bg-[#FEF08A]', value: 'rgba(254, 240, 138, 0.6)' },
  { name: 'Verde', bg: 'bg-[#BBF7D0]', value: 'rgba(187, 247, 208, 0.6)' },
  { name: 'Azul', bg: 'bg-[#BFDBFE]', value: 'rgba(191, 219, 254, 0.6)' },
  { name: 'Rosa', bg: 'bg-[#FECDD3]', value: 'rgba(254, 205, 211, 0.6)' },
];

export default function Reader({ resource, onClose, onUpdatePosition, onAddHighlight, onDeleteHighlight }: ReaderProps) {
  const [fontSize, setFontSize] = useState(20);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [theme, setTheme] = useState<Theme>('sepia');
  const [fontFace, setFontFace] = useState<FontFace>('serif');
  const [textAlign, setTextAlign] = useState<TextAlign>('left');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [selection, setSelection] = useState<{ start: number; end: number; text: string; x: number; y: number } | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastSavedPosition = useRef<number>(resource.lastReadPosition || 0);

  // Handle Text Selection
  const handleSelection = () => {
    const activeSelection = window.getSelection();
    if (!activeSelection || activeSelection.isCollapsed || !contentRef.current) {
      setSelection(null);
      return;
    }

    const range = activeSelection.getRangeAt(0);
    
    // Ensure the selection is within the content container
    if (!contentRef.current.contains(range.commonAncestorContainer)) {
      setSelection(null);
      return;
    }

    const rects = range.getClientRects();
    if (rects.length === 0) return;

    // Use the last rect for the toolbar positioning (top of it)
    const rect = rects[0];
    
    // Improved robust offset calculation
    const getSelectionOffset = (node: Node, offset: number, container: HTMLElement): number => {
      let currentOffset = 0;
      const walk = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      let currentNode = walk.nextNode();
      
      while (currentNode) {
        if (currentNode === node) {
          return currentOffset + offset;
        }
        currentOffset += currentNode.textContent?.length || 0;
        currentNode = walk.nextNode();
      }
      return currentOffset;
    };

    const start = getSelectionOffset(range.startContainer, range.startOffset, contentRef.current);
    const text = range.toString();

    if (text.trim().length > 0) {
      setSelection({
        start,
        end: start + text.length,
        text,
        x: rect.left + rect.width / 2,
        y: rect.top
      });
    }
  };

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  const addHighlight = (color: string) => {
    if (!selection) return;

    const id = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2, 11);

    onAddHighlight?.({
      id,
      text: selection.text,
      startIndex: selection.start,
      endIndex: selection.end,
      color: color,
      createdAt: Date.now()
    });

    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  // Helper to render text with highlights
  const renderContent = () => {
    const text = resource.extractedText || '';
    const highlights = resource.highlights || [];
    
    if (highlights.length === 0) return text;

    // Sort highlights by start index
    const sorted = [...highlights].sort((a, b) => a.startIndex - b.startIndex);
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    sorted.forEach((h, index) => {
      // Overlap prevention (simple version)
      if (h.startIndex < lastIndex) return;

      // Add normal text before highlight
      if (h.startIndex > lastIndex) {
        elements.push(<span key={`text-${index}`}>{text.substring(lastIndex, h.startIndex)}</span>);
      }

      // Add highlighted text
      elements.push(
        <mark 
          key={h.id} 
          style={{ backgroundColor: h.color, transition: 'background 0.3s' }}
          className="relative group cursor-pointer rounded-sm"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Deseja remover este marcador?')) {
              onDeleteHighlight?.(h.id);
            }
          }}
        >
          {text.substring(h.startIndex, h.endIndex)}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-white text-[8px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Remover Marcador
          </span>
        </mark>
      );
      lastIndex = h.endIndex;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(<span key="text-end">{text.substring(lastIndex)}</span>);
    }

    return elements;
  };

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

    // Clear selection on scroll to avoid floating toolbar issues
    if (selection) {
      setSelection(null);
      window.getSelection()?.removeAllRanges();
    }
    
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
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 z-[110] bg-black/5">
        <motion.div 
          initial={false}
          animate={{ width: `${progress * 100}%` }}
          className={cn("h-full transition-colors duration-500", currentTheme.progress)}
        />
      </div>

      {/* Top Bar Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className={cn(
              "absolute top-0 inset-x-0 h-16 md:h-20 border-b flex items-center justify-between px-4 md:px-8 z-10 backdrop-blur-md",
              currentTheme.ui
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 md:gap-4">
              <button 
                onClick={onClose}
                className="p-3 hover:bg-black/5 rounded-full transition-colors active:scale-95"
                title="Sair da Leitura"
              >
                <X size={24} />
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

      {/* Selection Toolbar */}
      <AnimatePresence>
        {selection && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="fixed z-[200] flex bg-white rounded-2xl shadow-2xl p-1.5 border border-slate-100 items-center gap-1 scroll-none"
            style={{ 
              left: Math.max(160, Math.min(window.innerWidth - 160, selection.x)), 
              top: Math.max(80, selection.y - 60),
              transform: 'translateX(-50%)' 
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()} // Stop it from clearing selection
          >
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[60vw]">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    addHighlight(color.value);
                  }}
                  className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-xl transition-all hover:scale-110 active:scale-95 shadow-sm border border-black/5 shrink-0",
                    color.bg
                  )}
                  title={color.name}
                />
              ))}
            </div>
            <div className="w-px h-6 bg-slate-100 mx-1" />
            <button 
              onClick={(e) => {
                e.stopPropagation();
                const text = selection.text;
                navigator.clipboard.writeText(text);
                setSelection(null);
                window.getSelection()?.removeAllRanges();
              }}
              className="px-3 sm:px-4 h-8 sm:h-10 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Copiar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 md:px-6 py-20 md:py-40 scroll-smooth selection:bg-orange-200"
      >
        <div 
          className={cn(
            "max-w-3xl mx-auto transition-all duration-300 break-words hyphens-auto",
            fonts[fontFace],
            textAlign === 'left' ? 'text-left' : 'text-justify',
            currentTheme.text
          )}
          style={{ 
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight
          }}
        >
          <div className="mb-16 md:mb-24 text-center opacity-50 px-4">
            <BookOpen size={48} className="md:size-16 mx-auto mb-4 md:mb-6 text-orange-500/50" />
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter leading-tight">{resource.title}</h1>
            <p className="text-[10px] md:text-xs mt-3 md:mt-4 font-bold uppercase tracking-[0.2em]">Recurso Pastoral</p>
          </div>
          
          <div 
            ref={contentRef}
            className="whitespace-pre-wrap select-text selection:bg-orange-200 selection:text-orange-950 px-2 sm:px-0"
          >
            {renderContent()}
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
            className="absolute bottom-6 md:bottom-8 inset-x-0 flex justify-center z-10 px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={cn(
              "flex flex-col md:flex-row items-center gap-3 md:gap-8 px-4 md:px-6 py-3 md:py-4 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border backdrop-blur-2xl transition-colors duration-500 w-full max-w-lg md:max-w-none",
              currentTheme.ui
            )}>
              {/* Font Family */}
              <div className="flex bg-black/5 p-1 rounded-2xl w-full md:w-auto">
                <button 
                  onClick={() => setFontFace('serif')}
                  className={cn("flex-1 md:flex-none px-3 md:px-4 py-1.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all text-center", fontFace === 'serif' ? (currentTheme.accent + " shadow-sm") : "opacity-50")}
                >
                  Serif
                </button>
                <button 
                  onClick={() => setFontFace('sans')}
                  className={cn("flex-1 md:flex-none px-3 md:px-4 py-1.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all text-center", fontFace === 'sans' ? (currentTheme.accent + " shadow-sm") : "opacity-50")}
                >
                  Sans
                </button>
              </div>

              <div className="hidden md:flex bg-black/5 p-1 rounded-2xl">
                <button 
                  onClick={() => setTextAlign('left')}
                  className={cn("px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", textAlign === 'left' ? (currentTheme.accent + " shadow-sm") : "opacity-50")}
                >
                  Esquerda
                </button>
                <button 
                  onClick={() => setTextAlign('justify')}
                  className={cn("px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", textAlign === 'justify' ? (currentTheme.accent + " shadow-sm") : "opacity-50")}
                >
                  Justificar
                </button>
              </div>

              <div className="hidden md:block w-px h-8 bg-black/10" />

              <div className="flex items-center justify-center gap-6 md:gap-8 w-full md:w-auto">
                {/* Font Size */}
                <div className="flex items-center gap-2 md:gap-3">
                  <button 
                    onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                    className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors border border-black/5"
                  >
                    <Minus size={12} />
                  </button>
                  <div className="flex flex-col items-center min-w-[32px] md:min-w-[40px]">
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-tighter opacity-40">Fonte</span>
                    <span className="text-[10px] md:text-xs font-black">{fontSize}</span>
                  </div>
                  <button 
                    onClick={() => setFontSize(Math.min(48, fontSize + 2))}
                    className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors border border-black/5"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <div className="w-px h-6 bg-black/10" />

                {/* Line Height */}
                <div className="flex items-center gap-2 md:gap-3">
                  <button 
                    onClick={() => setLineHeight(Math.max(1.2, lineHeight - 0.1))}
                    className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors border border-black/5"
                  >
                    <Minus size={12} />
                  </button>
                  <div className="flex flex-col items-center min-w-[32px] md:min-w-[40px]">
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-tighter opacity-40">Espaço</span>
                    <span className="text-[10px] md:text-xs font-black">{lineHeight.toFixed(1)}</span>
                  </div>
                  <button 
                    onClick={() => setLineHeight(Math.min(2.4, lineHeight + 0.1))}
                    className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors border border-black/5"
                  >
                    <Plus size={12} />
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
