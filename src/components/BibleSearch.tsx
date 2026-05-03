import React, { useState, useEffect } from 'react';
import { Search, Book, ArrowRight, Loader2, Plus, ChevronLeft, ChevronRight, List, X, ChevronDown } from 'lucide-react';
import { BibleResponse } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { ALL_BOOKS, OLD_TESTAMENT, NEW_TESTAMENT, BibleBook } from '@/src/constants/bible';

interface BibleSearchProps {
  onAddVerse: (verseText: string, reference: string) => void;
}

type Tab = 'search' | 'browse';
type BrowseLevel = 'books' | 'chapters' | 'verses';

export default function BibleSearch({ onAddVerse }: BibleSearchProps) {
  const [activeTab, setActiveTab] = useState<Tab>('browse');
  const [browseLevel, setBrowseLevel] = useState<BrowseLevel>('books');
  const [testament, setTestament] = useState<'old' | 'new'>('old');
  const [query, setQuery] = useState('');
  const [bookFilter, setBookFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BibleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Navigation State
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);

  const VERSION = 'NVIPT'; // Bolls Life NVI Portuguese

  // Scroll to top when browse level changes
  useEffect(() => {
    const container = document.getElementById('bible-content-area');
    if (container) container.scrollTo({ top: 0, behavior: 'auto' });
  }, [browseLevel, activeTab, testament]);

  const loadChapter = async (book: BibleBook, chapter: number) => {
    setLoading(true);
    setError(null);
    try {
      // Bolls Life API: get-chapter/{translation}/{book_id}/{chapter}/
      const res = await fetch(`https://bolls.life/get-chapter/${VERSION}/${book.id}/${chapter}/`, {
        mode: 'cors',
        referrerPolicy: 'no-referrer'
      });
      
      if (!res.ok) {
        throw new Error('Não foi possível carregar este capítulo.');
      }
      
      const data = await res.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Formato de resposta inválido.');
      }
      
      // Adapt Bolls Life response to current BibleResponse type
      const adaptedResult: BibleResponse = {
        reference: `${book.name} ${chapter}`,
        verses: data.map((v: any) => ({
          book_name: book.name,
          chapter: chapter,
          verse: v.verse,
          text: v.text
        })),
        text: data.map((v: any) => v.text).join(' '),
        translation_id: VERSION,
        translation_name: 'NVI',
        translation_note: ''
      };
      
      setResult(adaptedResult);
      setBrowseLevel('verses');
      
      const container = document.getElementById('bible-content-area');
      if (container) container.scrollTo({ top: 0, behavior: 'auto' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar Bíblia');
    } finally {
      setLoading(false);
    }
  };

  const searchBible = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query || query.trim().length < 3) return;

    setLoading(true);
    setError(null);
    try {
      const q = query.trim();
      
      // 1. Try to detect if it's just a book name
      const bookOnly = ALL_BOOKS.find(b => 
        b.name.toLowerCase() === q.toLowerCase() || 
        b.abbrev.toLowerCase() === q.toLowerCase() ||
        b.key.toLowerCase() === q.toLowerCase()
      );
      
      if (bookOnly) {
        handleBookClick(bookOnly);
        setActiveTab('browse');
        setLoading(false);
        return;
      }

      // 2. Try to detect if it's a reference (e.g. "John 3:16" or "Joao 3")
      const refMatch = q.match(/^([1-3]?\s?[a-zA-ZáéíóúÁÉÍÓÚçÇ]+)\s*(\d+)(?::(\d+))?$/i);
      
      if (refMatch) {
        const bookName = refMatch[1].trim();
        const chapter = parseInt(refMatch[2]);
        const verse = refMatch[3] ? parseInt(refMatch[3]) : null;

        const book = ALL_BOOKS.find(b => 
          b.name.toLowerCase() === bookName.toLowerCase() || 
          b.abbrev.toLowerCase() === bookName.toLowerCase() ||
          b.key.toLowerCase() === bookName.toLowerCase()
        );

        if (book) {
          if (verse) {
            try {
              const res = await fetch(`https://bolls.life/get-verse/${VERSION}/${book.id}/${chapter}/${verse}/`, {
                mode: 'cors',
                referrerPolicy: 'no-referrer'
              });
              if (res.ok) {
                const data = await res.json();
                const adaptedResult: BibleResponse = {
                  reference: `${book.name} ${chapter}:${verse}`,
                  verses: [{
                    book_name: book.name,
                    chapter: chapter,
                    verse: verse,
                    text: data.text
                  }],
                  text: data.text,
                  translation_id: VERSION,
                  translation_name: 'NVI',
                  translation_note: ''
                };
                setResult(adaptedResult);
                setActiveTab('search');
                setLoading(false);
                return;
              }
            } catch (e) {
              console.error("Verse fetch failed, falling back to keyword", e);
            }
          } else {
            setSelectedBook(book);
            setSelectedChapter(chapter);
            loadChapter(book, chapter);
            setActiveTab('browse');
            setLoading(false);
            return;
          }
        }
      }

      // 3. Keyword search
      // Note: Bolls.life search sometimes returns 403 if too many requests or specific referrers
      const res = await fetch(`https://bolls.life/search/${VERSION}/${encodeURIComponent(q)}/`, {
        mode: 'cors',
        referrerPolicy: 'no-referrer',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (res.status === 403) {
        throw new Error('Acesso negado pela API (403). Tente uma busca mais específica ou tente em instantes.');
      }

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Acesso negado (403). A API da Bíblia está temporariamente bloqueando a requisição. Tente navegar manualmente ou aguarde.');
        }
        throw new Error('Erro ao buscar. Tente novamente.');
      }

      const data = await res.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Nenhum resultado encontrado.');
      }

      const adaptedResult: BibleResponse = {
        reference: `Resultados para: "${query}"`,
        verses: data.slice(0, 50).map((v: any) => {
          const book = ALL_BOOKS.find(b => b.id === v.book);
          return {
            book_name: book ? book.name : `Livro ${v.book}`,
            chapter: v.chapter,
            verse: v.verse,
            text: v.text
          };
        }),
        text: '',
        translation_id: VERSION,
        translation_name: 'NVI',
        translation_note: ''
      };

      setResult(adaptedResult);
      setActiveTab('search');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na busca');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = (book: BibleBook) => {
    setSelectedBook(book);
    setBrowseLevel('chapters');
    const container = document.getElementById('bible-content-area');
    if (container) container.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleChapterClick = (chapter: number) => {
    if (!selectedBook) return;
    setSelectedChapter(chapter);
    loadChapter(selectedBook, chapter);
  };

  const goBack = () => {
    if (browseLevel === 'verses') {
      setBrowseLevel('chapters');
      setResult(null);
    } else if (browseLevel === 'chapters') {
      setBrowseLevel('books');
      setSelectedBook(null);
      setSelectedChapter(null);
    }
  };

  const nextChapter = () => {
    if (selectedBook && selectedChapter && selectedChapter < selectedBook.chapters) {
      handleChapterClick(selectedChapter + 1);
    }
  };

  const prevChapter = () => {
    if (selectedBook && selectedChapter && selectedChapter > 1) {
      handleChapterClick(selectedChapter - 1);
    }
  };

  const THEOLOGICAL_TERMS: Record<string, { color: string, note: string }> = {
    'graça': { color: 'text-orange-600 bg-orange-50 px-1 rounded', note: 'Favor imerecido de Deus.' },
    'fé': { color: 'text-blue-600 bg-blue-50 px-1 rounded', note: 'Certeza das coisas que se esperam.' },
    'justificação': { color: 'text-emerald-600 bg-emerald-50 px-1 rounded', note: 'Ato judicial de Deus declarando o pecador justo.' },
    'redenção': { color: 'text-purple-600 bg-purple-50 px-1 rounded', note: 'Libertação mediante o pagamento de um resgate.' },
    'santificação': { color: 'text-amber-600 bg-amber-50 px-1 rounded', note: 'Processo de ser tornado santo.' },
    'pecado': { color: 'text-red-600 bg-red-50 px-1 rounded', note: 'Errar o alvo; transgressão da lei de Deus.' },
    'salvação': { color: 'text-cyan-600 bg-cyan-50 px-1 rounded', note: 'Livramento do julgamento de Deus.' },
    'evangelho': { color: 'text-rose-600 bg-rose-50 px-1 rounded', note: 'Boas novas de Jesus Cristo.' },
    'messias': { color: 'text-indigo-600 bg-indigo-50 px-1 rounded', note: 'O Ungido de Deus.' }
  };

  const renderVerseText = (text: string) => {
    if (!text) return null;
    
    // Split by words but keep punctuation
    const words = text.split(/(\s+)/);
    
    return words.map((word, i) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:()]/g, '');
      const term = THEOLOGICAL_TERMS[cleanWord];
      
      if (term) {
        return (
          <span 
            key={i} 
            className={cn("cursor-help transition-all hover:scale-105 inline-block", term.color)}
            title={term.note}
          >
            {word}
          </span>
        );
      }
      return word;
    });
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-slate-50 relative overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white shrink-0 z-20">
        <button
          onClick={() => {
            setActiveTab('browse');
            setQuery('');
            setError(null);
          }}
          className={cn(
            "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2",
            activeTab === 'browse' ? "border-orange-500 text-orange-600 bg-orange-50/30" : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          Navegar
        </button>
        <button
          onClick={() => {
            setActiveTab('search');
            setBrowseLevel('books');
            setSelectedBook(null);
            setSelectedChapter(null);
            setResult(null);
            setError(null);
          }}
          className={cn(
            "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2",
            activeTab === 'search' ? "border-orange-500 text-orange-600 bg-orange-50/30" : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          Pesquisar
        </button>
      </div>

      {/* Dynamic Header */}
      <div className="bg-white border-b border-slate-100 shrink-0 z-10 shadow-sm">
        {activeTab === 'browse' ? (
          <div className="p-3">
            {browseLevel === 'books' ? (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar livro..."
                  value={bookFilter}
                  onChange={(e) => setBookFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <button 
                  onClick={goBack}
                  className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-orange-600 transition-colors uppercase"
                >
                  <ChevronLeft size={16} /> Voltar
                </button>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                    {browseLevel === 'chapters' ? 'Escolha o capítulo' : selectedBook?.name}
                  </span>
                  <span className="text-sm font-black text-slate-900 leading-none">
                    {browseLevel === 'chapters' ? selectedBook?.name : `Capítulo ${selectedChapter}`}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3">
            <form onSubmit={searchBible} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Ex: João 3:16 ou Amor"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 outline-none"
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <button 
                type="submit"
                className="bg-orange-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-orange-700 transition-colors shrink-0"
              >
                Buscar
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Main Scrollable Area */}
      <div id="bible-content-area" className="flex-1 overflow-y-auto bg-slate-50 scroll-smooth pb-40 bible-scrollbar overscroll-contain min-h-0 touch-pan-y">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 h-full">
            <Loader2 size={32} className="animate-spin mb-4 text-orange-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-center">Sondando as Escrituras...</p>
          </div>
        ) : error ? (
          <div className="p-6 flex flex-col items-center justify-center h-full">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 text-xs text-center font-medium shadow-sm w-full mb-4">
              {error}
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-[10px] font-black text-orange-600 bg-orange-50 px-4 py-2 rounded-full uppercase tracking-widest border border-orange-100"
            >
              Tentar Novamente
            </button>
          </div>
        ) : activeTab === 'browse' ? (
          <div className="p-3">
            {browseLevel === 'books' && (
              <div className="space-y-4">
                {/* Testament Switcher */}
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-4">
                  <button
                    onClick={() => setTestament('old')}
                    className={cn(
                      "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                      testament === 'old' ? "bg-white text-orange-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Antigo
                  </button>
                  <button
                    onClick={() => setTestament('new')}
                    className={cn(
                      "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                      testament === 'new' ? "bg-white text-orange-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Novo
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {(testament === 'old' ? OLD_TESTAMENT : NEW_TESTAMENT)
                    .filter(b => b.name.toLowerCase().includes(bookFilter.toLowerCase()))
                    .map(book => (
                      <button
                        key={book.key}
                        onClick={() => handleBookClick(book)}
                        className="flex flex-col items-center justify-center p-2 h-20 text-[10px] font-bold bg-white rounded-xl border border-slate-100 shadow-sm hover:border-orange-300 hover:shadow-orange-100/30 transition-all active:scale-95 text-center leading-tight gap-1 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-orange-500 group-hover:bg-orange-50 transition-colors">
                          <Book size={14} />
                        </div>
                        <span className="truncate w-full px-1">{book.name}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {browseLevel === 'chapters' && selectedBook && (
              <div className="grid grid-cols-5 gap-2 pb-10 animate-in fade-in slide-in-from-right-4 duration-300">
                {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(chap => (
                  <button
                    key={chap}
                    onClick={() => handleChapterClick(chap)}
                    className="aspect-square flex items-center justify-center text-sm font-black bg-white rounded-xl border border-slate-100 shadow-sm hover:border-orange-300 hover:text-orange-600 transition-all active:scale-95"
                  >
                    {chap}
                  </button>
                ))}
              </div>
            ) }

            {browseLevel === 'verses' && result && (
              <div className="space-y-4 pb-20 animate-in fade-in slide-in-from-right-4 duration-300">
                {result.verses.map((v, idx) => (
                  <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:border-orange-300 transition-all group">
                    <div className="flex gap-4">
                      <span className="text-[10px] font-black text-orange-400 mt-1 shrink-0 bg-slate-50 w-7 h-7 flex items-center justify-center rounded-lg">{v.verse}</span>
                      <div className="flex-1 space-y-3">
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                          {renderVerseText(v.text)}
                        </p>
                        <div className="flex justify-end pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => onAddVerse(v.text, `${v.book_name} ${v.chapter}:${v.verse}`)}
                            className="flex items-center gap-1.5 text-[10px] font-black text-white bg-orange-600 hover:bg-orange-700 px-3 py-1.5 rounded-lg shadow-md active:scale-95 transition-all"
                          >
                            <Plus size={14} /> ADICIONAR
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between items-center py-6 border-t border-slate-100 mt-8">
                  <button 
                    onClick={prevChapter}
                    disabled={selectedChapter === 1}
                    className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-orange-600 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors uppercase tracking-widest"
                  >
                    <ChevronLeft size={16} /> Capítulo Anterior
                  </button>
                  <button 
                    onClick={nextChapter}
                    disabled={!!selectedBook && selectedChapter === selectedBook.chapters}
                    className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-orange-600 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors uppercase tracking-widest"
                  >
                    Próximo Capítulo <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">
            {result ? (
              <div className="space-y-4 pb-20">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <h3 className="text-sm font-black text-slate-900">{result.reference}</h3>
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">{result.verses.length} VERSÍCULOS</span>
                </div>
                {result.verses.map((v, idx) => (
                  <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:border-orange-300 transition-all group">
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-orange-400 tracking-widest uppercase">{v.book_name} {v.chapter}:{v.verse}</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                          {renderVerseText(v.text)}
                        </p>
                        <div className="flex justify-end pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => onAddVerse(v.text, `${v.book_name} ${v.chapter}:${v.verse}`)}
                            className="flex items-center gap-1.5 text-[10px] font-black text-white bg-orange-600 hover:bg-orange-700 px-3 py-1.5 rounded-lg shadow-md active:scale-95 transition-all"
                          >
                            <Plus size={14} /> ADICIONAR
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-center px-10">
                <div className="w-20 h-20 bg-slate-100 rounded-[35px] flex items-center justify-center mb-6 text-slate-200">
                  <Search size={40} />
                </div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Sua busca aparecerá aqui</p>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  Digite palavras-chave como "Amor", "Fé" ou uma referência como "João 3:16".
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


