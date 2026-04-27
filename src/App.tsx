import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Save, 
  History, 
  Layout, 
  Sparkles, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Presentation,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Editor from './components/Editor';
import BibleSearch from './components/BibleSearch';
import { Sermon } from './types';
import { cn, formatDate } from './lib/utils';
import { generateSermonOutline, analyzeVerse, generateSlideDescriptions } from './lib/gemini';

export default function App() {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [currentSermonId, setCurrentSermonId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isBibleSearchOpen, setIsBibleSearchOpen] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // Load sermons from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sermon-craft-sermons');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSermons(parsed);
        if (parsed.length > 0) {
          setCurrentSermonId(parsed[0].id);
        }
      } catch (e) {
        console.error('Failed to parse sermons', e);
      }
    }
  }, []);

  // Save sermons to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('sermon-craft-sermons', JSON.stringify(sermons));
  }, [sermons]);

  const currentSermon = sermons.find(s => s.id === currentSermonId);

  const createNewSermon = () => {
    const newSermon: Sermon = {
      id: crypto.randomUUID(),
      title: 'Novo Sermão',
      content: '<h1>Título do Sermão</h1><p>Comece aqui seu rascunho ou use o botão <strong>Gerar Esboço com IA</strong> acima para estruturar sua mensagem.</p>',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSermons([newSermon, ...sermons]);
    setCurrentSermonId(newSermon.id);
  };

  const updateSermon = (content: string) => {
    if (!currentSermonId) return;
    
    // Extract title from content if possible
    const titleMatch = content.match(/<h1>(.*?)<\/h1>/);
    const newTitle = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : 'Sermão sem título';

    setSermons(prev => prev.map(s => 
      s.id === currentSermonId 
        ? { ...s, content, title: newTitle, updatedAt: Date.now() } 
        : s
    ));
  };

  const deleteSermon = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este sermão?')) {
      const filtered = sermons.filter(s => s.id !== id);
      setSermons(filtered);
      if (currentSermonId === id) {
        setCurrentSermonId(filtered.length > 0 ? filtered[0].id : null);
      }
    }
  };

  const handleAiAction = async (action: string, text: string) => {
    setIsAiLoading(true);
    setAiResponse(null);
    try {
      let result = '';
      if (action === 'expand') {
        result = await generateSermonOutline(text);
      } else if (action === 'context') {
        result = await analyzeVerse(text, ''); // Text is the reference here
      } else if (action === 'slides') {
        result = await generateSlideDescriptions(currentSermon?.content || '');
      }
      setAiResponse(result);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Verifique sua conexão e tente novamente.';
      alert(`Erro ao processar com IA: ${errorMessage}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const addVerseToEditor = (verseText: string, reference: string) => {
    if (currentSermon) {
      const newContent = currentSermon.content + `<blockquote><p>${verseText}</p><cite>— ${reference}</cite></blockquote><p></p>`;
      updateSermon(newContent);
    }
  };

  const handleGenerateOutlineFromTheme = async () => {
    const theme = prompt('Qual o tema ou versículo base para o seu sermão?');
    if (!theme) return;

    setIsAiLoading(true);
    setAiResponse(null);
    try {
      const outline = await generateSermonOutline(theme);
      if (outline) {
        setAiResponse(outline);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar esboço: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* List Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="flex flex-col bg-white border-right border-slate-200 shrink-0 relative overflow-hidden"
      >
        <div className="p-6 border-bottom border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <h1 className="font-bold text-slate-800 tracking-tight">SermonCraft</h1>
          </div>
        </div>

        <div className="p-4">
          <button 
            onClick={createNewSermon}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-all shadow-sm group"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            Novo Sermão
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {sermons.length === 0 ? (
            <div className="text-center py-12 px-6">
              <FileText size={40} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Nenhum sermão salvo ainda.</p>
            </div>
          ) : (
            sermons.map(s => (
              <button
                key={s.id}
                onClick={() => setCurrentSermonId(s.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-all group relative",
                  currentSermonId === s.id ? "bg-orange-50 text-orange-900" : "hover:bg-slate-100 text-slate-700"
                )}
              >
                <div className="text-sm font-bold truncate pr-6 group-hover:text-orange-600 transition-colors">{s.title || 'Sermão sem título'}</div>
                <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-1.5 uppercase font-black tracking-widest">
                  <History size={10} />
                  {formatDate(s.updatedAt)}
                </div>
                <button 
                  onClick={(e) => deleteSermon(e, s.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 hover:text-red-600 rounded-md transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </button>
            ))
          )}
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        {/* Top Navbar */}
        <header className="h-14 border-bottom border-slate-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <Layout size={20} />
            </button>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-2">
              <button 
                onClick={handleGenerateOutlineFromTheme}
                className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 text-xs font-semibold rounded-full border border-orange-100 hover:bg-orange-100 transition-colors"
              >
                <Sparkles size={14} />
                Gerar Esboço com IA
              </button>
              <button 
                onClick={() => handleAiAction('slides', '')}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-700 text-xs font-semibold rounded-full border border-slate-100 hover:bg-slate-100 transition-colors"
              >
                <Presentation size={14} />
                Gerar Slides
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {isAiLoading && (
               <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                 <Loader2 size={12} className="animate-spin text-orange-500" />
                 Pensando...
               </div>
             )}
             <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-tighter bg-slate-50 px-2 py-1 rounded border border-slate-100">
               <Save size={10} />
               Salvo Localmente
             </div>
             <button 
              onClick={() => setIsBibleSearchOpen(!isBibleSearchOpen)}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                isBibleSearchOpen ? "bg-slate-900 text-white shadow-md shadow-slate-200" : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
              )}
            >
              <BookOpen size={14} />
              Pesquisa Bíblica
            </button>
          </div>
        </header>

        {/* Editor Body */}
        <div className="flex-1 overflow-y-auto px-4 py-8 md:px-12 lg:px-24">
          <div className="max-w-4xl mx-auto">
            {currentSermon ? (
              <Editor 
                content={currentSermon.content} 
                onChange={updateSermon} 
                onAiAction={handleAiAction}
              />
            ) : (
              <div className="h-[70vh] flex flex-col items-center justify-center text-slate-400 space-y-4">
                <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner">
                  <FileText size={32} className="text-slate-300" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Selecione um sermão para editar</p>
                  <p className="text-xs">Ou clique no botão "+" para criar um novo.</p>
                </div>
                <button 
                  onClick={createNewSermon}
                  className="mt-4 px-6 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-100 active:scale-95"
                >
                  Começar Agora
                </button>
              </div>
            )}
          </div>
        </div>

        {/* AI Response Panel (Slide-up) */}
        <AnimatePresence>
          {aiResponse && (
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="absolute bottom-4 left-4 right-4 max-h-[60vh] bg-white border border-slate-200 shadow-2xl rounded-2xl z-30 flex flex-col overflow-hidden"
            >
              <div className="p-4 border-bottom border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-orange-500" />
                  <span className="text-sm font-bold text-slate-800">Sugestão da IA</span>
                </div>
                <button 
                  onClick={() => setAiResponse(null)}
                  className="p-1 hover:bg-slate-200 rounded-md transition-colors"
                >
                  <ChevronRight size={20} className="rotate-90" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 prose prose-sm max-w-none prose-slate">
                <div dangerouslySetInnerHTML={{ __html: aiResponse.replace(/\n/g, '<br/>') }} />
              </div>
              <div className="p-4 border-top border-slate-100 bg-slate-50 flex justify-end">
                 <button 
                  onClick={() => {
                    const newContent = (currentSermon?.content || '') + `<hr/><div class="ai-suggestion">${aiResponse.replace(/\n/g, '<br/>')}</div>`;
                    updateSermon(newContent);
                    setAiResponse(null);
                  }}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors shadow-sm"
                >
                  Adicionar ao Sermão
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bible Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isBibleSearchOpen ? 320 : 0, opacity: isBibleSearchOpen ? 1 : 0 }}
        className="flex bg-white overflow-hidden"
      >
        <BibleSearch onAddVerse={addVerseToEditor} />
      </motion.aside>
    </div>
  );
}
