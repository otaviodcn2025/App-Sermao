import React, { useState } from 'react';
import { Search, Book, ArrowRight, Loader2, Plus } from 'lucide-react';
import { BibleResponse } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface BibleSearchProps {
  onAddVerse: (verseText: string, reference: string) => void;
}

export default function BibleSearch({ onAddVerse }: BibleSearchProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BibleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchBible = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    setError(null);
    try {
      // Usando bible-api.com com tradução almeida (se disponível) ou padrão
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(query)}?translation=almeida`);
      if (!res.ok) throw new Error('Não foi possível encontrar este versículo.');
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar versículo');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-l border-slate-200 w-full">
      <div className="p-4 border-bottom border-slate-200 bg-white">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Book size={18} className="text-orange-500" />
          Pesquisa Bíblica
        </h3>
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
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 size={24} className="animate-spin mb-2" />
            <p className="text-xs">Consultando as escrituras...</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">{result.reference}</span>
              <button 
                onClick={() => onAddVerse(result.text, result.reference)}
                className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-400 hover:text-slate-900"
                title="Adicionar ao editor"
              >
                <Plus size={16} />
              </button>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed italic">
              "{result.text.trim()}"
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-medium">{result.translation_name}</span>
            </div>
          </div>
        )}

        {!result && !loading && !error && (
          <div className="text-center py-12 px-4">
            <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search size={20} className="text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Digite uma referência bíblica acima para começar sua pesquisa.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
