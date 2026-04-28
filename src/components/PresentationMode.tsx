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
      <div className="h-20 border-b border-slate-100 flex items-center justify-between px-8 bg-slate-50/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors"
          >
            <X size={24} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800 line-clamp-1">{sermon.title}</h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Modo de Apresentação</p>
          </div>
        </div>

        {/* Chronometer */}
        <div className="flex items-center gap-4 bg-white border border-slate-200 px-6 py-2.5 rounded-2xl shadow-sm">
          <Clock size={20} className={isActive ? 'text-orange-500 animate-pulse' : 'text-slate-400'} />
          <span className="text-2xl font-mono font-bold text-slate-700 w-24 text-center">
            {formatTime(seconds)}
          </span>
          <div className="flex items-center gap-2 border-l border-slate-100 ml-2 pl-4">
            <button 
              onClick={() => setIsActive(!isActive)}
              className={`p-2 rounded-lg transition-all ${isActive ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}
            >
              {isActive ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>
            <button 
              onClick={() => { setSeconds(0); setIsActive(false); }}
              className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
             <button 
              onClick={() => setFontSize(Math.max(16, fontSize - 2))}
              className="p-2 hover:bg-white rounded-lg text-slate-600 transition-all font-bold"
            >
              A-
            </button>
            <span className="px-2 text-xs font-bold text-slate-400">{fontSize}px</span>
            <button 
              onClick={() => setFontSize(Math.min(48, fontSize + 2))}
              className="p-2 hover:bg-white rounded-lg text-slate-600 transition-all font-bold"
            >
              A+
            </button>
          </div>
          <button 
            onClick={toggleFullscreen}
            className="p-2.5 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-12 scroll-smooth bg-white">
        <div 
          className="max-w-4xl mx-auto prose prose-slate prose-orange presentation-content"
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: sermon.content }}
        />
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
