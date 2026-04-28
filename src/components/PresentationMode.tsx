import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  X,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Sermon } from '../types';

interface PresentationModeProps {
  sermon: Sermon;
  onClose: () => void;
}

export default function PresentationMode({ sermon, onClose }: PresentationModeProps) {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [fontSize, setFontSize] = useState(24);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs > 0 ? hrs.toString().padStart(2, '0') + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white z-50 flex flex-col font-sans"
    >
      {/* Header / Controls */}
      <div className="min-h-20 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between px-4 md:px-8 py-4 md:py-0 bg-slate-50/50 backdrop-blur-sm sticky top-0 z-10 gap-4">
        <div className="flex items-center gap-3 md:gap-6 w-full md:w-auto">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors"
          >
            <X size={20} className="md:w-6 md:h-6" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm md:text-lg font-bold text-slate-800 line-clamp-1">{sermon.title}</h2>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Modo de Apresentação</p>
          </div>
        </div>

        {/* Chronometer */}
        <div className="flex items-center gap-3 md:gap-4 bg-white border border-slate-200 px-4 md:px-6 py-2 rounded-2xl shadow-sm w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <Clock size={18} className={isActive ? 'text-orange-500 animate-pulse' : 'text-slate-400'} />
            <span className="text-xl md:text-2xl font-mono font-bold text-slate-700 w-20 md:w-24 text-center">
              {formatTime(seconds)}
            </span>
          </div>
          <div className="flex items-center gap-2 border-l border-slate-100 ml-1 pl-3 md:ml-2 md:pl-4">
            <button 
              onClick={() => setIsActive(!isActive)}
              className={`p-1.5 md:p-2 rounded-lg transition-all ${isActive ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}
            >
              {isActive ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            </button>
            <button 
              onClick={() => { setSeconds(0); setIsActive(false); }}
              className="p-1.5 md:p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-2xl shadow-sm">
             <button 
              onClick={() => setFontSize(Math.max(12, fontSize - 4))}
              className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl text-slate-600 transition-all font-black text-lg active:scale-90"
              title="Diminuir Fonte"
            >
              A-
            </button>
            <div className="w-px h-6 bg-slate-100" />
            <span className="min-w-[40px] text-center text-xs font-black text-slate-400 tabular-nums">{fontSize}</span>
            <div className="w-px h-6 bg-slate-100" />
            <button 
              onClick={() => setFontSize(Math.min(80, fontSize + 4))}
              className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl text-slate-600 transition-all font-black text-lg active:scale-90"
              title="Aumentar Fonte"
            >
              A+
            </button>
          </div>
          <button 
            onClick={toggleFullscreen}
            className="p-3 hover:bg-slate-200 rounded-2xl text-slate-500 transition-colors bg-white border border-slate-200 shadow-sm active:scale-90"
          >
            {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 md:py-12 scroll-smooth bg-white">
        <div 
          className="max-w-4xl mx-auto prose prose-slate prose-orange presentation-content"
          style={{ 
            fontSize: `${fontSize}px`, 
            lineHeight: '1.6',
            ['--tw-prose-body' as any]: 'inherit',
            ['--tw-prose-headings' as any]: 'inherit'
          } as React.CSSProperties}
        >
          <div 
            dangerouslySetInnerHTML={{ __html: sermon.content }}
            className="presentation-inner"
            style={{ fontSize: 'inherit' }}
          />
        </div>
      </div>

      {/* Footer / Navigation Hint */}
      <div className="h-12 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <span>Role para ler</span>
        <div className="flex items-center gap-2">
          <ChevronLeft size={14} />
          <ChevronRight size={14} />
        </div>
        <span>Use o cronômetro para controlar o tempo</span>
      </div>
    </motion.div>
  );
}
