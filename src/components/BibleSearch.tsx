import React, { useState, useEffect } from 'react';
import { Search, Book, ArrowRight, Loader2, Plus, ChevronLeft, ChevronRight, List, X, ChevronDown, BookOpen, Sparkles, Copy, FileText, Check, MessageSquare } from 'lucide-react';
import { BibleResponse } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { ALL_BOOKS, OLD_TESTAMENT, NEW_TESTAMENT, BibleBook } from '@/src/constants/bible';
import { getBlueLetterStudy } from '../lib/gemini';

interface BibleSearchProps {
  onAddVerse: (verseText: string, reference: string) => void;
}

type Tab = 'search' | 'browse' | 'study';
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

  // Blue Letter Bible Study States
  const [studyReference, setStudyReference] = useState('João 3:16');
  const [studyText, setStudyText] = useState('Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.');
  const [studyLoading, setStudyLoading] = useState(false);
  const [studyData, setStudyData] = useState<any>(null);
  const [studySubTab, setStudySubTab] = useState<'strongs' | 'translations' | 'cross' | 'commentary'>('strongs');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleStartStudy = async (refStr: string, tStr: string) => {
    setActiveTab('study');
    setStudyReference(refStr);
    setStudyText(tStr);
    setStudyLoading(true);
    setStudyData(null);
    try {
      const data = await getBlueLetterStudy(refStr, tStr);
      setStudyData(data);
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar o estudo exegético. Verifique a conexão ou tente com outro versículo.');
    } finally {
      setStudyLoading(false);
    }
  };

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
            "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 cursor-pointer",
            activeTab === 'browse' ? "border-orange-500 text-orange-600 bg-orange-50/30 font-black" : "border-transparent text-slate-400 hover:text-slate-600 font-bold"
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
            "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 cursor-pointer",
            activeTab === 'search' ? "border-orange-500 text-orange-600 bg-orange-50/30 font-black" : "border-transparent text-slate-400 hover:text-slate-600 font-bold"
          )}
        >
          Pesquisar
        </button>
        <button
          onClick={() => {
            setActiveTab('study');
            setError(null);
          }}
          className={cn(
            "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 cursor-pointer",
            activeTab === 'study' ? "border-orange-500 text-orange-600 bg-orange-50/30 font-black" : "border-transparent text-slate-400 hover:text-slate-600 font-bold"
          )}
        >
          Estudo (BLB)
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
        ) : activeTab === 'search' ? (
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
        ) : (
          <div className="p-3 bg-gradient-to-r from-rose-50/50 to-orange-50/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                  <Sparkles size={14} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-rose-800 leading-none uppercase">Estudo Exegético</h4>
                  <span className="text-[10px] text-slate-600 font-extrabold leading-none mt-0.5 block">{studyReference}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  const refPrompt = prompt("Digite a referência bíblica (Ex: João 1:1, Gênesis 1:1):", studyReference);
                  if (refPrompt) {
                    const textPrompt = prompt("Digite as palavras ou o versículo (opcional, ou deixe em branco para estudar):", studyText);
                    handleStartStudy(refPrompt, textPrompt || `Estudo de ${refPrompt}`);
                  }
                }}
                className="text-[9px] font-black tracking-wider text-rose-700 bg-white border border-rose-100 shadow-sm px-2.5 py-1.5 rounded-lg hover:bg-rose-50 active:scale-95 transition-all uppercase cursor-pointer"
              >
                Mudar Verso
              </button>
            </div>
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
                  <div 
                    key={idx} 
                    draggable
                    onDragStart={(e) => {
                      const verseInfo = {
                        text: v.text,
                        reference: `${v.book_name} ${v.chapter}:${v.verse}`
                      };
                      const json = JSON.stringify(verseInfo);
                      e.dataTransfer.setData('application/bible-verse', json);
                      e.dataTransfer.setData('text/plain', `${v.text} — ${verseInfo.reference}`);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:border-orange-300 transition-all group cursor-move"
                  >
                    <div className="flex gap-4">
                      <span className="text-[10px] font-black text-orange-400 mt-1 shrink-0 bg-slate-50 w-7 h-7 flex items-center justify-center rounded-lg">{v.verse}</span>
                      <div className="flex-1 space-y-3">
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                          {renderVerseText(v.text)}
                        </p>
                        <div className="flex justify-end pt-2 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleStartStudy(`${v.book_name} ${v.chapter}:${v.verse}`, v.text)}
                            className="flex items-center gap-1.5 text-[10px] font-black text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-100 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer"
                          >
                            <Sparkles size={11} /> ESTUDAR
                          </button>
                          <button 
                            onClick={() => onAddVerse(v.text, `${v.book_name} ${v.chapter}:${v.verse}`)}
                            className="flex items-center gap-1.5 text-[10px] font-black text-white bg-orange-600 hover:bg-orange-700 px-2.5 py-1.5 rounded-lg shadow-md active:scale-95 transition-all cursor-pointer"
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
        ) : activeTab === 'search' ? (
          <div className="p-4">
            {result ? (
              <div className="space-y-4 pb-20">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <h3 className="text-sm font-black text-slate-900">{result.reference}</h3>
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">{result.verses.length} VERSÍCULOS</span>
                </div>
                {result.verses.map((v, idx) => (
                  <div 
                    key={idx} 
                    draggable
                    onDragStart={(e) => {
                      const verseInfo = {
                        text: v.text,
                        reference: `${v.book_name} ${v.chapter}:${v.verse}`
                      };
                      const json = JSON.stringify(verseInfo);
                      e.dataTransfer.setData('application/bible-verse', json);
                      e.dataTransfer.setData('text/plain', `${v.text} — ${verseInfo.reference}`);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:border-orange-300 transition-all group cursor-move"
                  >
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-orange-400 tracking-widest uppercase">{v.book_name} {v.chapter}:{v.verse}</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                          {renderVerseText(v.text)}
                        </p>
                        <div className="flex justify-end pt-2 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleStartStudy(`${v.book_name} ${v.chapter}:${v.verse}`, v.text)}
                            className="flex items-center gap-1.5 text-[10px] font-black text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-100 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer"
                          >
                            <Sparkles size={11} /> ESTUDAR
                          </button>
                          <button 
                            onClick={() => onAddVerse(v.text, `${v.book_name} ${v.chapter}:${v.verse}`)}
                            className="flex items-center gap-1.5 text-[10px] font-black text-white bg-orange-600 hover:bg-orange-700 px-2.5 py-1.5 rounded-lg shadow-md active:scale-95 transition-all cursor-pointer"
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
        ) : (
          /* DETAILED PORTUGUESE BLUE LETTER BIBLE STUDY TAB */
          <div className="p-3.5 space-y-4">
            {/* Study Verse Information Header */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-rose-50/50 rounded-full blur-xl -mr-4 -mt-4 text-rose-100/50" />
              <div className="flex items-center gap-1.5 text-[9px] font-extrabold tracking-widest text-rose-600 uppercase mb-2">
                <BookOpen size={10} /> Versículo sob Exegese
              </div>
              <p className="text-sm font-semibold text-slate-800 leading-relaxed italic">
                "{studyText}"
              </p>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 flex-wrap gap-2">
                <span className="text-xs font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full">{studyReference}</span>
                <button
                  onClick={() => onAddVerse(studyText, studyReference)}
                  className="flex items-center gap-1 text-[9px] font-black text-white bg-slate-900 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg transition-transform active:scale-95 uppercase cursor-pointer"
                >
                  <Plus size={10} /> Copiar Verso
                </button>
              </div>
            </div>

            {/* Blue Letter Panel Navigation Selector */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/50 select-none">
              <button
                onClick={() => setStudySubTab('strongs')}
                className={cn(
                  "flex-1 py-1 px-1.5 text-[9px] font-black uppercase tracking-tight rounded-lg transition-all text-center flex flex-col justify-center items-center gap-0.5 cursor-pointer border-none outline-none",
                  studySubTab === 'strongs' ? "bg-white text-rose-800 shadow-xs font-black" : "text-slate-500 hover:text-slate-800"
                )}
              >
                <span>Originais</span>
                <span className="text-[7px] text-slate-400 font-extrabold">Grego/Heb</span>
              </button>
              <button
                onClick={() => setStudySubTab('translations')}
                className={cn(
                  "flex-1 py-1 px-1.5 text-[9px] font-black uppercase tracking-tight rounded-lg transition-all text-center flex flex-col justify-center items-center gap-0.5 cursor-pointer border-none outline-none",
                  studySubTab === 'translations' ? "bg-white text-rose-800 shadow-xs font-black" : "text-slate-500 hover:text-slate-800"
                )}
              >
                <span>Traduções</span>
                <span className="text-[7px] text-slate-400 font-extrabold">Paralelo</span>
              </button>
              <button
                onClick={() => setStudySubTab('cross')}
                className={cn(
                  "flex-1 py-1 px-1.5 text-[9px] font-black uppercase tracking-tight rounded-lg transition-all text-center flex flex-col justify-center items-center gap-0.5 cursor-pointer border-none outline-none",
                  studySubTab === 'cross' ? "bg-white text-rose-800 shadow-xs font-black" : "text-slate-500 hover:text-slate-800"
                )}
              >
                <span>Temas</span>
                <span className="text-[7px] text-slate-400 font-extrabold">Cruzados</span>
              </button>
              <button
                onClick={() => setStudySubTab('commentary')}
                className={cn(
                  "flex-1 py-1 px-1.5 text-[9px] font-black uppercase tracking-tight rounded-lg transition-all text-center flex flex-col justify-center items-center gap-0.5 cursor-pointer border-none outline-none",
                  studySubTab === 'commentary' ? "bg-white text-rose-800 shadow-xs font-black" : "text-slate-500 hover:text-slate-800"
                )}
              >
                <span>Exposição</span>
                <span className="text-[7px] text-slate-400 font-extrabold">Comentários</span>
              </button>
            </div>

            {/* Sub-Abas Content Area */}
            {studyLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-white border border-slate-100 rounded-2xl shadow-xs">
                <Loader2 size={24} className="animate-spin text-rose-600 mb-2.5" />
                <p className="text-[9px] font-black text-rose-700 tracking-widest uppercase mb-1">Mapeando Léxico & Strong...</p>
                <p className="text-[9px] text-slate-400">Analisando contexto histórico-teológico</p>
              </div>
            ) : !studyData ? (
              <div className="p-6 bg-white border border-dashed border-slate-200 rounded-2xl text-center space-y-4">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Sparkles size={20} className="animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-xs font-black text-slate-800 uppercase">Blue Letter Concordance em Português</h5>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Examine termos originais, compare versões em português (NVI, ACF, ARA, NTLH), leia referências cruzadas e comentários pastoral-teológicos.
                  </p>
                </div>
                <button
                  onClick={() => handleStartStudy(studyReference, studyText)}
                  className="w-full py-2 bg-rose-600 text-white rounded-xl text-xs font-black shadow-md hover:bg-rose-700 transition-all uppercase cursor-pointer"
                >
                  Iniciar Estudo Exegético
                </button>
              </div>
            ) : (
              <div className="space-y-3 pb-24">
                {/* 1. ORIGINAIS - LÉXICO STRONG TAB */}
                {studySubTab === 'strongs' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="text-[10px] text-slate-400 font-extrabold flex items-center justify-between mb-1">
                      <span>PALAVRA POR PALAVRA (CONCORDÂNCIA)</span>
                      <span className="text-rose-500 uppercase">{studyData.strongs?.length || 0} termos</span>
                    </div>
                    {studyData.strongs?.map((item: any, idx: number) => (
                      <div key={idx} className="bg-white border border-slate-150 rounded-xl p-3 shadow-xs hover:border-rose-200 transition-all group">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="font-serif text-lg font-bold text-slate-900 group-hover:text-rose-700 transition-colors block leading-tight">{item.word}</span>
                            <span className="text-[10px] text-slate-400 italic block leading-none mt-1">({item.transliteration})</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-mono font-black text-rose-700 bg-rose-50 border border-rose-100 rounded px-1.5 py-0.5">{item.strongCode}</span>
                            <span className="text-[9px] text-slate-400 block mt-1 font-bold">{item.partOfSpeech}</span>
                          </div>
                        </div>
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1 text-slate-700">
                          <p className="text-xs font-extrabold text-slate-800">
                            ⭐ {item.meaning}
                          </p>
                          <p className="text-xs text-slate-500 leading-normal">
                            {item.theologicalDetail}
                          </p>
                        </div>
                        <div className="flex justify-end gap-1.5 mt-2.5 pt-2 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${item.word} (${item.transliteration}) - Forte ${item.strongCode}: ${item.meaning}. ${item.theologicalDetail}`);
                              setCopiedItem(`strong-${idx}`);
                              setTimeout(() => setCopiedItem(null), 1500);
                            }}
                            className="text-[8px] font-black text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition-colors uppercase cursor-pointer flex items-center gap-1"
                          >
                            {copiedItem === `strong-${idx}` ? <Check size={10} /> : <Copy size={10} />} Copiar Estudo
                          </button>
                          <button
                            onClick={() => onAddVerse(`*${item.word}* (${item.transliteration} / _Strong ${item.strongCode}_) significa *${item.meaning}*: ${item.theologicalDetail}`, studyReference)}
                            className="text-[8px] font-black text-white bg-slate-900 hover:bg-slate-800 px-2 py-1 rounded transition-colors uppercase cursor-pointer"
                          >
                            + Inserir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. COMPARAÇÃO DE TRADUÇÕES TAB */}
                {studySubTab === 'translations' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <span className="text-[10px] text-slate-400 font-extrabold block mb-1">CONCORDÂNCIA DE TRADUÇÕES PARALELAS</span>
                    
                    <div className="bg-white border border-slate-100 rounded-xl p-3.5 space-y-1">
                      <div className="flex justify-between items-center border-b border-slate-50 pb-1 mb-1.5">
                        <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">NVI (Nova Versão Internacional)</span>
                        <button 
                          onClick={() => onAddVerse(studyText, `NVI - ${studyReference}`)}
                          className="text-[8px] font-bold text-slate-500 hover:text-rose-600 cursor-pointer uppercase"
                        >
                          + Inserir
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">"{studyText}"</p>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-xl p-3.5 space-y-1">
                      <div className="flex justify-between items-center border-b border-slate-50 pb-1 mb-1.5">
                        <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">ACF (Almeida Corrigida Fiel)</span>
                        <button 
                          onClick={() => onAddVerse(studyData.translations?.acf || studyText, `ACF - ${studyReference}`)}
                          className="text-[8px] font-bold text-slate-500 hover:text-rose-600 cursor-pointer uppercase"
                        >
                          + Inserir
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">"{studyData.translations?.acf || 'Sem tradução adicional cadastrada.'}"</p>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-xl p-3.5 space-y-1">
                      <div className="flex justify-between items-center border-b border-slate-50 pb-1 mb-1.5">
                        <span className="text-[9px] font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">ARA (Almeida Revista e Atualizada)</span>
                        <button 
                          onClick={() => onAddVerse(studyData.translations?.ara || studyText, `ARA - ${studyReference}`)}
                          className="text-[8px] font-bold text-slate-500 hover:text-rose-600 cursor-pointer uppercase"
                        >
                          + Inserir
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">"{studyData.translations?.ara || 'Sem tradução adicional cadastrada.'}"</p>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-xl p-3.5 space-y-1">
                      <div className="flex justify-between items-center border-b border-slate-50 pb-1 mb-1.5">
                        <span className="text-[9px] font-black text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">NTLH (Linguagem de Hoje)</span>
                        <button 
                          onClick={() => onAddVerse(studyData.translations?.ntlh || studyText, `NTLH - ${studyReference}`)}
                          className="text-[8px] font-bold text-slate-500 hover:text-rose-600 cursor-pointer uppercase"
                        >
                          + Inserir
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">"{studyData.translations?.ntlh || 'Sem tradução adicional cadastrada.'}"</p>
                    </div>
                  </div>
                )}

                {/* 3. PARALELOS E REFERÊNCIAS CRUZADAS TAB */}
                {studySubTab === 'cross' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <span className="text-[10px] text-slate-400 font-extrabold block mb-1">REFERÊNCIAS CRUZADAS PARALELAS (TSK)</span>
                    {studyData.crossReferences?.map((cross: any, idx: number) => (
                      <div key={idx} className="bg-white border border-slate-150 rounded-xl p-3 shadow-xs hover:border-rose-200 transition-all group">
                        <div className="flex justify-between items-center pb-1 border-b border-slate-50 mb-2">
                          <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">{cross.ref}</span>
                          <button
                            onClick={() => onAddVerse(`"${cross.text}" — (${cross.ref} paralelamente a ${studyReference})`, cross.ref)}
                            className="text-[8px] font-bold text-slate-500 hover:text-rose-700 cursor-pointer"
                          >
                            + Inserir
                          </button>
                        </div>
                        <p className="text-xs text-slate-700 italic font-medium leading-relaxed">"{cross.text}"</p>
                        <p className="text-[10px] text-slate-500 bg-slate-50 border border-slate-100 p-2 rounded-lg mt-2 leading-relaxed">
                          📌 <strong className="text-slate-600 font-bold">Conexão:</strong> {cross.connection}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. EXPOSIÇÃO - COMENTÁRIOS TAB */}
                {studySubTab === 'commentary' && (
                  <div className="space-y-3.5 animate-in fade-in duration-200">
                    <span className="text-[10px] text-slate-400 font-extrabold block mb-1">COMENTÁRIOS GLOBAIS E CHAVES HOMILÉTICAS</span>
                    
                    <div className="bg-white border border-slate-150 rounded-xl p-3.5 space-y-2 relative">
                      <div className="flex justify-between items-center pb-1 border-b border-slate-50 mb-1">
                        <span className="text-[10px] font-black text-rose-800 uppercase flex items-center gap-1">🙏 Comentário Devocional</span>
                        <button
                          onClick={() => onAddVerse(studyData.commentary?.devotional, `Comentário Devocional: ${studyReference}`)}
                          className="text-[8px] font-bold text-slate-500 hover:text-rose-700 cursor-pointer"
                        >
                          + Inserir
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold whitespace-pre-line">
                        {studyData.commentary?.devotional}
                      </p>
                    </div>

                    <div className="bg-white border border-slate-150 rounded-xl p-3.5 space-y-2 relative">
                      <div className="flex justify-between items-center pb-1 border-b border-slate-50 mb-1">
                        <span className="text-[10px] font-black text-violet-800 uppercase flex items-center gap-1">💡 Comentário de Exegese</span>
                        <button
                          onClick={() => onAddVerse(studyData.commentary?.expositional, `Comentário de Exegese: ${studyReference}`)}
                          className="text-[8px] font-bold text-slate-500 hover:text-rose-700 cursor-pointer"
                        >
                          + Inserir
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold whitespace-pre-line">
                        {studyData.commentary?.expositional}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


