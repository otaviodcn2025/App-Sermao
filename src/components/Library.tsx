import React, { useState, useRef } from 'react';
import { 
  Book, 
  Plus, 
  FileText, 
  Link as LinkIcon, 
  Trash2, 
  Search, 
  Upload, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Eye,
  ChevronLeft,
  Maximize2,
  Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Resource } from '@/src/types';
import * as pdfjs from 'pdfjs-dist';
// @ts-ignore - Vite specific import for worker URL
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Configuração do Worker do PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

import Reader from './Reader';

interface LibraryProps {
  resources: Resource[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  userApproved: boolean;
}

// Componente de Capa de Livro Gerada Dinamicamente
function BookCover({ title, type }: { title: string, type: 'pdf' | 'epub' | 'link' }) {
  const colors = [
    'from-slate-700 to-slate-900',
    'from-blue-700 to-blue-900',
    'from-emerald-700 to-emerald-900',
    'from-indigo-700 to-indigo-900',
    'from-violet-700 to-violet-900',
    'from-orange-700 to-orange-900',
    'from-rose-700 to-rose-900',
    'from-amber-700 to-amber-900',
  ];

  // Gera um índice determinístico baseado no título
  const colorIndex = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const color = colors[colorIndex];

  return (
    <div className={cn(
      "relative w-full aspect-[3/4] rounded-xl overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-500 bg-gradient-to-br",
      color
    )}>
      {/* Detalhes da Capa */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-4 w-px h-full bg-white/30" />
        <div className="absolute top-0 right-4 w-px h-full bg-white/30" />
      </div>

      <div className="absolute inset-0 flex flex-col p-4 justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Book size={10} className="text-white" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">
              {type === 'epub' ? 'ePub Edition' : 'Digital Volume'}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-white font-black text-sm leading-tight tracking-tight line-clamp-4 drop-shadow-md">
            {title}
          </h4>
          <div className="h-0.5 w-8 bg-white/40 rounded-full" />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-[8px] font-bold text-white/40 uppercase tracking-widest">
            Logos AI Lib
          </div>
          <FileText size={14} className="text-white/30" />
        </div>
      </div>
      
      {/* Efeito de brilho/luz */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 pointer-events-none" />
      <div className="absolute -inset-full group-hover:translate-x-full group-hover:translate-y-full bg-gradient-to-br from-white/0 via-white/10 to-white/0 transition-all duration-1000 rotate-45 pointer-events-none" />
    </div>
  );
}

export default function Library({ resources, onUpload, onDelete, userApproved }: LibraryProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isReadingMode, setIsReadingMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.pdf') || file.name.toLowerCase().endsWith('.epub')) {
      setIsUploading(true);
      try {
        await onUpload(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
        console.error('Erro no upload:', error);
        alert('Erro ao processar o arquivo. Verifique sua conexão.');
      } finally {
        setIsUploading(false);
      }
    } else {
      alert('Por favor, envie apenas arquivos PDF ou ePub.');
    }
  };

  const filteredResources = resources.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleUpdatePosition = async (resourceId: string, position: number) => {
    try {
      const resourceRef = doc(db, 'resources', resourceId);
      await updateDoc(resourceRef, {
        lastReadPosition: position
      });
    } catch (error) {
      console.warn('Erro ao salvar posição de leitura:', error);
    }
  };

  const handleAddHighlight = async (resourceId: string, highlight: any) => {
    try {
      const resource = (resources || []).find(r => r.id === resourceId);
      if (!resource) return;

      const currentHighlights = resource.highlights || [];
      const updatedHighlights = [...currentHighlights, highlight];

      const resourceRef = doc(db, 'resources', resourceId);
      await updateDoc(resourceRef, {
        highlights: updatedHighlights
      });
    } catch (error) {
      console.error('Erro ao adicionar marcador:', error);
    }
  };

  const handleDeleteHighlight = async (resourceId: string, highlightId: string) => {
    try {
      const resource = (resources || []).find(r => r.id === resourceId);
      if (!resource) return;

      const updatedHighlights = (resource.highlights || []).filter(h => h.id !== highlightId);

      const resourceRef = doc(db, 'resources', resourceId);
      await updateDoc(resourceRef, {
        highlights: updatedHighlights
      });
    } catch (error) {
      console.error('Erro ao remover marcador:', error);
    }
  };

  const currentResource = selectedResource ? resources.find(r => r.id === selectedResource.id) || selectedResource : null;

  if (currentResource && isReadingMode) {
    return (
      <Reader 
        resource={currentResource} 
        onUpdatePosition={(pos) => handleUpdatePosition(currentResource.id, pos)}
        onAddHighlight={(h) => handleAddHighlight(currentResource.id, h)}
        onDeleteHighlight={(id) => handleDeleteHighlight(currentResource.id, id)}
        onClose={() => {
          setIsReadingMode(false);
          setSelectedResource(null);
        }} 
      />
    );
  }

  if (currentResource) {
    return (
      <div className="flex flex-col h-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-4 border-b flex items-center justify-between gap-4 bg-slate-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedResource(null)}
              className="p-2 hover:bg-white rounded-full transition-colors text-slate-600"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h2 className="font-black text-slate-800 tracking-tight">{currentResource.title}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visão Geral</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsReadingMode(true)}
            className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200"
          >
            <Maximize2 size={14} />
            Modo Kindle
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 lg:p-12">
          <div className="max-w-3xl mx-auto prose prose-slate">
            {currentResource.summary && (
              <div className="mb-12 p-6 bg-orange-50 rounded-3xl border border-orange-100">
                <div className="flex items-center gap-2 mb-4 text-orange-800">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 size={18} />
                  </div>
                  <h3 className="font-black text-sm uppercase tracking-widest">Resumo da IA Pastoral</h3>
                </div>
                <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap italic">
                  {currentResource.summary}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mb-6">
              <FileText size={18} className="text-slate-400" />
              <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">Conteúdo Extraído</h3>
            </div>
            
            {currentResource.extractedText ? (
              <div className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-slate-700">
                {currentResource.extractedText}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 italic">
                <AlertCircle size={48} className="mb-4 opacity-20" />
                <p>O texto deste documento ainda está sendo processado ou está vazio.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Minha Biblioteca</h1>
          <p className="text-slate-500 font-medium">Gerencie seus PDFs e alimente sua IA com conhecimento teológico.</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.epub"
            className="hidden"
          />
          {!userApproved && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-100 italic">
              <AlertCircle size={14} />
              Aguardando Aprovação de Admin
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || !userApproved}
            className={cn(
              "flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-orange-100 hover:bg-orange-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
              isUploading && "animate-pulse"
            )}
          >
            {isUploading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Plus size={20} />
            )}
            {isUploading ? "Processando..." : "Novo Livro (PDF/ePub)"}
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Pesquisar na biblioteca..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-medium"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredResources.map((resource) => (
            <motion.div
              key={resource.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group flex flex-col gap-3"
            >
              <div 
                onClick={() => setSelectedResource(resource)}
                className="cursor-pointer"
              >
                <BookCover title={resource.title} type={resource.type} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 
                    onClick={() => setSelectedResource(resource)}
                    className="font-bold text-slate-800 text-sm truncate cursor-pointer hover:text-orange-600 transition-colors"
                  >
                    {resource.title}
                  </h3>
                  <button
                    onClick={() => onDelete(resource.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Excluir"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {resource.type === 'epub' ? 'ePub' : 'PDF'}
                  </span>
                  {resource.lastReadPosition !== undefined && resource.lastReadPosition > 0 && (
                    <span className="flex items-center gap-0.5 text-[9px] font-black uppercase tracking-widest text-orange-500">
                      <Bookmark size={8} /> {Math.round(resource.lastReadPosition * 100)}%
                    </span>
                  )}
                  <span className="text-[9px] font-bold text-slate-300 ml-auto">
                    {new Date(resource.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Indexado</span>
                  </div>
                  <button
                    onClick={() => setSelectedResource(resource)}
                    className="text-[9px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    Abrir <Eye size={10} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredResources.length === 0 && !isUploading && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[40px]">
            <Book size={48} className="mb-4 opacity-20" />
            <p className="font-bold text-slate-500">Sua biblioteca está vazia</p>
            <p className="text-sm">Envie um PDF ou ePub para começar sua coleção de consulta.</p>
          </div>
        )}

        {isUploading && (
          <div className="p-5 rounded-3xl border border-slate-100 bg-slate-50 animate-pulse flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-200 rounded-2xl flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
            <div className="flex-1">
              <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
              <div className="h-3 w-20 bg-slate-200 rounded" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
