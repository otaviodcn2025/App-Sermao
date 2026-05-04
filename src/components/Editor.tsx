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
import { useEffect, useState } from 'react';
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
  Type
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { exportToWord, exportToPdf } from '../lib/export';

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
      BibleReference,
      Lexicon.configure({
        onHover: (term, pos) => setLexiconTooltip({ term, pos }),
        onLeave: () => setLexiconTooltip(null),
      }),
    ] as any[],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[70vh] px-4 lg:px-8 pb-12 bg-white selection:bg-orange-100',
      },
    },
  });

  // Keep editor in sync if content prop changes outside (e.g. AI generation or shared load)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
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
    <div className="relative w-full border border-slate-200 rounded-xl bg-white shadow-lg overflow-hidden flex flex-col">
      {/* Word-like Toolbar */}
      <div className="border-b border-slate-200 p-1 flex flex-wrap items-center gap-0.5 bg-slate-50 sticky top-0 z-20">
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
          <button
            // @ts-ignore
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn("p-1.5 rounded hover:bg-slate-200 transition-colors", editor.isActive('strike') && "bg-slate-200 text-orange-600")}
            title="Riscado"
          >
            <Strikethrough size={16} />
          </button>
          <button
            // @ts-ignore
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={cn("p-1.5 rounded hover:bg-slate-200 transition-colors", editor.isActive('highlight') && "bg-slate-200 text-orange-600")}
            title="Destacar"
          >
            <Highlighter size={16} />
          </button>
          <button
            // @ts-ignore
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn("p-1.5 rounded hover:bg-slate-200 transition-colors", editor.isActive('code') && "bg-slate-200 text-orange-600")}
            title="Código"
          >
            <Code size={16} />
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
          <button
            // @ts-ignore
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={cn("p-1.5 rounded hover:bg-slate-200 transition-colors", editor.isActive({ textAlign: 'right' }) && "bg-slate-200 text-orange-600")}
            title="Alinhar à Direita"
          >
            <AlignRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-0.5 px-1 border-r border-slate-200">
          <button
            // @ts-ignore
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn("p-1.5 rounded hover:bg-slate-200 transition-colors", editor.isActive('bulletList') && "bg-slate-200 text-orange-600")}
            title="Lista com Marcadores"
          >
            <List size={16} />
          </button>
          <button
            // @ts-ignore
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn("p-1.5 rounded hover:bg-slate-200 transition-colors", editor.isActive('orderedList') && "bg-slate-200 text-orange-600")}
            title="Lista Numerada"
          >
            <ListOrdered size={16} />
          </button>
          <button
            // @ts-ignore
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={cn("p-1.5 rounded hover:bg-slate-200 transition-colors", editor.isActive('taskList') && "bg-slate-200 text-orange-600")}
            title="Lista de Tarefas"
          >
            <CheckSquare size={16} />
          </button>
        </div>

        <div className="flex items-center gap-0.5 px-1 border-r border-slate-200">
          <button
            // @ts-ignore
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn("p-1.5 rounded hover:bg-slate-200 transition-colors", editor.isActive('blockquote') && "bg-slate-200 text-orange-600")}
            title="Citação"
          >
            <Quote size={16} />
          </button>
          <button
            onClick={setLink}
            className={cn("p-1.5 rounded hover:bg-slate-200 transition-colors", editor.isActive('link') && "bg-slate-200 text-orange-600")}
            title="Link"
          >
            <LinkIcon size={16} />
          </button>
          <button
            // @ts-ignore
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            className={cn("p-1.5 rounded hover:bg-slate-200 transition-colors")}
            title="Inserir Tabela"
          >
            <TableIcon size={16} />
          </button>
          <button
            // @ts-ignore
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className={cn("p-1.5 rounded hover:bg-slate-200 transition-colors")}
            title="Linha Horizontal"
          >
            <Minus size={16} />
          </button>
        </div>

        <div className="flex items-center gap-0.5 px-1 bg-orange-50/50 rounded-lg mx-1 border border-orange-100">
          <button
            onClick={() => insertSpecialBlock('illustration')}
            className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-amber-100 text-amber-700 transition-all text-[10px] font-black uppercase tracking-wider"
            title="Inserir Ilustração"
          >
            <Lightbulb size={14} className="text-amber-500" />
            <span className="hidden lg:inline">Ilustração</span>
          </button>
          <button
            onClick={() => insertSpecialBlock('application')}
            className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-emerald-100 text-emerald-700 transition-all text-[10px] font-black uppercase tracking-wider"
            title="Inserir Aplicação"
          >
            <Zap size={14} className="text-emerald-500" />
            <span className="hidden lg:inline">Aplicação</span>
          </button>
          <button
            onClick={() => insertSpecialBlock('exegese')}
            className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-blue-100 text-blue-700 transition-all text-[10px] font-black uppercase tracking-wider"
            title="Inserir Exegese"
          >
            <BookOpen size={14} className="text-blue-500" />
            <span className="hidden lg:inline">Exegese</span>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-1.5 px-1 border-l border-slate-200">
          <button
            onClick={handleCopyText}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-xs font-bold shadow-sm",
              copied ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
            title="Copiar Texto"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span className="hidden sm:inline">{copied ? "Copiado!" : "Copiar"}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-xs font-bold shadow-sm"
            title="Compartilhar"
          >
            <Share2 size={14} />
            <span className="hidden sm:inline">Compartilhar</span>
          </button>
          <div className="w-px h-6 bg-slate-200 mx-0.5" />
          <button
            onClick={() => exportToWord(title, editor.getHTML())}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-bold shadow-sm"
            title="Baixar para Word (.docx)"
          >
            <FileDown size={14} />
            <span className="hidden sm:inline">Word</span>
          </button>
          <button
            onClick={() => exportToPdf(title, editor.getHTML())}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs font-bold shadow-sm"
            title="Baixar para PDF (.pdf)"
          >
            <FileDown size={14} />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 lg:px-8 pt-12">
          <div className="flex items-center justify-between gap-4 mb-2">
            <input 
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Título do Sermão"
              className="flex-1 text-2xl lg:text-4xl font-black text-slate-900 border-none focus:ring-0 placeholder:text-slate-200 bg-transparent"
            />
            <button
              onClick={() => onAiAction('titles', '')}
              className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-all text-[10px] font-black uppercase tracking-wider shrink-0 shadow-sm"
              title="Gerar Sugestões de Título"
            >
              <Wand2 size={14} />
              <span className="hidden sm:inline">IA Títulos</span>
            </button>
          </div>
          <div className="w-20 h-1.5 bg-orange-500 rounded-full mb-8" />
        </div>
        <EditorContent editor={editor} />
        
        {/* Lexicon Tooltip */}
        <AnimatePresence>
          {lexiconTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed z-[100] w-64 bg-slate-900 text-white rounded-xl shadow-2xl p-4 border border-slate-700 pointer-events-auto"
              style={{ 
                left: Math.min(lexiconTooltip.pos.left, window.innerWidth - 280), 
                top: lexiconTooltip.pos.top - 180
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
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-wrap items-center gap-0.5 bg-slate-900 border border-slate-800 text-white rounded-xl shadow-2xl p-1 overflow-hidden max-w-[90vw] sm:max-w-none"
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

