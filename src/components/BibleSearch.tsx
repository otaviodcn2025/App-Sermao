import React, { useState, useEffect } from 'react';
import { Search, Book, ArrowRight, Loader2, Plus, ChevronLeft, ChevronRight, List } from 'lucide-react';
import { BibleResponse } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { ALL_BOOKS, OLD_TESTAMENT, NEW_TESTAMENT, BibleBook } from '@/src/constants/bible';

interface BibleSearchProps {
  onAddVerse: (verseText: string, reference: string) => void;
}

type Tab = 'search' | 'browse';
type BrowseLevel = 'books' | 'chapters' | 'verses';

export default function BibleSearch({ onAddVerse }: BibleSearchProps) {
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BibleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Browse state
  const [browseLevel, setBrowseLevel] = useState<BrowseLevel>('books');
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);

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
  };

  const handleChapterSelect = (chapter: number) => {
    setSelectedChapter(chapter);
    if (selectedBook) {
      searchBible(undefined, `${selectedBook.name} ${chapter}`);
    }
  };

  const resetBrowse = () => {
    setBrowseLevel('books');
    setSelectedBook(null);
    setSelectedChapter(null);
    setResult(null);
  };

  const backToChapters = () => {
    setBrowseLevel('chapters');
    setResult(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-l border-slate-200 w-full">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white">
        <button
          onClick={() => setActiveTab('search')}
          className={cn(
            "flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2",
            activeTab === 'search' ? "border-orange-500 text-orange-600" : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          Pesquisar
        </button>
        <button
          onClick={() => setActiveTab('browse')}
          className={cn(
            "flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2",
            activeTab === 'browse' ? "border-orange-500 text-orange-600" : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          Navegar
        </button>
      </div>

      <div className="p-4 bg-white shadow-sm">
        {activeTab === 'search' ? (
          <form onSubmit={searchBible} className="relative">
            <input
              type="text"
              placeholder="Ex: João 3:16 ou Rm 8:28"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </form>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <Book size={16} className="text-orange-500 shrink-0" />
              <span className="text-xs font-bold text-slate-700 truncate">
                {browseLevel === 'books' ? 'Selecione um Livro' : selectedBook?.name}
                {selectedChapter && ` • Cap ${selectedChapter}`}
              </span>
            </div>
            {browseLevel !== 'books' && (
              <button 
                onClick={browseLevel === 'verses' ? backToChapters : resetBrowse}
                className="text-[10px] font-bold text-orange-600 hover:bg-orange-50 px-2 py-1 rounded transition-colors uppercase"
              >
                Voltar
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 size={24} className="animate-spin mb-2" />
            <p className="text-xs">Consultando as escrituras...</p>
          </div>
        ) : error ? (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs">
            {error}
          </div>
        ) : (
          <>
            {activeTab === 'search' ? (
              <>
                {result ? (
                  <div className="space-y-4">
                    {result.verses.map((v, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">
                            {result.reference || `${v.book_name} ${v.chapter}:${v.verse}`}
                          </span>
                          <button 
                            onClick={() => onAddVerse(v.text, result.reference || `${v.book_name} ${v.chapter}:${v.verse}`)}
                            className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-400 hover:text-slate-900"
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
                  <div className="text-center py-12 px-4">
                    <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Search size={20} className="text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Digite uma referência bíblica ou palavra-chave para pesquisar.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full">
                {browseLevel === 'books' && (
                  <div className="space-y-6">
                    <section>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1">Antigo Testamento</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {OLD_TESTAMENT.map(book => (
                          <button
                            key={book.name}
                            onClick={() => handleBookSelect(book)}
                            className="text-left px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-orange-500 hover:text-orange-600 transition-all truncate"
                          >
                            {book.name}
                          </button>
                        ))}
                      </div>
                    </section>
                    <section>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1">Novo Testamento</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {NEW_TESTAMENT.map(book => (
                          <button
                            key={book.name}
                            onClick={() => handleBookSelect(book)}
                            className="text-left px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-orange-500 hover:text-orange-600 transition-all truncate"
                          >
                            {book.name}
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>
                )}

                {browseLevel === 'chapters' && selectedBook && (
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(chap => (
                      <button
                        key={chap}
                        onClick={() => handleChapterSelect(chap)}
                        className="aspect-square flex items-center justify-center text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all"
                      >
                        {chap}
                      </button>
                    ))}
                  </div>
                )}

                {browseLevel === 'verses' && result && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between sticky top-0 bg-slate-50/90 backdrop-blur-sm py-2">
                      <span className="text-xs font-bold text-slate-900">{result.reference}</span>
                      <button 
                        onClick={() => onAddVerse(result.text, result.reference)}
                        className="flex items-center gap-1 px-2 py-1 bg-orange-600 text-white text-[10px] font-bold rounded-md hover:bg-orange-700 transition-colors"
                      >
                        <Plus size={12} /> Add Tudo
                      </button>
                    </div>
                    {result.verses.map((v, idx) => (
                      <div key={idx} className="group relative">
                        <div className="flex gap-3">
                          <span className="text-[10px] font-bold text-orange-500 mt-1 shrink-0 w-4">{v.verse}</span>
                          <p className="text-sm text-slate-700 leading-relaxed flex-1">
                            {v.text.trim()}
                          </p>
                          <button 
                            onClick={() => onAddVerse(v.text, `${v.book_name} ${v.chapter}:${v.verse}`)}
                            className="opacity-0 group-hover:opacity-100 p-1 bg-slate-100 text-slate-500 rounded hover:bg-orange-100 hover:text-orange-600 transition-all"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

