import { EditorContent, useEditor, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { BibleReference } from '../lib/TiptapBible';
import { Lexicon } from '../lib/TiptapLexicon';
import { LexiconTerm } from '../constants/lexicon';
import { useEffect, useState, useRef } from 'react';
import { 
  Sparkles, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  Quote, 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Link as LinkIcon,
  Table as TableIcon,
  CheckSquare,
  Minus,
  Code,
  Undo,
  Redo,
  Share2,
  Copy,
  Check,
  ChevronDown,
  FileDown,
  Lightbulb,
  Zap,
  BookOpen,
  MessageSquare,
  Languages,
  Wand2,
  Type,
  History,
  Languages as GreekIcon,
  Presentation,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { exportToWord, exportToPdf } from '../lib/export';
import { parseBibleReference, fetchBibleVerses } from '../lib/bible';
import { getLexiconDetails } from '../lib/gemini';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  onAiAction: (action: string, selectedText: string) => void;
  title: string;
  onTitleChange: (title: string) => void;
  sermonId?: string | null;
  readOnly?: boolean;
}

export default function Editor({ content, onChange, onAiAction, title, onTitleChange, sermonId, readOnly = false }: EditorProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [lexiconTooltip, setLexiconTooltip] = useState<{ term: LexiconTerm, pos: { left: number, top: number } } | null>(null);
  const [bibleSuggest, setBibleSuggest] = useState<{ query: string, range: { from: number, to: number } } | null>(null);
  const [isLexiconLoading, setIsLexiconLoading] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: {
          HTMLAttributes: {
            class: 'bible-scripture',
          },
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight,
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: 'Comece a escrever seu sermão aqui... Use a barra de ferramentas acima para formatar.',
      }),
      BibleReference.configure({
        // Optional: disable automatic insertion if we want manual only
      }),
      Lexicon.configure({
        onHover: (term, pos) => setLexiconTooltip({ term, pos }),
        onLeave: () => setLexiconTooltip(null),
      }),
    ] as any[],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setIsSaving(true);
      
      // Debounce the call to onChange to save Firestore write quota
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        onChange(html);
        setIsSaving(false);
      }, 2500); // Wait 2.5 seconds of inactivity to save
      
      // Auto-detect Bible references for floating button
      const { selection } = editor.state;
      const { $from } = selection;
      const textBefore = $from.parent.textContent;
      const regex = /((?:[1-3]?\s*)?[a-zA-ZáàâãéèêíïóòôõúùûçÁÀÂÃÉÈÊÍÏÓÒÔÕÚÙÛÇ]{2,})\s+(\d+)(?:[:.](\d+))?(?:-(\d+))?$/i;
      const match = textBefore.match(regex);

      if (match && match[0].length > 3) {
        setBibleSuggest({
          query: match[0],
          range: { from: $from.pos - match[0].length, to: $from.pos }
        });
      } else {
        setBibleSuggest(null);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[70vh] px-4 lg:px-8 pb-12 bg-white selection:bg-orange-100',
      },
    },
  });

  const handleBibleInsert = async () => {
    if (!editor || !bibleSuggest) return;
    const parsed = parseBibleReference(bibleSuggest.query);
    if (!parsed) return;

    const verses = await fetchBibleVerses(parsed);
    if (verses) {
      editor.chain()
        .focus()
        .deleteRange(bibleSuggest.range)
        .insertContent(`
          <blockquote>
            <p>"${verses.text}"</p>
            <p>— ${verses.reference}</p>
          </blockquote>
          <p></p>
        `)
        .run();
      setBibleSuggest(null);
    }
  };

  const handleBibleSlide = () => {
    if (!editor || !bibleSuggest) return;
    onAiAction('slides', `Crie um slide especial para este versículo: ${bibleSuggest.query}`);
    setBibleSuggest(null);
  };

  const handleDeepLexicon = async () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to).trim();
    if (!selectedText) {
      alert("Selecione uma palavra para análise léxica profunda.");
      return;
    }

    setIsLexiconLoading(true);
    try {
      const details = await getLexiconDetails(selectedText, editor.getText().substring(Math.max(0, from - 200), Math.min(editor.getText().length, to + 200)));
      if (details) {
        setLexiconTooltip({
          term: {
            term: selectedText,
            original: details.original,
            language: details.language,
            meaning: details.meaning,
            explanation: details.explanation
          },
          pos: { left: window.innerWidth / 2 - 100, top: window.innerHeight / 2 - 100 }
        });
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao consultar dicionário teológico IA.");
    } finally {
      setIsLexiconLoading(false);
    }
  };

  // Keep editor in sync if content prop changes outside (e.g. AI generation or shared load)
  useEffect(() => {
    if (editor && content !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [readOnly, editor]);

  if (!editor) return null;

  const setLink = () => {
    const url = window.prompt('URL');
    if (url) {
      // @ts-ignore
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const insertSpecialBlock = (type: 'illustration' | 'application' | 'exegese') => {
    const configs = {
      illustration: { label: 'ILUSTRAÇÃO', color: 'amber' },
      application: { label: 'APLICAÇÃO', color: 'emerald' },
      exegese: { label: 'EXEGESE', color: 'blue' }
    };
    const { label, color } = configs[type];
    
    // Using simple HTML structure that Tiptap StarterKit usually handles well
    // We'll use blockquotes or just styled paragraphs if allowed
    editor.chain().focus().insertContent(`
      <blockquote>
        <p><strong>${label}:</strong> Digite aqui sua ${type === 'illustration' ? 'ilustração' : type === 'application' ? 'aplicação prática' : 'análise exegética'}...</p>
      </blockquote>
    `).run();
  };

  const handleCopyText = () => {
    const text = editor.getText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareUrl = sermonId 
      ? `${window.location.origin}${window.location.pathname}?sermon=${sermonId}`
      : window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Sermão: ${title}`,
          text: `Confira meu esboço de sermão: ${title}`,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: Copy link
      navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      alert('Link do sermão copiado para a área de transferência!');
    }
  };

  return (
    <div className="relative w-full border border-slate-200 rounded-xl bg-white shadow-lg overflow-hidden flex flex-col h-full">
      {/* Word-like Toolbar */}
      <div className="border-b border-slate-200 p-1 flex items-center bg-slate-50 sticky top-0 z-20 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-0.5 min-w-max">
          <div className="flex items-center gap-0.5 px-1 border-r border-slate-200">
            <button
              // @ts-ignore
              onClick={() => editor.chain().focus().undo().run()}
              // @ts-ignore
              disabled={!editor.can().undo()}
              className="p-1.5 rounded hover:bg-slate-200 transition-colors disabled:opacity-30"
              title="Desfazer"
            >
              <Undo size={16} />
            </button>
            <button
              // @ts-ignore
              onClick={() => editor.chain().focus().redo().run()}
              // @ts-ignore
              disabled={!editor.can().redo()}
              className="p-1.5 rounded hover:bg-slate-200 transition-colors disabled:opacity-30"
              title="Refazer"
            >
              <Redo size={16} />
            </button>
          </div>

          <div className="flex items-center gap-0.5 px-1 border-r border-slate-200">
            <button
              // @ts-ignore
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={cn("p-1.5 rounded hover:bg-slate-200 transition-colors", editor.isActive('heading', { level: 1 }) && "bg-slate-200 text-orange-600")}
              title="Título 1"
            >
              <Heading1 size={16} />
            </button>
            <button
              // @ts-ignore
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={cn("p-1.5 rounded hover:bg-slate-200 transition-colors", editor.isActive('heading', { level: 2 }) && "bg-slate-200 text-orange-600")}
              title="Título 2"
            >
              <Heading2 size={16} />
            </button>
          </div>

          <div className="flex items-center gap-0.5 px-1 border-r border-slate-200">
            <button
              // @ts-ignore
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn("p-1.5 rounded hover:bg-slate-200 transition-colors font-bold", editor.isActive('bold') && "bg-slate-200 text-orange-600")}
              title="Negrito"
            >
              <Bold size={16} />
            </button>
            <button
              // @ts-ignore
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn("p-1.5 rounded hover:bg-slate-200 transition-colors italic", editor.isActive('italic') && "bg-slate-200 text-orange-600")}
              title="Itálico"
            >
              <Italic size={16} />
            </button>
            <button
              // @ts-ignore
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={cn("p-1.5 rounded hover:bg-slate-200 transition-colors", editor.isActive('underline') && "bg-slate-200 text-orange-600")}
              title="Sublinhado"
            >
              <UnderlineIcon size={16} />
            </button>
          </div>

          <div className="flex items-center gap-0.5 px-1 border-r border-slate-200">
            <button
              // @ts-ignore
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={cn("p-1.5 rounded hover:bg-slate-200 transition-colors", editor.isActive({ textAlign: 'left' }) && "bg-slate-200 text-orange-600")}
              title="Alinhar à Esquerda"
            >
              <AlignLeft size={16} />
            </button>
            <button
              // @ts-ignore
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={cn("p-1.5 rounded hover:bg-slate-200 transition-colors", editor.isActive({ textAlign: 'center' }) && "bg-slate-200 text-orange-600")}
              title="Centralizar"
            >
              <AlignCenter size={16} />
            </button>
          </div>

          <div className="flex items-center gap-1 ml-1 px-1">
            <button
              onClick={() => insertSpecialBlock('illustration')}
              className="px-2 py-1 bg-amber-50 text-amber-700 text-[9px] font-black uppercase rounded border border-amber-100 hover:bg-amber-100 transition-colors shrink-0"
            >
              Ilustração
            </button>
            <button
              onClick={() => insertSpecialBlock('application')}
              className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase rounded border border-emerald-100 hover:bg-emerald-100 transition-colors shrink-0"
            >
              Aplicação
            </button>
            <button
              onClick={() => onAiAction('thematic', '')}
              className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 text-purple-700 text-[9px] font-black uppercase rounded border border-purple-100 hover:bg-purple-100 transition-colors shrink-0"
              title="Análise Temática de Acervo"
            >
              <History size={12} />
              Acervo
            </button>
          </div>

          <div className="ml-auto flex items-center gap-1.5 px-1 border-l border-slate-200">
            {isSaving && (
              <div className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold text-slate-400 italic">
                <Loader2 size={12} className="animate-spin" />
                A guardar...
              </div>
            )}
            <button
              onClick={handleDeepLexicon}
              disabled={isLexiconLoading}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-[10px] font-bold shadow-sm shrink-0",
                isLexiconLoading ? "bg-slate-100 animate-pulse" : "bg-slate-900 text-white hover:bg-slate-800"
              )}
              title="Análise Exegética IA da Palavra Selecionada"
            >
              <GreekIcon size={14} />
              <span className="hidden sm:inline">{isLexiconLoading ? "Analisando..." : "Hebraico/Grego"}</span>
            </button>
            <button
              onClick={handleCopyText}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-[10px] font-bold shadow-sm shrink-0",
                copied ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span className="hidden sm:inline">{copied ? "Copiado!" : "Copiar"}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-[10px] font-bold shadow-sm shrink-0"
            >
              <Share2 size={14} />
              <span className="hidden sm:inline">Partilhar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 lg:px-8 pt-6 sm:pt-12">
          <div className="flex items-center justify-between gap-2 sm:gap-4 mb-2">
            <input 
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Título do Sermão"
              className="flex-1 text-xl sm:text-2xl lg:text-4xl font-black text-slate-900 border-none focus:ring-0 placeholder:text-slate-200 bg-transparent min-w-0"
            />
            <button
              onClick={() => onAiAction('titles', '')}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-all text-[9px] sm:text-[10px] font-black uppercase tracking-wider shrink-0 shadow-sm"
              title="Gerar Sugestões de Título"
            >
              <Wand2 size={14} />
              <span className="hidden sm:inline">IA Títulos</span>
            </button>
          </div>
          <div className="w-16 sm:w-20 h-1 sm:h-1.5 bg-orange-500 rounded-full mb-6 sm:mb-8" />
        </div>
        <EditorContent editor={editor} />
        
        {/* Bible Smart Suggestion */}
        <AnimatePresence>
          {bibleSuggest && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-white border border-slate-200 shadow-2xl rounded-2xl p-2 flex items-center gap-2"
            >
              <div className="px-3 py-1.5 bg-orange-50 rounded-lg text-[10px] font-black text-orange-700 uppercase tracking-tight">
                Referência Detectada: {bibleSuggest.query}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleBibleInsert}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-[10px] font-bold hover:bg-orange-700 transition-all"
                >
                  <Zap size={12} />
                  Inserir Texto
                </button>
                <button
                  onClick={handleBibleSlide}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-slate-800 transition-all"
                >
                  <Presentation size={12} />
                  Criar Slide
                </button>
                <button
                  onClick={() => setBibleSuggest(null)}
                  className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lexicon Tooltip */}
        <AnimatePresence>
          {lexiconTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed z-[100] w-[85vw] sm:w-64 bg-slate-900 text-white rounded-xl shadow-2xl p-4 border border-slate-700 pointer-events-auto"
              style={{ 
                left: Math.max(10, Math.min(lexiconTooltip.pos.left, window.innerWidth - (window.innerWidth < 640 ? window.innerWidth * 0.9 : 280))), 
                top: Math.max(80, lexiconTooltip.pos.top - 180)
              }}
              onMouseEnter={() => {}} // Keep open when hovering the tooltip itself if needed
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded">
                  {lexiconTooltip.term.language}
                </span>
                <span className="font-serif text-lg text-slate-300">{lexiconTooltip.term.original}</span>
              </div>
              
              <h4 className="font-black text-sm mb-1">{lexiconTooltip.term.term}: <span className="text-orange-300 font-bold">{lexiconTooltip.term.meaning}</span></h4>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                {lexiconTooltip.term.explanation}
              </p>
              
              <button
                onClick={() => {
                  if (editor) {
                    editor.commands.insertContent(` (${lexiconTooltip.term.term}: ${lexiconTooltip.term.meaning}) `);
                    setLexiconTooltip(null);
                  }
                }}
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all flex items-center justify-center gap-2"
              >
                <Zap size={12} />
                Inserir Significado
              </button>

              <div className="absolute -bottom-2 left-6 w-4 h-4 bg-slate-900 border-r border-b border-slate-700 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {editor && (
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ 
            duration: 100,
            offset: [0, 40], // Increased offset to clear native menus
            zIndex: 9999,
          }}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="flex flex-wrap items-center gap-0.5 bg-slate-900 border border-slate-800 text-white rounded-xl shadow-2xl p-1.5 overflow-hidden max-w-[85vw] sm:max-w-none"
          >
            <button
              onClick={() => onAiAction('expand', editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to))}
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-[10px] font-bold transition-all text-orange-400"
              title="Expandir com IA"
            >
              <Sparkles size={12} />
              Expandir
            </button>
            <button
              onClick={() => onAiAction('context', editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to))}
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-[10px] font-bold transition-all"
              title="Análise Exegética"
            >
              <BookOpen size={12} className="text-blue-400" />
              Exegese
            </button>
            <button
              onClick={() => onAiAction('illustrations', editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to))}
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-[10px] font-bold transition-all"
              title="Sugerir Ilustrações"
            >
              <Lightbulb size={12} className="text-amber-400" />
              Ilustrar
            </button>
            <button
              onClick={() => onAiAction('simplify', editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to))}
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-[10px] font-bold transition-all"
              title="Simplificar Linguagem"
            >
              <Zap size={12} className="text-emerald-400" />
              Simplificar
            </button>
            <button
              onClick={() => onAiAction('translate', editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to))}
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-[10px] font-bold transition-all"
              title="Traduzir ou Consultar"
            >
              <Languages size={12} className="text-purple-400" />
              Traduzir
            </button>
          </motion.div>
        </BubbleMenu>
      )}
    </div>
  );
}

