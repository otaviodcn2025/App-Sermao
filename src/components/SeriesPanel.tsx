import React, { useState } from 'react';
import { 
  FolderHeart, 
  Plus, 
  Trash2, 
  FolderOpen, 
  Sparkles, 
  Tag, 
  Bookmark, 
  LayoutGrid, 
  BookOpen, 
  ChevronRight,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Sermon, Series } from '../types';

interface SeriesPanelProps {
  sermons: Sermon[];
  series: Series[];
  onCreateSeries: (series: Omit<Series, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  onDeleteSeries: (id: string) => Promise<void>;
  onSelectSermon: (sermonId: string) => void;
  onNewSermonWithSeries: (seriesId: string) => void;
}

const GRADIENT_PRESETS = [
  { name: 'Aurora Violet', class: 'from-violet-600 to-indigo-800', border: 'border-violet-100', color: 'violet' },
  { name: 'Warm Crimson', class: 'from-pink-600 to-rose-800', border: 'border-rose-100', color: 'rose' },
  { name: 'Emerald Peak', class: 'from-emerald-600 to-teal-800', border: 'border-emerald-100', color: 'emerald' },
  { name: 'Ocean Mist', class: 'from-blue-600 to-cyan-800', border: 'border-blue-100', color: 'blue' },
  { name: 'Imperial Twilight', class: 'from-indigo-900 to-purple-800', border: 'border-indigo-100', color: 'indigo' },
  { name: 'Noble Amber', class: 'from-amber-600 to-orange-850', border: 'border-amber-100', color: 'amber' }
];

export default function SeriesPanel({
  sermons,
  series,
  onCreateSeries,
  onDeleteSeries,
  onSelectSermon,
  onNewSermonWithSeries
}: SeriesPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_PRESETS[0].class);
  const [tagsInput, setTagsInput] = useState('');
  
