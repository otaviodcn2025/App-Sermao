import React, { useState, useEffect } from 'react';
import { Search, Book, ArrowRight, Loader2, Plus, ChevronLeft, ChevronRight, List, X } from 'lucide-react';
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
  const [query, setQuery] = useState('');
  const [bookFilter, setBookFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BibleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Browse state
  const [browseLevel, setBrowseLevel] = useState<BrowseLevel>('books');
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);

  const filteredOldTestament = OLD_TESTAMENT.filter(b => 
    b.name.toLowerCase().includes(bookFilter.toLowerCase())
  );
  const filteredNewTestament = NEW_TESTAMENT.filter(b => 
    b.name.toLowerCase().includes(bookFilter.toLowerCase())
  );

  const searchBible = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = customQuery || query;
    if (!q) return;

    setLoading(true);
    setError(null);
    try {
      // Usando bible-api.com com tradução almeida (se disponível) ou padrão
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(q)}?translation=almeida`);
      if (!res.ok) throw new Error('Não foi possível encontrar este versículo ou capítulo.');
      const data = await res.json();
      setResult(data);
      if (customQuery) {
        setBrowseLevel('verses');
      } else {
        setActiveTab('search');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar versículo');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSelect = (book: BibleBook) => {
    setSelectedBook(book);
    setBrowseLevel('chapters');
    setBookFilter('');
  };

  const handleChapterSelect = (chapter: number) => {
    setSelectedChapter(chapter);
    if (selectedBook) {
      searchBible(undefined, `${selectedBook.key} ${chapter}`);
    }
  };

  const resetBrowse = () => {
    setBrowseLevel('books');
    setSelectedBook(null);
    setSelectedChapter(null);
    setResult(null);
    setBookFilter('');
  };

  const backToChapters = () => {
    setBrowseLevel('chapters');
    setResult(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-l border-slate-200 w-full overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white shrink-0">
        <button
          onClick={() => setActiveTab('browse')}
          className={cn(
            "flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2",
            activeTab === 'browse' ? "border-orange-500 text-orange-600" : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          Navegar
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={cn(
            "flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2",
            activeTab === 'search' ? "border-orange-500 text-orange-600" : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          Pesquisar
        </button>
      </div>

      <div className="p-4 bg-white shadow-sm shrink-0">
        {activeTab === 'search' ? (
          <form onSubmit={searchBible} className="relative">
            <input
              type="text"
              placeholder="Ex: João 3:16 ou Rm 8:28"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </form>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <Book size={18} className="text-orange-500 shrink-0" />
                <span className="text-sm font-bold text-slate-700 truncate">
                  {browseLevel === 'books' ? 'Livros da Bíblia' : selectedBook?.name}
                  {selectedChapter && browseLevel !== 'chapters' && ` • Cap ${selectedChapter}`}
                </span>
              </div>
              {browseLevel !== 'books' && (
                <button 
                  onClick={browseLevel === 'verses' ? backToChapters : resetBrowse}
                  className="text-[10px] font-bold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wider"
                >
                  Voltar
                </button>
              )}
            </div>
            
            {browseLevel === 'books' && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filtrar livro..."
                  value={bookFilter}
                  onChange={(e) => setBookFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-100 bg-slate-50 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                />
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={32} className="animate-spin mb-4 text-orange-500" />
            <p className="text-sm font-medium">Consultando as escrituras...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
               <X size={14} />
            </div>
            {error}
          </div>
        ) : (
          <div className="pb-20">
            {activeTab === 'search' ? (
              <>
                {result ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Resultados</h3>
                      <span className="text-[10px] font-bold text-orange-600">{result.verses.length} versículos</span>
                    </div>
                    {result.verses.map((v, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-full">
                            {result.reference || `${v.book_name} ${v.chapter}:${v.verse}`}
                          </span>
                          <button 
                            onClick={() => onAddVerse(v.text, result.reference || `${v.book_name} ${v.chapter}:${v.verse}`)}
                            className="p-1.5 bg-slate-50 hover:bg-orange-600 rounded-lg transition-all text-slate-400 hover:text-white"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {v.text.trim()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 px-6">
                    <div className="bg-slate-100 w-16 h-16 rounded-[24px] flex items-center justify-center mx-auto mb-4 border-b-4 border-slate-200">
                      <Search size={28} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 mb-2">Busca Rápida</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Digite uma referência como <span className="text-orange-500 font-bold">João 3:16</span> ou pesquise por palavras como <span className="text-orange-500 font-bold">"Amor"</span>.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full">
                {browseLevel === 'books' && (
                  <div className="space-y-8">
                    {filteredOldTestament.length > 0 && (
                      <section>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Antigo Testamento</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {filteredOldTestament.map(book => (
                            <button
                              key={book.name}
                              onClick={() => handleBookSelect(book)}
                              className="text-left px-4 py-3 text-xs font-bold text-slate-700 bg-white border border-slate-100 rounded-xl hover:border-orange-500 hover:text-orange-600 transition-all truncate shadow-sm active:scale-95"
                            >
                              {book.name}
                            </button>
                          ))}
                        </div>
                      </section>
                    )}
                    
                    {filteredNewTestament.length > 0 && (
                      <section>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Novo Testamento</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {filteredNewTestament.map(book => (
                            <button
                              key={book.name}
                              onClick={() => handleBookSelect(book)}
                              className="text-left px-4 py-3 text-xs font-bold text-slate-700 bg-white border border-slate-100 rounded-xl hover:border-orange-500 hover:text-orange-600 transition-all truncate shadow-sm active:scale-95"
                            >
                              {book.name}
                            </button>
                          ))}
                        </div>
                      </section>
                    )}

                    {filteredOldTestament.length === 0 && filteredNewTestament.length === 0 && (
                      <div className="text-center py-20 text-slate-400 italic text-xs">
                        Nenhum livro encontrado com "{bookFilter}"
                      </div>
                    )}
                  </div>
                )}

                {browseLevel === 'chapters' && selectedBook && (
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Selecione o Capítulo</h4>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(chap => (
                        <button
                          key={chap}
                          onClick={() => handleChapterSelect(chap)}
                          className="aspect-square flex items-center justify-center text-sm font-black text-slate-600 bg-white border border-slate-100 rounded-xl hover:bg-orange-600 hover:text-white transition-all shadow-sm active:scale-90"
                        >
                          {chap}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {browseLevel === 'verses' && result && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between sticky top-0 bg-slate-50/95 backdrop-blur-md py-3 z-10 border-b border-slate-200 px-2 -mx-2 mb-4">
                      <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{result.reference}</span>
                      <button 
                        onClick={() => onAddVerse(result.text, result.reference)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white text-[10px] font-black rounded-lg hover:bg-orange-700 transition-all shadow-md active:scale-95"
                      >
                        <Plus size={14} /> ADICIONAR CAPÍTULO
                      </button>
                    </div>
                    <div className="space-y-6">
                      {result.verses.map((v, idx) => (
                        <div key={idx} className="group relative bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <div className="flex gap-4">
                            <span className="text-[10px] font-black text-orange-500 mt-1 shrink-0 bg-orange-50 w-6 h-6 flex items-center justify-center rounded-lg">{v.verse}</span>
                            <div className="flex-1 space-y-3">
                              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                {v.text.trim()}
                              </p>
                              <button 
                                onClick={() => onAddVerse(v.text, `${v.book_name} ${v.chapter}:${v.verse}`)}
                                className="flex items-center gap-1.5 text-[10px] font-black text-orange-600 hover:bg-orange-50 px-2 py-1.5 rounded-lg transition-all"
                              >
                                <Plus size={14} /> INCLUIR NO ESBOÇO
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
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

