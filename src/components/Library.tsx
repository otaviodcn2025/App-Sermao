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
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Configuração do Worker do PDF.js
const PDFJS_VERSION = '3.11.174';
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

import Reader from './Reader';

interface LibraryProps {
  resources: Resource[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  userApproved: boolean;
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

    if (file.type !== 'application/pdf') {
      alert('Por favor, envie apenas arquivos PDF.');
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao processar o PDF. Tente um arquivo menor ou verifique sua conexão.');
    } finally {
      setIsUploading(false);
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
      // We don't use handleFirestoreError here to avoid interrupting the reading flow with errors
    }
  };

  if (selectedResource && isReadingMode) {
    return (
      <Reader 
        resource={selectedResource} 
        onUpdatePosition={(pos) => handleUpdatePosition(selectedResource.id, pos)}
        onClose={() => {
          setIsReadingMode(false);
          setSelectedResource(null);
        }} 
      />
    );
  }

  if (selectedResource) {
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
              <h2 className="font-black text-slate-800 tracking-tight">{selectedResource.title}</h2>
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
            {selectedResource.summary && (
              <div className="mb-12 p-6 bg-orange-50 rounded-3xl border border-orange-100">
                <div className="flex items-center gap-2 mb-4 text-orange-800">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 size={18} />
                  </div>
                  <h3 className="font-black text-sm uppercase tracking-widest">Resumo da IA Pastoral</h3>
                </div>
                <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap italic">
                  {selectedResource.summary}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mb-6">
              <FileText size={18} className="text-slate-400" />
              <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">Conteúdo Extraído</h3>
            </div>
            
            {selectedResource.extractedText ? (
              <div className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-slate-700">
                {selectedResource.extractedText}
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
            accept=".pdf"
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
            {isUploading ? "Processando..." : "Novo Livro (PDF)"}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredResources.map((resource) => (
            <motion.div
              key={resource.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group relative bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                  <FileText size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate leading-tight mb-1">{resource.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">PDF</span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    {resource.lastReadPosition !== undefined && resource.lastReadPosition > 0 && (
                      <>
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-orange-500">
                          <Bookmark size={10} /> {Math.round(resource.lastReadPosition * 100)}% Lidos
                        </span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                      </>
                    )}
                    <span className="text-[10px] font-bold text-slate-400">
                      {new Date(resource.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Pronto para IA</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedResource(resource)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    title="Visualizar"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(resource.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
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
            <p className="text-sm">Envie um PDF para começar sua coleção de consulta.</p>
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