  const [selectedSeriesDetail, setSelectedSeriesDetail] = useState<Series | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor, informe o título da série.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    try {
      await onCreateSeries({
        title: title.trim(),
        description: description.trim() || undefined,
        color: selectedGradient,
        tags: tags.length > 0 ? tags : undefined
      });

      setTitle('');
      setDescription('');
      setSelectedGradient(GRADIENT_PRESETS[0].class);
      setTagsInput('');
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao criar nova série.');
    }
  };

  const currentPresetOfClass = (gradientClass: string) => {
    return GRADIENT_PRESETS.find(p => p.class === gradientClass) || GRADIENT_PRESETS[0];
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="text-xs font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-2.5 py-1 rounded-full">Séries Expositivas</span>
          <h2 className="text-2xl font-black text-slate-800 mt-2">Séries de Sermões</h2>
          <p className="text-slate-500 text-sm">Organize suas mensagens em blocos temáticos ou estudos sequenciais do mesmo livro ou tema.</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setSelectedSeriesDetail(null);
          }}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg hover:shadow-violet-100 active:scale-95 text-center shrink-0"
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />}
          {showAddForm ? 'Cancelar' : 'Nova Série'}
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xl max-w-2xl"
          >
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FolderHeart className="text-violet-600" size={18} />
              Criar Nova Série Temática
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Título da Série</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carta aos Efésios: A Glória da Igreja, Parábolas de Jesus..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-slate-400 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Descrição Teológica / Sinopse</label>
                <textarea
                  rows={3}
                  placeholder="Defina qual o foco hermenêutico ou doutrinário central desta série de pregações..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Gradient Picker */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Identidade Visual (Paleta)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {GRADIENT_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setSelectedGradient(p.class)}
                      className={cn(
                        "flex items-center gap-2.5 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border text-left transition-all text-xs",
                        selectedGradient === p.class ? "border-violet-600 ring-2 ring-violet-50" : "border-slate-200"
                      )}
                    >
                      <div className={cn("w-7 h-7 rounded-lg bg-gradient-to-br", p.class)} />
                      <span className="font-bold text-slate-700 leading-tight">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tags / Palavras-chave (Separadas por vírgula)</label>
                <input
                  type="text"
                  placeholder="Ex: biblia, efesios, graça, salvacao"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-violet-100"
                >
                  Criar Série
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main List */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <LayoutGrid size={14} className="text-slate-400" />
            Séries Ativas ({series.length})
          </h3>

          {series.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-150 rounded-2xl shadow-inner">
              <FolderOpen size={48} className="text-slate-200 mx-auto mb-4" />
              <h4 className="text-slate-800 font-bold text-base">Nenhuma série teológica criada</h4>
              <p className="text-slate-400 text-xs mt-1 px-8">Crie uma série para conectar sermões relacionados e guiar sua comunidade em uma jornada de estudos completa.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all active:scale-95"
              >
                Criar Nova Série
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {series.map(item => {
                const sermonsCount = sermons.filter(s => s.seriesId === item.id).length;
                const preset = currentPresetOfClass(item.color || '');
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedSeriesDetail(item)}
                    className={cn(
                      "group relative bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col h-full",
                      selectedSeriesDetail?.id === item.id ? "border-violet-600 ring-2 ring-violet-50" : "border-slate-100 hover:border-slate-300"
                    )}
                  >
                    {/* Visual Cover Gradient */}
                    <div className={cn("h-32 bg-gradient-to-br relative p-5 flex flex-col justify-between text-white shrink-0", item.color || 'from-violet-600 to-indigo-800')}>
                      <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
                        <FolderHeart size={48} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-black/15 backdrop-blur-sm px-2 py-0.5 rounded-full w-fit">
                        Série Expositiva
                      </span>
                      <div>
                        <h4 className="font-extrabold text-base leading-tight tracking-tight line-clamp-2 drop-shadow-sm">
                          {item.title}
                        </h4>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                        {item.description || 'Nenhuma descrição teológica cadastrada para esta série temática.'}
                      </p>

                      <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                        <span className="text-xs font-bold text-slate-400">
                          {sermonsCount} {sermonsCount === 1 ? 'sermão conectado' : 'sermões conectados'}
                        </span>
                        
                        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] uppercase font-black text-violet-600">Ver Esboços</span>
                          <ChevronRight size={14} className="text-violet-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Series Detail & Actions sidebar */}
        <div className="md:col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen size={14} className="text-slate-400" />
            Detalhamento da Série
          </h3>

          <AnimatePresence mode="wait">
            {selectedSeriesDetail ? (
              <motion.div
                key={selectedSeriesDetail.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-lg space-y-5"
              >
                <div>
                  <div className={cn("w-full h-2 rounded-full mb-3 bg-gradient-to-r", selectedSeriesDetail.color || 'from-violet-600 to-indigo-800')} />
                  <h4 className="text-base font-black text-slate-800 leading-tight">
                    {selectedSeriesDetail.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {selectedSeriesDetail.description || 'Sem descrição.'}
                  </p>
                </div>

                {selectedSeriesDetail.tags && selectedSeriesDetail.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 border-t border-slate-105 pt-4">
                    {selectedSeriesDetail.tags.map(t => (
                      <span key={t} className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full capitalize">
                        <Tag size={10} />
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* List of linked sermons */}
                <div className="space-y-2 border-t border-slate-105 pt-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Sermões Conectados</span>
                  {sermons.filter(s => s.seriesId === selectedSeriesDetail.id).length === 0 ? (
                    <div className="text-center py-4 bg-slate-50 border border-slate-100/50 rounded-xl">
                      <span className="text-[11px] text-slate-400 italic">Nenhum esboço nesta série.</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar">
                      {sermons
                        .filter(s => s.seriesId === selectedSeriesDetail.id)
                        .map(s => (
                          <div
                            key={s.id}
                            onClick={() => onSelectSermon(s.id)}
                            className="p-2.5 bg-slate-50 hover:bg-violet-50 text-slate-800 hover:text-violet-700 rounded-xl text-xs cursor-pointer border border-transparent hover:border-violet-100 transition-all font-bold truncate flex items-center justify-between"
                          >
                            <span className="truncate pr-2">{s.title || 'Início de Sermão'}</span>
                            <ChevronRight size={12} className="opacity-40 shrink-0" />
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-col gap-2 border-t border-slate-105 pt-4">
                  <button
                    onClick={() => onNewSermonWithSeries(selectedSeriesDetail.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-violet-50"
                  >
                    <Plus size={14} />
                    Novo Sermão nesta Série
                  </button>

                  <button
                    onClick={async () => {
                      if (window.confirm(`Excluir a série "${selectedSeriesDetail.title}"? \nIsso não excluirá os sermões contidos nela.`)) {
                        try {
                          await onDeleteSeries(selectedSeriesDetail.id);
                          setSelectedSeriesDetail(null);
                        } catch (err) {
                          alert('Erro ao excluir série.');
                        }
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-transparent hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl text-xs font-bold transition-all"
                  >
                    <Trash2 size={14} />
                    Excluir Série
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-6 text-center text-xs text-slate-400 italic shadow-inner">
                Selecione uma série para ver seus esboços, gerenciar tags e adicionar mais mensagens.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
