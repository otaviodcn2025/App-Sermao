import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Plus, 
  Trash2, 
  Link2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Edit2, 
  Bookmark, 
  ChevronRight,
  Sparkles,
  Layers,
  CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../lib/utils';
import { Sermon, AgendaEntry } from '../types';

interface PreachingScheduleProps {
  sermons: Sermon[];
  agenda: AgendaEntry[];
  onCreateEntry: (entry: Omit<AgendaEntry, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  onUpdateEntry: (id: string, updates: Partial<AgendaEntry>) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
  onSelectSermon: (sermonId: string) => void;
}

export default function PreachingSchedule({
  sermons,
  agenda,
  onCreateEntry,
  onUpdateEntry,
  onDeleteEntry,
  onSelectSermon
}: PreachingScheduleProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [serviceType, setServiceType] = useState('Culto de Domingo');
  const [selectedSermonId, setSelectedSermonId] = useState('');
  const [notes, setNotes] = useState('');

  const [filter, setFilter] = useState<'todos' | 'agendado' | 'realizado'>('todos');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !location) {
      alert('Por favor, informe pelo menos a data e o local da pregação.');
      return;
    }

    try {
      await onCreateEntry({
        date,
        time: time || undefined,
        location,
        serviceType,
        sermonId: selectedSermonId || null,
        status: 'agendado',
        notes: notes || undefined
      });

      // Reset
      setDate('');
      setTime('');
      setLocation('');
      setServiceType('Culto de Domingo');
      setSelectedSermonId('');
      setNotes('');
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao agendar compromisso.');
    }
  };

  // Group preaching slots chronologically
  const sortedAgenda = [...agenda].sort((a, b) => b.date.localeCompare(a.date));
  
  const filteredAgenda = sortedAgenda.filter(item => {
    if (filter === 'todos') return true;
    return item.status === filter;
  });

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

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="text-xs font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-2.5 py-1 rounded-full">Painel de Agenda</span>
          <h2 className="text-2xl font-black text-slate-800 mt-2">Agenda de Pregações</h2>
          <p className="text-slate-500 text-sm">Organize suas mensagens agendando os cultos, locais e pregações associadas.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg hover:shadow-violet-100 active:scale-95 text-center shrink-0"
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />}
          {showAddForm ? 'Cancelar' : 'Agendar Pregação'}
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
              <CalendarDays className="text-violet-600" size={18} />
              Preencha os dados do Culto
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Data</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Horário (Opcional)</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Local / Igreja</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Templo Central, Congregação Norte"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tipo de Culto (Liturgia)</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                  >
                    <option value="Culto de Domingo">Culto de Domingo</option>
                    <option value="Estudo de Doutrina">Estudo de Doutrina</option>
                    <option value="Culto de Jovens">Culto de Jovens</option>
                    <option value="Culto de Mulheres">Culto de Mulheres</option>
                    <option value="Reunião de Oração">Reunião de Oração</option>
                    <option value="Conferência / Congresso">Conferência / Congresso</option>
                    <option value="Casamento / Formatura">Casamento / Formatura</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mensagem / Sermão Associado (Opcional)</label>
                <select
                  value={selectedSermonId}
                  onChange={(e) => setSelectedSermonId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer"
                >
                  <option value="">-- Vincular nenhum esboço no momento --</option>
                  {sermons.map(s => (
                    <option key={s.id} value={s.id}>{s.title || 'Esboço Sem Título'}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Notas Pastorais ou Avisos (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Observações especiais, pedidos de oração da congregação, ou avisos da liturgia..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  Adicionar Evento
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs */}
      <div className="flex bg-slate-100/60 p-1 rounded-xl w-fit border border-slate-200/50">
        {(['todos', 'agendado', 'realizado'] as const).map(option => (
          <button
            key={option}
            onClick={() => setFilter(option)}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-lg transition-all capitalize",
              filter === option 
                ? "bg-white text-violet-700 shadow-sm" 
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            {option === 'todos' ? 'Todos os Compromissos' : option === 'agendado' ? 'Agendados' : 'Pregados / Realizados'}
          </button>
        ))}
      </div>

      {filteredAgenda.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-150 rounded-2xl shadow-inner max-w-2xl mx-auto">
          <CalendarDays size={48} className="text-slate-200 mx-auto mb-4" />
          <h4 className="text-slate-800 font-bold text-base">Nenhum compromisso agendado</h4>
          <p className="text-slate-400 text-xs mt-1 px-8">Você ainda não agendou datas de pregações. Agende um culto para monitorar suas pregações no tempo correto!</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all active:scale-95"
          >
            Agendar Agora
          </button>
        </div>
      ) : (
        <div className="max-w-4xl space-y-6">
          <div className="relative border-l-2 border-violet-100 pl-6 ml-4 space-y-8">
            {filteredAgenda.map(item => {
              const matchedSermon = sermons.find(s => s.id === item.sermonId);
              return (
                <div key={item.id} className="relative group">
                  {/* Timeline bullet */}
                  <div className={cn(
                    "absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-4 border-white transition-all scale-100 group-hover:scale-125 shadow-sm",
                    item.status === 'realizado' ? "bg-emerald-500 ring-2 ring-emerald-100" : "bg-violet-600 ring-2 ring-violet-100"
                  )} />

                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:border-slate-300/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-black uppercase text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">
                          {item.serviceType}
                        </span>
                        
                        <span className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                          item.status === 'realizado' ? "bg-emerald-50 text-emerald-700" : 
                          item.status === 'cancelado' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {item.status}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                        <MapPin size={15} className="text-slate-400 shrink-0" />
                        {item.location}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{formatBrazilianDate(item.date)}</span>
                        </div>
                        {item.time && (
                          <div className="flex items-center gap-1">
                            <Clock size={13} className="text-slate-400" />
                            <span>{item.time}h</span>
                          </div>
                        )}
                      </div>

                      {item.notes && (
                        <p className="text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-lg p-2.5 italic mt-1 leading-relaxed">
                          "{item.notes}"
                        </p>
                      )}

                      {/* Linked Sermon indicator */}
                      <div className="pt-2">
                        {matchedSermon ? (
                          <div 
                            onClick={() => onSelectSermon(matchedSermon.id)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-slate-700 hover:text-violet-700 rounded-xl text-xs cursor-pointer transition-all"
                          >
                            <Link2 size={13} className="text-violet-500" />
                            <span className="font-bold">Sermão:</span>
                            <span className="truncate max-w-[180px] sm:max-w-sm">{matchedSermon.title || 'Esboço Sem Título'}</span>
                            <ChevronRight size={12} className="opacity-60" />
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 font-bold italic">
                            Nenhum sermão associado. Edite para vincular e estudar.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions and Status Switches */}
                    <div className="flex md:flex-col items-center justify-end gap-2 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 shrink-0">
                      {item.status === 'agendado' && (
                        <button
                          onClick={() => onUpdateEntry(item.id, { status: 'realizado' })}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase transition-all shadow-sm"
                          title="Marcar como já Pregado"
                        >
                          <CheckCircle2 size={12} />
                          Marcar Pregado
                        </button>
                      )}
                      {item.status === 'realizado' && (
                        <button
                          onClick={() => onUpdateEntry(item.id, { status: 'agendado' })}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase transition-all"
                          title="Voltar para status Agendado"
                        >
                          Marcar Agendado
                        </button>
                      )}

                      <button
                        onClick={() => onDeleteEntry(item.id)}
                        className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all md:ml-auto"
                        title="Excluir do Calendário"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
