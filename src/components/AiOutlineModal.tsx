import React, { useState, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Upload, 
  FileText, 
  File, 
  Loader2,
  Trash2,
  BookOpen,
  Info,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface AiOutlineModalProps {
  onClose: () => void;
  onGenerate: (theme: string, baseText: string, fileContent: string, userIdeias: string) => Promise<void>;
  isLoading: boolean;
}

interface AttachedFile {
  name: string;
  type: string;
  content: string;
  status: 'loading' | 'ready' | 'error';
}

export default function AiOutlineModal({ onClose, onGenerate, isLoading }: AiOutlineModalProps) {
  const [theme, setTheme] = useState('');
  const [baseText, setBaseText] = useState('');
  const [userIdeias, setUserIdeias] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const newFile: AttachedFile = {
        name: file.name,
        type: file.type,
        content: '',
        status: 'loading'
      };

      setAttachedFiles(prev => [...prev, newFile]);

      try {
        let content = '';
        if (file.type === 'application/pdf') {
          content = await extractTextFromPdf(file);
        } else {
          content = await readFileAsText(file);
        }

        setAttachedFiles(prev => prev.map(f => 
          f.name === file.name ? { ...f, content, status: 'ready' } : f
        ));
      } catch (err) {
        console.error("Erro ao ler arquivo:", err);
        setAttachedFiles(prev => prev.map(f => 
          f.name === file.name ? { ...f, status: 'error' } : f
        ));
      }
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  };

  const removeFile = (name: string) => {
    setAttachedFiles(prev => prev.filter(f => f.name !== name));
  };

  const handleGenerateClick = () => {
    if (!theme.trim()) {
      alert("Por favor, insira pelo menos um tema ou título.");
      return;
    }
    
    const combinedFileContent = attachedFiles
      .filter(f => f.status === 'ready')
      .map(f => `CONTEÚDO DO ARQUIVO (${f.name}):\n${f.content}`)
      .join('\n\n---\n\n');
      
    onGenerate(theme, baseText, combinedFileContent, userIdeias);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Gerador de Esboço Inteligente</h2>
              <p className="text-xs text-slate-400 font-medium tracking-tight">Crie mensagens estruturadas com ajuda da IA</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Topic Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <BookOpen size={12} className="text-orange-500" />
              Tema ou Título do Sermão
            </label>
            <input 
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Ex: O Poder da Oração, Superando a Ansiedade..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500/20 outline-none text-slate-800 font-bold transition-all placeholder:font-normal"
            />
          </div>

          {/* Base Text Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileText size={12} className="text-orange-500" />
              Texto Bíblico Base (Opcional)
            </label>
            <input 
              type="text"
              value={baseText}
              onChange={(e) => setBaseText(e.target.value)}
              placeholder="Ex: João 3:16, Salmo 23..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500/20 outline-none text-slate-700 transition-all font-medium"
            />
          </div>

          {/* User Ideas/Prompt */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Zap size={12} className="text-orange-500" />
              Minhas Ideias e Direcionamento (Seu Prompt)
            </label>
            <textarea 
              value={userIdeias}
              onChange={(e) => setUserIdeias(e.target.value)}
              placeholder="Descreva aqui o que você está pensando para este sermão, pontos específicos que quer abordar ou o estilo da mensagem..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500/20 outline-none text-slate-700 transition-all resize-none text-sm leading-relaxed"
            />
          </div>

          {/* Knowledge Base Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Upload size={12} className="text-orange-500" />
                Banco de Dados Particulares (Arquivos)
              </label>
              <span className="text-[10px] text-slate-400 px-2 py-0.5 bg-slate-100 rounded-full">TXT, PDF</span>
            </div>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="group border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-orange-200 hover:bg-orange-50/30 transition-all"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-orange-500 transition-all group-hover:scale-110">
                <Upload size={24} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-600">Arraste arquivos ou clique para anexar</p>
                <p className="text-[10px] text-slate-400">Use suas pregações antigas ou notas como referência</p>
              </div>
              <input 
                type="file"
                multiple
                accept=".txt,.pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>

            {/* File List */}
            <AnimatePresence>
              {attachedFiles.length > 0 && (
                <div className="space-y-2 mt-4">
                  {attachedFiles.map((f, idx) => (
                    <motion.div 
                      key={f.name + idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group"
                    >
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm">
                        {f.status === 'loading' ? (
                          <Loader2 size={16} className="animate-spin text-orange-500" />
                        ) : (
                          <File size={16} className={cn(f.type === 'application/pdf' ? 'text-red-500' : 'text-blue-500')} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{f.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-tighter">
                          {f.status === 'loading' ? 'Lendo conteúdo...' : f.status === 'error' ? 'Erro ao ler' : 'Pronto para uso'}
                        </p>
                      </div>
                      <button 
                        onClick={() => removeFile(f.name)}
                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-400 rounded-md transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-3">
            <Info size={18} className="text-orange-500 shrink-0" />
            <p className="text-xs text-orange-800 leading-relaxed font-medium">
              A IA analisará seus arquivos anexados para entender seu estilo e incorporar informações relevantes ao gerar o novo esboço.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 flex items-center justify-end gap-3">
          <button 
            disabled={isLoading}
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Cancelar
          </button>
          <button 
            disabled={isLoading || !theme.trim()}
            onClick={handleGenerateClick}
            className={cn(
              "flex items-center gap-2 px-8 py-2.5 rounded-2xl text-sm font-bold shadow-lg transition-all",
              isLoading || !theme.trim() 
                ? "bg-slate-300 text-white cursor-not-allowed" 
                : "bg-orange-600 text-white hover:bg-orange-700 shadow-orange-200"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Gerando Esboço...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Gerar com Inteligência
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
