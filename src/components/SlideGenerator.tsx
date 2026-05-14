import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Trash2, 
  Plus, 
  RefreshCcw, 
  Presentation, 
  Layout, 
  Type, 
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Sermon, UserProfile, Resource, Series, Slide } from '../types';
import { cn, formatDate, parseSlides } from '../lib/utils';
import { generatePowerPoint } from '../lib/pptx';

interface SlideGeneratorProps {
  initialSlides: Slide[];
  sermonTitle: string;
  onClose: () => void;
  onRegenerate: () => void;
  onImproveSlide: (slide: Slide, type: 'simplify' | 'topics' | 'verse') => Promise<Slide>;
}

export default function SlideGenerator({ initialSlides, sermonTitle, onClose, onRegenerate, onImproveSlide }: SlideGeneratorProps) {
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [theme, setTheme] = useState<'modern' | 'classic' | 'minimal'>('modern');

  const currentSlide = slides[currentSlideIndex];

  const handleGenerateAllImages = async () => {
    setIsGeneratingAll(true);
    
    try {
      const newSlides = [...slides];
      for (let i = 0; i < newSlides.length; i++) {
        const slide = newSlides[i];
        if (slide.imageUrl) continue; // Pula os que já tem imagem

        const promptText = slide.imageDescription || slide.title;
        if (!promptText) continue;

        // Melhora o prompt adicionando termos técnicos em inglês para melhor resultado na IA
        const enhancedPrompt = encodeURIComponent(`${promptText}, christian church aesthetic, worship atmosphere, cinematic lighting, soft focus background, high quality 4k --ar 16:9`);
        const imageUrl = `https://image.pollinations.ai/prompt/${enhancedPrompt}?width=1280&height=720&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
        
        newSlides[i] = { ...slide, imageUrl };
        setSlides([...newSlides]);
        // Pequena pausa para não sobrecarregar a rede
        await new Promise(r => setTimeout(r, 800));
      }
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const handleGenerateImage = async () => {
    const slideToUpdate = currentSlide;
    const promptText = slideToUpdate.imageDescription || slideToUpdate.title;
    if (!promptText) return;

    setIsGeneratingImage(true);
    
    try {
      const enhancedPrompt = encodeURIComponent(`${promptText}, christian church aesthetic, worship atmosphere, cinematic lighting, soft focus background, high quality 4k`);
      const imageUrl = `https://image.pollinations.ai/prompt/${enhancedPrompt}?width=1280&height=720&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
      
      updateSlide(slideToUpdate.id, { imageUrl });
      // Força um pequeno delay para a UI respirar
      await new Promise(r => setTimeout(r, 500));
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleImprove = async (type: 'simplify' | 'topics' | 'verse') => {
    setIsImproving(true);
    try {
      const improved = await onImproveSlide(currentSlide, type);
      updateSlide(currentSlide.id, improved);
    } catch (err) {
      console.error(err);
    } finally {
      setIsImproving(false);
    }
  };

  const updateSlide = (id: string, updates: Partial<Slide>) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSlide = (id: string) => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter(s => s.id !== id);
    setSlides(newSlides);
    if (currentSlideIndex >= newSlides.length) {
      setCurrentSlideIndex(newSlides.length - 1);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await generatePowerPoint(sermonTitle, slides);
    } catch (error) {
      console.error(error);
      alert('Erro ao exportar PowerPoint.');
    } finally {
      setIsExporting(false);
    }
  };

  if (slides.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 lg:p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-6xl h-full lg:max-h-[85vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-slate-200"
      >
        {/* Header */}
        <div className="bg-white border-b border-slate-100 p-4 lg:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-100">
              <Presentation size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Gerador de Slides IA</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sermonTitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleGenerateAllImages}
              disabled={isGeneratingAll}
              className="flex items-center gap-2 px-4 py-2 text-orange-600 font-bold text-xs hover:bg-orange-50 rounded-xl transition-all disabled:opacity-50"
            >
              <Sparkles size={16} className={cn(isGeneratingAll && "animate-spin")} />
              {isGeneratingAll ? 'Gerando Tudo...' : 'Gerar Todas Imagens'}
            </button>
            <button 
              onClick={onRegenerate}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 font-bold text-xs hover:bg-slate-50 rounded-xl transition-all"
            >
              <RefreshCcw size={16} />
              Refazer Tudo
            </button>
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-orange-100 hover:bg-orange-700 transition-all disabled:opacity-50"
            >
              {isExporting ? <RefreshCcw className="animate-spin" size={18} /> : <Download size={18} />}
              Exportar PPTX
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all ml-2"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Slide List */}
          <div className="w-64 border-r border-slate-100 bg-slate-50/50 overflow-y-auto p-4 hidden md:flex flex-col gap-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-2">Estrutura</h3>
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                onClick={() => setCurrentSlideIndex(index)}
                className={cn(
                  "group relative w-full aspect-video rounded-xl border-2 p-2 text-left transition-all overflow-hidden cursor-pointer",
                  currentSlideIndex === index 
                    ? "bg-white border-orange-500 shadow-md scale-102" 
                    : "bg-white/50 border-slate-200 hover:border-slate-300"
                )}
              >
                <div className="text-[8px] font-bold text-slate-400 mb-1">Slide {index + 1}</div>
                <div className="text-[10px] font-black text-slate-700 leading-tight line-clamp-2 relative z-10">{slide.title}</div>
                
                {slide.imageUrl && (
                  <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                    <img src={slide.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSlide(slide.id);
                  }}
                  className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 bg-white shadow-sm text-red-500 rounded-md hover:bg-red-50 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-orange-500 hover:border-orange-200 transition-all flex flex-col items-center justify-center gap-1 group">
               <Plus size={20} className="group-hover:scale-110 transition-transform" />
               <span className="text-[10px] font-black uppercase tracking-widest">Novo Slide</span>
            </button>
          </div>

          {/* Main Editor */}
          <div className="flex-1 flex flex-col bg-slate-100/50 p-4 lg:p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
              
              {/* Theme Selector */}
              <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 self-start shadow-sm">
                <button 
                  onClick={() => setTheme('modern')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                    theme === 'modern' ? "bg-orange-600 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <Sparkles size={14} />
                  Moderno
                </button>
                <button 
                  onClick={() => setTheme('classic')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                    theme === 'classic' ? "bg-orange-600 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <Layout size={14} />
                  Clássico
                </button>
                <button 
                  onClick={() => setTheme('minimal')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                    theme === 'minimal' ? "bg-orange-600 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <Type size={14} />
                  Minimalista
                </button>
              </div>

              {/* Slide Canvas */}
              <div className="relative group">
                <div 
                  className={cn(
                    "w-full aspect-video bg-white shadow-2xl rounded-2xl overflow-hidden border-8 border-white flex flex-col transition-all duration-500 relative",
                    theme === 'modern' && "bg-gradient-to-br from-white to-slate-50",
                    theme === 'classic' && "bg-slate-50",
                  )}
                >
                  {/* Background Image */}
                  {currentSlide.imageUrl && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.85 }}
                      className="absolute inset-0 z-0 scale-105"
                    >
                      <img 
                        src={currentSlide.imageUrl} 
                        key={currentSlide.imageUrl}
                        alt="Background" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/70" />
                    </motion.div>
                  )}

                  {isGeneratingImage && (
                    <div className="absolute inset-0 z-20 bg-white/40 backdrop-blur-md flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                         <RefreshCcw className="animate-spin text-orange-600" size={40} />
                         <span className="text-orange-600 font-black text-xs uppercase tracking-[0.2em] animate-pulse">Gerando Visual Premium...</span>
                      </div>
                    </div>
                  )}

                  {/* Visual Background Hint */}
                  {!currentSlide.imageUrl && currentSlide.imageDescription && (
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center p-12">
                       <ImageIcon size={200} className="text-slate-900" />
                    </div>
                  )}

                  <div className={cn(
                    "p-12 lg:p-20 flex-1 flex flex-col justify-center gap-8 relative z-10 transition-all duration-300",
                    currentSlide.imageUrl && "backdrop-blur-[1px]"
                  )}>
                    <input 
                      type="text"
                      value={currentSlide.title}
                      onChange={(e) => updateSlide(currentSlide.id, { title: e.target.value })}
                      className={cn(
                        "bg-transparent border-none focus:outline-none focus:ring-0 w-full text-3xl lg:text-5xl font-black transition-all",
                        currentSlide.imageUrl ? "text-white drop-shadow-lg" : (theme === 'modern' ? "text-orange-600 text-center" : "text-slate-900"),
                        theme === 'minimal' && "text-center tracking-tighter"
                      )}
                      placeholder="Título do Slide"
                    />
                    
                    <textarea 
                      value={currentSlide.content}
                      onChange={(e) => updateSlide(currentSlide.id, { content: e.target.value })}
                      className={cn(
                        "bg-transparent border-none focus:outline-none focus:ring-0 w-full flex-1 resize-none text-xl lg:text-2xl leading-relaxed transition-all",
                        currentSlide.imageUrl ? "text-white/90 drop-shadow-md" : (theme === 'modern' ? "text-slate-600 text-center" : "text-slate-700"),
                        theme === 'minimal' && "text-center text-slate-500"
                      )}
                      placeholder="Conteúdo do Slide (use tópicos)"
                      rows={6}
                    />
                  </div>

                  {/* Decorative bar */}
                  {theme === 'modern' && <div className="h-3 w-full bg-orange-600" />}
                </div>

                {/* Internal Navigation */}
                <button 
                  onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentSlideIndex === 0}
                  className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-12 h-12 bg-white shadow-xl rounded-full flex items-center justify-center text-slate-400 hover:text-orange-500 transition-all disabled:opacity-0 active:scale-90"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={() => setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
                  disabled={currentSlideIndex === slides.length - 1}
                  className="absolute right-[-20px] top-1/2 -translate-y-1/2 w-12 h-12 bg-white shadow-xl rounded-full flex items-center justify-center text-slate-400 hover:text-orange-500 transition-all disabled:opacity-0 active:scale-90"
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              {/* Bottom Details/Prompting */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <ImageIcon size={14} className="text-orange-500" />
                      Sugestão de Visual IA
                    </div>
                    {(currentSlide.imageDescription || currentSlide.title) && (
                      <button 
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage}
                        className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
                      >
                        {isGeneratingImage ? <RefreshCcw size={10} className="animate-spin" /> : <Sparkles size={10} />}
                        {currentSlide.imageUrl ? 'Trocar Imagem' : 'Gerar com IA'}
                      </button>
                    ) }
                  </div>
                  <div className="flex gap-4 items-start">
                    {currentSlide.imageUrl ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 relative group">
                        <img 
                          src={currentSlide.imageUrl} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            // Se a imagem falhar, podemos tentar recarregar ou mostrar erro
                            (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f1f5f9/64748b?text=Sem+Visual';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center shrink-0">
                        <ImageIcon size={20} className="text-slate-300" />
                      </div>
                    )}
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      "{currentSlide.imageDescription || 'A IA não sugeriu uma imagem específica para este slide.'}"
                    </p>
                  </div>
                </div>

                <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-orange-400 uppercase tracking-widest">
                    <Sparkles size={14} className={cn("text-orange-600", isImproving && "animate-pulse")} />
                    Melhorar com IA
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      disabled={isImproving}
                      onClick={() => handleImprove('topics')}
                      className="px-3 py-1.5 bg-white border border-orange-100 rounded-lg text-[10px] font-bold text-orange-600 hover:bg-orange-100 transition-all disabled:opacity-50"
                    >
                      Fixar Tópicos
                    </button>
                    <button 
                      disabled={isImproving}
                      onClick={() => handleImprove('verse')}
                      className="px-3 py-1.5 bg-white border border-orange-100 rounded-lg text-[10px] font-bold text-orange-600 hover:bg-orange-100 transition-all disabled:opacity-50"
                    >
                      Adicionar Referência
                    </button>
                    <button 
                      disabled={isImproving}
                      onClick={() => handleImprove('simplify')}
                      className="px-3 py-1.5 bg-white border border-orange-100 rounded-lg text-[10px] font-bold text-orange-600 hover:bg-orange-100 transition-all disabled:opacity-50"
                    >
                      Simplificar Texto
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer for Mobile Navigation */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 md:hidden flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Slide {currentSlideIndex + 1} de {slides.length}</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                className="p-2 bg-white rounded-lg border border-slate-200"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                 onClick={() => setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
                 className="p-2 bg-white rounded-lg border border-slate-200"
              >
                <ChevronRight size={20} />
              </button>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
