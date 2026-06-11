import React, { useMemo } from 'react';
import { 
  FileText, 
  Layers, 
  Calendar, 
  BookOpen, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  TrendingUp, 
  Tag, 
  Sparkles, 
  ArrowRight,
  BookmarkCheck,
  CheckCircle,
  PlayCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Sermon, Series, Resource, AgendaEntry } from '../types';

interface DashboardProps {
  sermons: Sermon[];
  series: Series[];
  resources: Resource[];
  agenda: AgendaEntry[];
  onSelectSermon: (sermonId: string) => void;
  onNavigateView: (view: 'editor' | 'library' | 'series' | 'agenda') => void;
  onCreateSermon: () => void;
}

export default function Dashboard({
  sermons,
  series,
  resources,
  agenda,
  onSelectSermon,
  onNavigateView,
  onCreateSermon
}: DashboardProps) {

  // Helper to format Brazilian date: "2026-06-15" -> "15/06/2026"
  const formatBrazilianDate = (dString: string) => {
    try {
      const portions = dString.split('-');
      if (portions.length === 3) {
        return `${portions[2]}/${portions[1]}/${portions[0]}`;
      }
      return dString;
    } catch {
      return dString;
    }
  };

  // Current statistics
  const stats = useMemo(() => {
    const totalSermons = sermons.length;
    const totalSeries = series.length;
    const totalResources = resources.length;
    
    // Count upcoming preachings (status 'agendado' and date is today or future)
    const upcomingPreachings = agenda.filter(entry => entry.status === 'agendado').length;

    return {
      totalSermons,
      totalSeries,
      upcomingPreachings,
      totalResources
    };
  }, [sermons, series, resources, agenda]);

  // Next preaching detail
  const nextPreaching = useMemo(() => {
    const upcoming = agenda
      .filter(entry => entry.status === 'agendado')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [agenda]);

  // Find sermon title for next preaching
  const nextPreachingSermon = useMemo(() => {
    if (!nextPreaching || !nextPreaching.sermonId) return null;
    return sermons.find(s => s.id === nextPreaching.sermonId) || null;
  }, [nextPreaching, sermons]);

  // Recent sermons (up to 3)
  const recentSermons = useMemo(() => {
    return [...sermons]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 3);
  }, [sermons]);

  // Tag frequency for thematic chart
  const topicDistribution = useMemo(() => {
    const tagCounts: { [key: string]: number } = {};
    sermons.forEach(sermon => {
      if (sermon.tags && Array.isArray(sermon.tags)) {
        sermon.tags.forEach(tag => {
          if (tag && tag.trim()) {
            const cleanTag = tag.trim().toLowerCase();
            tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(tagCounts)
      .map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5 tags
  }, [sermons]);

  // Smart prompt template for Sermon Idea suggestion
  const quickInspiration = useMemo(() => {
    const hour = new Date().getHours();
    let greeter = "Bom dia";
    if (hour >= 12 && hour < 18) greeter = "Boa tarde";
    else if (hour >= 18 || hour < 5) greeter = "Boa noite";

    const verses = [
      { text: "Prega a palavra, insta a tempo e fora de tempo, redargues, repreende, exorta, com toda a longanimidade e doutrina.", ref: "2 Timóteo 4:2" },
      { text: "Lâmpada para os meus pés é tua palavra e luz, para o meu caminho.", ref: "Salmo 119:105" },
      { text: "Antes, crescei na graça e conhecimento de nosso Senhor e Salvador, Jesus Cristo.", ref: "2 Pedro 3:18" },
      { text: "Buscai, pois, em primeiro lugar, o seu reino e a sua justiça, e todas estas coisas vos serão acrescentadas.", ref: "Mateus 6:33" }
    ];
    const pickedVerse = verses[Math.floor((new Date().getDate()) % verses.length)];

    return {
      greeter,
      verse: pickedVerse
    };
  }, []);

  return (
    <div id="pastor-dashboard" className="space-y-6 sm:space-y-8 animate-fade-in pb-12 font-sans">
      
      {/* Header and Quick Welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <span className="text-violet-600 font-extrabold text-xs uppercase tracking-widest block mb-1">Painel Pastoral</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Olá, Pastor! {quickInspiration.greeter}.
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Pronto para edificar a sua igreja hoje? Acesse rápido seus sermões e cuide dos detalhes do seu ministério.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button 
            id="dash-btn-new-sermon"
            onClick={onCreateSermon}
            className="flex items-center gap-2 px-5 py-3 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-all shadow-md active:scale-95"
          >
            <Plus size={16} />
            Novo Sermão
          </button>
          <button 
            id="dash-btn-schedule"
            onClick={() => onNavigateView('agenda')}
            className="flex items-center gap-2 px-5 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-bold border border-slate-200 transition-all active:scale-95"
          >
            <Calendar size={16} className="text-slate-400" />
            Agendar Culto
          </button>
        </div>
      </div>

      {/* Interactive Manual Quick Access Card */}
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100/85 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-violet-100/80 text-violet-700 rounded-xl mt-0.5">
            <Sparkles size={18} className="text-violet-600 animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-[10px] text-violet-700 uppercase tracking-widest block">Novo Recurso Recomendado!</span>
            <h4 className="text-sm font-black text-slate-800 mt-0.5 uppercase tracking-tight">Guia Ministerial Interativo & Simulador de IA</h4>
            <p className="text-xs text-slate-500 leading-normal mt-1 max-w-2xl">
              Aprenda a acelerar seu planejamento criando esboços guiados, integrando exegese do léxico grego/hebraico no sermão e navegando em suas séries de mensagens de modo dinâmico.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigateView('manual' as any)}
          className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-black rounded-xl transition-all shadow-md shrink-0 uppercase tracking-wider cursor-pointer"
        >
          Abrir Manual Completo <ChevronRight size={13} strokeWidth={3} />
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div 
          id="stat-sermons"
          onClick={() => onNavigateView('editor')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-violet-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center group-hover:bg-violet-100 transition-colors">
              <FileText size={20} />
            </div>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold font-mono">
              Ativos
            </span>
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total de Sermões</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">{stats.totalSermons}</p>
        </div>

        {/* Metric 2 */}
        <div 
          id="stat-series"
          onClick={() => onNavigateView('series')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-violet-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center group-hover:bg-pink-100 transition-colors">
              <Layers size={20} />
            </div>
            <span className="text-[10px] text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full font-bold font-mono">
              Estudos
            </span>
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Séries Ativas</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">{stats.totalSeries}</p>
        </div>

        {/* Metric 3 */}
        <div 
          id="stat-upcoming"
          onClick={() => onNavigateView('agenda')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-violet-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <Calendar size={20} />
            </div>
            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-bold font-mono">
              Agenda
            </span>
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pregações Agendadas</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">{stats.upcomingPreachings}</p>
        </div>

        {/* Metric 4 */}
        <div 
          id="stat-library"
          onClick={() => onNavigateView('library')}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-violet-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center group-hover:bg-sky-100 transition-colors">
              <BookOpen size={20} />
            </div>
            <span className="text-[10px] text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full font-bold font-mono">
              Teológico
            </span>
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Biblioteca Teológica</p>
          <p className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">{stats.totalResources}</p>
        </div>
      </div>

      {/* Grid: Next Preaching + Recent Sermons */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Next Preaching Card */}
        <div id="dash-next-preaching" className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} className="text-violet-500" /> Próxima Ministração
            </span>
            <button 
              onClick={() => onNavigateView('agenda')}
              className="text-[11px] text-violet-600 hover:text-violet-700 font-bold hover:underline transition-all"
            >
              Ver Todas
            </button>
          </div>
          
          <div className="p-6 flex-1 flex flex-col justify-between">
            {nextPreaching ? (
              <div className="space-y-4">
                <span className="inline-flex px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-700 rounded-md">
                  {nextPreaching.serviceType || 'Culto Geral'}
                </span>
                
                <div>
                  <h3 className="text-lg font-black text-slate-800 leading-tight">
                    {nextPreachingSermon ? nextPreachingSermon.title : "Nenhum sermão vinculado"}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin size={13} className="text-slate-400" /> {nextPreaching.location}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4.5 bg-slate-50 rounded-xl border border-slate-100/80">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Data</p>
                    <p className="text-sm font-bold text-slate-700">{formatBrazilianDate(nextPreaching.date)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Horário</p>
                    <p className="text-sm font-bold text-slate-700">{nextPreaching.time || "Não definido"}</p>
                  </div>
                </div>

                {nextPreachingSermon ? (
                  <button 
                    onClick={() => onSelectSermon(nextPreachingSermon.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-50 hover:bg-violet-100 text-violet-600 text-xs font-bold rounded-xl transition-all"
                  >
                    <PlayCircle size={14} />
                    Editar / Pregar este Sermão
                  </button>
                ) : (
                  <button 
                    onClick={() => onNavigateView('editor')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all"
                  >
                    Vincular Sermão Existente
                  </button>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-6 space-y-3">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                  <BookmarkCheck size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-700 text-sm">Sem pregações no horizonte</p>
                  <p className="text-xs text-slate-400 max-w-[200px] mt-0.5 mx-auto">Você não possui nenhuma ministração agendada para os próximos dias.</p>
                </div>
                <button 
                  onClick={() => onNavigateView('agenda')}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200 transition-all"
                >
                  Agendar Ministração
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Sermons List */}
        <div id="dash-recent-sermons" className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} className="text-violet-500" /> Sermões Recentes
            </span>
            <button 
              onClick={() => onNavigateView('editor')}
              className="text-[11px] text-violet-600 hover:text-violet-700 font-bold hover:underline transition-all"
            >
              Ver Todos
            </button>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-between">
            {recentSermons.length > 0 ? (
              <div className="space-y-3.5">
                {recentSermons.map((sermon) => {
                  // Find series name if available
                  const associatedSeries = series.find(ser => ser.id === sermon.seriesId);
                  
                  return (
                    <div 
                      key={sermon.id}
                      onClick={() => onSelectSermon(sermon.id)}
                      className="group p-3.5 rounded-xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50/30 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-violet-700 transition-colors">
                          {sermon.title || 'Sem título'}
                        </h4>
                        
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-slate-400 font-mono">
                            Modificado em {new Date(sermon.updatedAt).toLocaleDateString('pt-BR')}
                          </span>
                          {associatedSeries && (
                            <span className="inline-block px-2 py-0.5 text-[8px] font-black uppercase rounded-md bg-pink-50 text-pink-600">
                              Série: {associatedSeries.title}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="w-7 h-7 rounded-lg bg-slate-50 group-hover:bg-violet-100 group-hover:text-violet-700 text-slate-400 flex items-center justify-center transition-colors">
                        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-8 space-y-3">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                  <PlayCircle size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-700 text-sm">Biblioteca de sermões vazia</p>
                  <p className="text-xs text-slate-400 max-w-[240px] mt-0.5">Clique em "Novo Sermão" no topo para criar o seu primeiro rascunho esboçado.</p>
                </div>
                <button 
                  onClick={onCreateSermon}
                  className="px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-lg hover:bg-violet-700 transition-all"
                >
                  Rascunhar Sermão
                </button>
              </div>
            )}
            
            {recentSermons.length > 0 && (
              <div className="pt-4 mt-1 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 font-bold">
                <span>Roteiros salvos: {sermons.length}</span>
                <button 
                  onClick={onCreateSermon}
                  className="text-violet-600 text-xs font-black flex items-center gap-1 hover:underline hover:text-violet-700"
                >
                  Escrever Novo <ArrowRight size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Topic Distribution + Devotional Inspo */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">

        {/* Dynamic Topic Distribution (Horizonal Custom SVG/HTML Chart Bars) */}
        <div id="dash-thematic-focus" className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={14} className="text-violet-500" /> Temas Mais Pregados (IA Tags)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Fibras Temáticas</span>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-between">
            {topicDistribution.length > 0 ? (
              <div className="space-y-4">
                {topicDistribution.map((topic, idx) => {
                  // Percentage calculation relative to max frequency or total count
                  const totalCountSum = topicDistribution.reduce((acc, curr) => acc + curr.count, 0);
                  const percentage = totalCountSum > 0 ? (topic.count / totalCountSum) * 100 : 0;
                  const displayWidthPercent = `${Math.max(12, Math.min(percentage * 2, 100))}%`;
                  
                  return (
                    <div key={idx} className="space-y-1.5 cursor-default">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
                          {topic.name}
                        </span>
                        <span className="font-mono text-slate-400 text-[10px]">
                          {topic.count} {topic.count === 1 ? 'sermão' : 'sermões'}
                        </span>
                      </div>
                      
                      {/* Bar Track Container */}
                      <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-violet-500 rounded-full transition-all duration-500" 
                          style={{ width: displayWidthPercent }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-8 space-y-2">
                <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center text-violet-400">
                  <Tag size={16} />
                </div>
                <div>
                  <p className="font-bold text-slate-700 text-xs">Nenhum tema tagueado ainda</p>
                  <p className="text-[11px] text-slate-400 max-w-[200px] mt-0.5 mx-auto">Adicione tags aos seus sermões no editor teológico para extrair gráficos de foco pastoral.</p>
                </div>
              </div>
            )}
            
            <p className="text-[10px] text-slate-400 leading-normal mt-5 pt-3.5 border-t border-slate-50 flex items-center gap-1">
              <Sparkles size={11} className="text-violet-500 shrink-0" />
              O gráfico de barras acima indica os pilares focais ensinados no púlpito da igreja ou comunidade.
            </p>
          </div>
        </div>

        {/* Encouraging Verse card with elegant layout and UI elements */}
        <div id="dash-devotional-encouragement" className="lg:col-span-4 bg-gradient-to-br from-violet-900 to-indigo-950 text-white rounded-2xl p-6 flex flex-col justify-between shadow-lg border border-indigo-950">
          <div className="space-y-3">
            <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#a78bfa] bg-[#5c37f5]/30 py-1 px-2.5 rounded-md self-start w-fit">
              <Sparkles size={10} className="text-violet-300 animate-pulse" /> Palavra Exortativa
            </span>
            <div className="relative pt-1 pl-4 border-l-2 border-[#a78bfa]/50">
              <p className="text-sm font-medium leading-relaxed italic text-indigo-100 font-sans">
                "{quickInspiration.verse.text}"
              </p>
              <h5 className="text-[11px] font-black tracking-wider text-violet-300 uppercase mt-2.5 font-sans">
                — {quickInspiration.verse.ref}
              </h5>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-indigo-800/60 text-xs space-y-3">
            <p className="text-[#c4b5fd]/90 font-medium">
              Quer uma inspiração rápida para o culto de hoje? Crie um sermão temático auxiliado pela Inteligência Artificial.
            </p>
            <button 
              onClick={onCreateSermon}
              className="flex items-center gap-1.5 text-[#fff] hover:text-violet-200 transition-colors text-xs font-black uppercase tracking-wider group"
            >
              Criar Esboço Rápido
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
