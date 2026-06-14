import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Trash2, 
  Folder, 
  Clock, 
  Plus, 
  CheckCircle, 
  ChevronRight, 
  ArrowUpDown, 
  Filter, 
  BookOpen, 
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Sermon, Series } from '../types';

interface SermonListProps {
  sermons: Sermon[];
  series: Series[];
  onSelectSermon: (sermonId: string) => void;
  onDeleteSermon: (e: React.MouseEvent, id: string) => void;
  onCreateSermon: () => void;
  onNavigateView: (view: any) => void;
}

export default function SermonList({
  sermons,
  series,
  onSelectSermon,
  onDeleteSermon,
  onCreateSermon,
  onNavigateView
}: SermonListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'updatedAt-desc' | 'updatedAt-asc' | 'title-asc' | 'title-desc'>('updatedAt-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Helper to strip HTML tags for card content preview
  const stripHtml = (htmlStr: string) => {
    if (!htmlStr) return '';
    // Basic strip tags pattern
    const doc = new RegExp('<[^>]*>', 'g');
    let text = htmlStr.replace(doc, ' ');
    // replace entity chars
    text = text.replace(/&nbsp;/g, ' ')
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/\s+/g, ' ')
               .trim();
    return text;
  };

  // Filter and sort sermons
  const filteredAndSortedSermons = useMemo(() => {
    let result = [...sermons];

    // Filter by series
    if (selectedSeriesId !== 'all') {
      result = result.filter(s => s.seriesId === selectedSeriesId);
    }

    // Filter by search text (title, tags, or content excerpt)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(s => {
        const titleMatch = (s.title || '').toLowerCase().includes(query);
        const excerptMatch = stripHtml(s.content || '').toLowerCase().includes(query);
        const tagMatch = s.tags?.some(t => t.toLowerCase().includes(query)) || false;
        return titleMatch || excerptMatch || tagMatch;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'updatedAt-desc') {
        return b.updatedAt - a.updatedAt;
      } else if (sortBy === 'updatedAt-asc') {
        return a.updatedAt - b.updatedAt;
      } else if (sortBy === 'title-asc') {
        return (a.title || '').localeCompare(b.title || '');
      } else if (sortBy === 'title-desc') {
        return (b.title || '').localeCompare(a.title || '');
      }
      return 0;
    });

    return result;
  }, [sermons, searchQuery, selectedSeriesId, sortBy]);

  // Format date correctly
  const formatDateBR = (timestamp: number) => {
    try {
      return new Date(timestamp).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <div id="sermons-catalog-page" className="space-y-6 sm:space-y-8 animate-fade-in pb-12 font-sans">
      
      {/* Header section with page title & counts */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <span className="text-violet-600 font-extrabold text-xs uppercase tracking-widest block mb-1">Acervo Pastoral</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <BookOpen className="text-violet-600" size={24} /> Meus Sermões Salvos
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Navegue por todas as suas homilias, filtre por campanhas, faça buscas rápidas nos manuscritos e gerencie seus arquivos com facilidade.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button 
            id="catalog-btn-new"
            onClick={onCreateSermon}
            className="flex items-center gap-2 px-5 py-3 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-all shadow-md active:scale-95 cursor-pointer border-none"
          >
            <Plus size={16} />
            Novo Esboço
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTERING TOOLBAR */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col md:flex-row gap-3.5 items-center justify-between">
        
        {/* Search input */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Buscar por título, versículo, anotações..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-700 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters dropdowns and options */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          
          {/* Series filter */}
          <div className="flex items-center gap-1.5">
            <Folder size={14} className="text-slate-400" />
            <select
              value={selectedSeriesId}
              onChange={(e) => setSelectedSeriesId(e.target.value)}
              className="px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-600"
            >
              <option value="all">📁 Todas as Séries</option>
              <option value="none">📁 Sem Série Associada</option>
              {series.map(ser => (
                <option key={ser.id} value={ser.id}>
                  📁 {ser.title}
                </option>
              ))}
            </select>
          </div>

          {/* Sort order options */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown size={14} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-600"
            >
              <option value="updatedAt-desc">🕒 Modificado: Recente</option>
              <option value="updatedAt-asc">🕒 Modificado: Antigo</option>
              <option value="title-asc">🔤 Título: A-Z</option>
              <option value="title-desc">🔤 Título: Z-A</option>
            </select>
          </div>

          {/* View mode toggle */}
          <div className="p-1 bg-slate-100 rounded-xl flex items-center gap-0.5 border border-slate-200/50 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer",
                viewMode === 'grid' ? "bg-white text-violet-700 shadow-xs" : "text-slate-400 hover:text-slate-600"
              )}
              title="Visualização em Grade"
            >
              <GridIcon size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer",
                viewMode === 'list' ? "bg-white text-violet-700 shadow-xs" : "text-slate-400 hover:text-slate-600"
              )}
              title="Visualização em Lista"
            >
              <ListIcon size={14} />
            </button>
          </div>

        </div>
      </div>

      {/* EXHORTATION IF IA FILTER RESULTS ARE LIMITED ON APP OR SERMONS ARE EMPTY */}
      {filteredAndSortedSermons.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-base font-black text-slate-700 uppercase tracking-tight">Nenhum sermão correspondente</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-normal">
            {sermons.length === 0 
              ? "Você ainda não possui nenhum rascunho. Vamos criar o primeiro esboço para o seu altar?" 
              : "Não encontramos esboços salvos que correspondam aos filtros de busca aplicados."}
          </p>
          <div className="mt-5 flex gap-2.5 justify-center">
            {sermons.length > 0 && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSeriesId('all');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl cursor-pointer transition-colors border-none"
              >
                Limpar Filtros
              </button>
            )}
            <button
              id="catalog-empty-cta"
              onClick={onCreateSermon}
              className="px-4.5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm transition-colors border-none"
            >
              Criar Novo Sermão
            </button>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          
          {/* GRID VIEW */}
          {viewMode === 'grid' ? (
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {filteredAndSortedSermons.map((sermon) => {
                const associatedSeries = series.find(ser => ser.id === sermon.seriesId);
                const rawExcerpt = stripHtml(sermon.content);
                const truncatedExcerpt = rawExcerpt.length > 140 
                  ? rawExcerpt.substring(0, 140) + '...' 
                  : rawExcerpt || 'Sem conteúdo inserido ainda. Use o editor ou as ferramentas de IA para preencher o rascunho deste sermão...';

                return (
                  <motion.div
                    key={sermon.id}
                    layoutId={`sermon-card-${sermon.id}`}
                    whileHover={{ y: -3 }}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-violet-200 transition-all cursor-pointer relative group"
                    onClick={() => onSelectSermon(sermon.id)}
                  >
                    <div className="space-y-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Upper row: series and tags */}
                        <div className="flex flex-wrap gap-1.5 items-center justify-between mb-3 min-h-[20px]">
                          {associatedSeries ? (
                            <span className="inline-block px-2.5 py-0.5 text-[8px] font-black uppercase rounded-lg bg-pink-50 text-pink-600 border border-pink-100/30">
                              {associatedSeries.title}
                            </span>
                          ) : (
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                              Sem Série
                            </span>
                          )}

                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                            <Clock size={10} />
                            {formatDateBR(sermon.updatedAt).split(' ')[0]}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-base font-black text-slate-800 leading-snug uppercase tracking-tight group-hover:text-violet-700 transition-colors line-clamp-2">
                          {sermon.title || 'Esboço sem título'}
                        </h4>

                        {/* Content Excerpt Summary snippet */}
                        <p className="text-[11px] text-slate-500 leading-relaxed mt-2 line-clamp-3">
                          {truncatedExcerpt}
                        </p>
                      </div>

                      {/* Display tags if available */}
                      {sermon.tags && sermon.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 mb-1">
                          {sermon.tags.slice(0, 3).map((tag, i) => (
                            <span key={tag + i} className="text-[8px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                              #{tag}
                            </span>
                          ))}
                          {sermon.tags.length > 3 && (
                            <span className="text-[8px] font-black text-slate-400 px-1 py-0.5">
                              +{sermon.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom row actions row */}
                    <div className="border-t border-slate-100 pt-3.5 mt-4 flex items-center justify-between">
                      <span className="text-[10px] text-violet-600 hover:text-violet-700 font-extrabold uppercase tracking-wider flex items-center gap-1">
                        Editar Esboço <ChevronRight size={12} strokeWidth={3} />
                      </span>

                      {/* Explicit absolute delete option with confirmation protect */}
                      <button
                        onClick={(e) => {
                          onDeleteSermon(e, sermon.id);
                        }}
                        className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all cursor-pointer border-none bg-transparent"
                        title="Excluir este sermão definitivamente"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            
            /* LIST VIEW */
            <motion.div 
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="min-w-full divide-y divide-slate-100">
                <div className="bg-slate-50/50 p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider grid grid-cols-12 gap-4">
                  <div className="col-span-6 md:col-span-5 pl-2">Sermão / Tema</div>
                  <div className="col-span-3 md:col-span-3">Série Coordenadora</div>
                  <div className="col-span-3 md:col-span-2">Última Modificação</div>
                  <div className="hidden md:block col-span-1">Palavras-Chaves</div>
                  <div className="col-span-3 md:col-span-1 text-right pr-2">Ações</div>
                </div>
                
                <div className="divide-y divide-slate-100 bg-white">
                  {filteredAndSortedSermons.map((sermon) => {
                    const associatedSeries = series.find(ser => ser.id === sermon.seriesId);
                    
                    return (
                      <div 
                        key={sermon.id}
                        onClick={() => onSelectSermon(sermon.id)}
                        className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-slate-50/75 cursor-pointer transition-colors group"
                      >
                        {/* Title and Excerpt */}
                        <div className="col-span-6 md:col-span-5 min-w-0 pl-2">
                          <h4 className="text-xs font-bold text-slate-800 truncate uppercase tracking-tight group-hover:text-violet-700 transition-colors">
                            {sermon.title || 'Esboço sem título'}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {stripHtml(sermon.content) || 'Nenhum esboço adicionado ainda...'}
                          </p>
                        </div>

                        {/* Associated series */}
                        <div className="col-span-3 md:col-span-3 truncate">
                          {associatedSeries ? (
                            <span className="inline-block px-2 py-0.5 text-[8px] font-black uppercase rounded bg-pink-50 text-pink-600 border border-pink-100/20 max-w-full truncate">
                              {associatedSeries.title}
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest pl-1">
                              Avulso
                            </span>
                          )}
                        </div>

                        {/* Last modify date */}
                        <div className="col-span-3 md:col-span-2 text-[10px] text-slate-400 font-mono">
                          {formatDateBR(sermon.updatedAt)}
                        </div>

                        {/* Tags */}
                        <div className="hidden md:block col-span-1 truncate">
                          {sermon.tags && sermon.tags.length > 0 ? (
                            <span className="text-[9px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                              {sermon.tags[0]}
                              {sermon.tags.length > 1 && ` +${sermon.tags.length - 1}`}
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-300">—</span>
                          )}
                        </div>

                        {/* Actions column */}
                        <div className="col-span-3 md:col-span-1 text-right flex items-center justify-end gap-1.5 pr-2">
                          <button
                            onClick={(e) => {
                              onDeleteSermon(e, sermon.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                            title="Deletar sermão"
                          >
                            <Trash2 size={13} />
                          </button>
                          <div className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center text-slate-400 group-hover:bg-violet-100 group-hover:text-violet-600 transition-colors">
                            <ChevronRight size={12} strokeWidth={2.5} />
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      )}

    </div>
  );
}

// Inline Custom Minimal SVG icons to prevent loading/missing package issues
function GridIcon({ size = 14 }: { size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

function ListIcon({ size = 14 }: { size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <line x1="3" x2="21" y1="6" y2="6" />
      <line x1="3" x2="21" y1="12" y2="12" />
      <line x1="3" x2="21" y1="18" y2="18" />
    </svg>
  );
}
