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
  Loader2,
  Palette
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
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [fontSizeScale, setFontSizeScale] = useState(100);

  const PREACHING_COLORS = [
    { name: 'Padrão (Preto)', value: '#0f172a' },
    { name: 'Vermelho (Alerta/Urgente)', value: '#ef4444' },
    { name: 'Laranja (Ênfase)', value: '#f97316' },
    { name: 'Verde (Aplicação Prática)', value: '#10b981' },
    { name: 'Azul (Passagens/Estudos)', value: '#3b82f6' },
    { name: 'Violeta (Esboço/Séries)', value: '#8b5cf6' },
    { name: 'Rosa (Ilustração/Exemplo)', value: '#ec4899' },
  ];

  const HIGHLIGHT_COLORS = [
    { name: 'Sem Realce', value: 'transparent' },
    { name: 'Amarelo Leve', value: '#fef08a' },
    { name: 'Verde Leve', value: '#bbf7d0' },
    { name: 'Azul Leve', value: '#bfdbfe' },
    { name: 'Rosa Leve', value: '#fbcfe8' },
  ];

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
      }, 4000); // 4 seconds debounce for maximum quota conservation
      
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
      {/* Word-like Toolbar Redesigned */}
      <div className="border-b border-slate-200 bg-[#eef4f8] p-3 sticky top-0 z-20 shadow-sm overflow-x-auto no-scrollbar">
        <div className="flex flex-col gap-2.5 min-w-max">
          {/* Row 1: Primary Formatting */}
          <div className="flex items-center gap-2">
            
            {/* Bold, Italic, Underline */}
            <div className="flex items-center gap-1 bg-white/50 rounded-lg p-0.5 border border-[#d3dfeb]">
              <button
                // @ts-ignore
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn(
                  "w-8 h-8 rounded text-sm font-bold transition-all flex items-center justify-center",
                  editor.isActive('bold') 
                    ? "bg-violet-600 text-white shadow-sm" 
                    : "text-slate-700 hover:bg-white/60"
                )}
                title="Negrito"
              >
                B
              </button>
              <button
                // @ts-ignore
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn(
                  "w-8 h-8 rounded text-sm italic transition-all flex items-center justify-center",
                  editor.isActive('italic') 
                    ? "bg-violet-600 text-white shadow-sm" 
                    : "text-slate-700 hover:bg-white/60"
                )}
                title="Itálico"
              >
                /
              </button>
              <button
                // @ts-ignore
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={cn(
                  "w-8 h-8 rounded text-sm underline transition-all flex items-center justify-center",
                  editor.isActive('underline') 
                    ? "bg-violet-600 text-white shadow-sm" 
                    : "text-slate-700 hover:bg-white/60"
                )}
                title="Sublinhado"
              >
                U
              </button>
            </div>

            {/* Text Color (A) */}
            <div className="relative flex items-center bg-white/50 rounded-lg border border-[#d3dfeb] p-0.5">
              <button
                onClick={() => {
                  setShowColorPicker(!showColorPicker);
                  setShowHighlightPicker(false);
                }}
                className={cn(
                  "px-2 py-0.5 rounded hover:bg-white/60 transition-all flex items-center gap-1 h-8",
                  showColorPicker && "bg-white/80 shadow-sm"
                )}
                title="Cor do Texto"
              >
                <div className="flex flex-col items-center">
                  <span className="font-bold text-xs leading-none text-slate-800">A</span>
                  <div 
                    className="w-3.5 h-[3px] rounded-sm mt-0.5" 
                    style={{ backgroundColor: editor.getAttributes('textStyle').color || '#0f172a' }} 
                  />
                </div>
                <ChevronDown size={10} className="text-slate-500" />
              </button>
              
              {showColorPicker && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowColorPicker(false)} />
                  <div className="absolute top-full left-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-2.5 z-40 grid grid-cols-4 gap-1.5 w-40 pointer-events-auto">
                    {PREACHING_COLORS.map((color) => {
                      const isActive = editor.isActive('textStyle', { color: color.value });
                      return (
                        <button
                          key={color.value}
                          onClick={() => {
                            if (color.value === '#0f172a') {
                              // @ts-ignore
                              editor.commands.unsetColor();
                            } else {
                              // @ts-ignore
                              editor.commands.setColor(color.value);
                            }
                            setShowColorPicker(false);
                            editor.commands.focus();
                          }}
                          className={cn(
                            "w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shrink-0",
                            isActive && "ring-2 ring-violet-500 ring-offset-1"
                          )}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        >
                          {isActive && <Check size={10} className="text-white mix-blend-difference" />}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => {
                        // @ts-ignore
                        editor.commands.unsetColor();
                        setShowColorPicker(false);
                        editor.commands.focus();
                      }}
                      className="col-span-4 text-[10px] font-bold text-slate-500 hover:text-slate-700 py-1 hover:bg-slate-100 rounded text-center transition-colors mt-1"
                    >
                      Remover Cor
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Highlighter (✏️) */}
            <div className="relative flex items-center bg-white/50 rounded-lg border border-[#d3dfeb] p-0.5">
              <button
                onClick={() => {
                  setShowHighlightPicker(!showHighlightPicker);
                  setShowColorPicker(false);
                }}
                className={cn(
                  "px-2 py-0.5 rounded hover:bg-white/60 transition-all flex items-center gap-1 h-8",
                  showHighlightPicker && "bg-white/80 shadow-sm"
                )}
                title="Cor do Realce (Marca-texto)"
              >
                <div className="flex flex-col items-center">
                  <Highlighter size={13} className="text-slate-700" />
                  <div 
                    className="w-3.5 h-[3px] rounded-sm mt-0.5" 
                    style={{ backgroundColor: editor.getAttributes('highlight').color || 'transparent' }} 
                  />
                </div>
                <ChevronDown size={10} className="text-slate-500" />
              </button>
              
              {showHighlightPicker && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowHighlightPicker(false)} />
                  <div className="absolute top-full left-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-2.5 z-40 grid grid-cols-5 gap-1.5 w-44 pointer-events-auto">
                    {HIGHLIGHT_COLORS.map((color) => {
                      const isActive = color.value === 'transparent' 
                        ? !editor.isActive('highlight')
                        : editor.isActive('highlight', { color: color.value });
                      return (
                        <button
                          key={color.value}
                          onClick={() => {
                            if (color.value === 'transparent') {
                              // @ts-ignore
                              editor.commands.unsetHighlight();
                            } else {
                              // @ts-ignore
                              editor.commands.setHighlight({ color: color.value });
                            }
                            setShowHighlightPicker(false);
                            editor.commands.focus();
                          }}
                          className={cn(
                            "w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shrink-0",
                            isActive && "ring-2 ring-violet-500 ring-offset-1"
                          )}
                          style={{ backgroundColor: color.value === 'transparent' ? '#f1f5f9' : color.value }}
                          title={color.name}
                        >
                          {color.value === 'transparent' && <span className="text-[9px] text-slate-400">✖</span>}
                          {isActive && color.value !== 'transparent' && <Check size={10} className="text-slate-800" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Separator | */}
            <div className="w-px h-6 bg-slate-300 mx-1" />

            {/* Headings / Block types: Normal, Título, Subtítulo, Tópico, Citação */}
            <div className="flex items-center gap-1 bg-white/50 rounded-lg border border-[#d3dfeb] p-0.5">
              <button
                // @ts-ignore
                onClick={() => editor.chain().focus().setParagraph().run()}
                className={cn(
                  "px-3 py-1.5 rounded text-xs transition-colors font-medium h-8 flex items-center",
                  (!editor.isActive('heading') && !editor.isActive('blockquote'))
                    ? "bg-white text-slate-900 shadow-sm font-semibold border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                )}
                title="Normal"
              >
                Normal
              </button>
              <button
                // @ts-ignore
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={cn(
                  "px-3 py-1.5 rounded text-xs transition-colors font-medium h-8 flex items-center",
                  editor.isActive('heading', { level: 1 })
                    ? "bg-white text-slate-900 shadow-sm font-semibold border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                )}
                title="Título Principal"
              >
                Título
              </button>
              <button
                // @ts-ignore
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={cn(
                  "px-3 py-1.5 rounded text-xs transition-colors font-medium h-8 flex items-center",
                  editor.isActive('heading', { level: 2 })
                    ? "bg-white text-slate-900 shadow-sm font-semibold border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                )}
                title="Subtítulo"
              >
                Subtítulo
              </button>
              <button
                // @ts-ignore
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={cn(
                  "px-3 py-1.5 rounded text-xs transition-colors font-medium h-8 flex items-center",
                  editor.isActive('heading', { level: 3 })
                    ? "bg-white text-slate-900 shadow-sm font-semibold border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                )}
                title="Tópico / Cabeçalho 3"
              >
                Tópico
              </button>
              <button
                // @ts-ignore
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={cn(
                  "px-3 py-1.5 rounded text-xs italic transition-colors font-medium h-8 flex items-center",
                  editor.isActive('blockquote')
                    ? "bg-white text-slate-900 shadow-sm font-semibold border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                )}
                title="Citação"
              >
                Citação
              </button>
            </div>

            {/* Separator | */}
            <div className="w-px h-6 bg-slate-300 mx-1" />

            {/* Bullet List & Ordered List */}
            <div className="flex items-center gap-1 bg-white/50 rounded-lg border border-[#d3dfeb] p-0.5">
              <button
                // @ts-ignore
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn(
                  "w-8 h-8 rounded flex items-center justify-center transition-all",
                  editor.isActive('bulletList')
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                )}
                title="Lista com Marcadores"
              >
                <List size={16} />
              </button>
              <button
                // @ts-ignore
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={cn(
                  "w-8 h-8 rounded flex items-center justify-center transition-all",
                  editor.isActive('orderedList')
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                )}
                title="Lista Numerada"
              >
                <ListOrdered size={16} />
              </button>
            </div>

            {/* Separator | */}
            <div className="w-px h-6 bg-slate-300 mx-1" />

            {/* Scale Zoom Controls - 100% + */}
            <div className="flex items-center gap-1 bg-white/50 rounded-lg border border-[#d3dfeb] p-0.5 h-9 select-none">
              <button
                onClick={() => setFontSizeScale(prev => Math.max(80, prev - 10))}
                className="w-6 h-6 rounded hover:bg-white/60 flex items-center justify-center font-bold text-slate-600 text-base active:scale-95 transition-all"
                title="Diminuir tamanho do texto"
              >
                -
              </button>
              <span className="text-xs font-semibold text-slate-700 w-12 text-center">
                {fontSizeScale}%
              </span>
              <button
                onClick={() => setFontSizeScale(prev => Math.min(200, prev + 10))}
                className="w-6 h-6 rounded hover:bg-white/60 flex items-center justify-center font-bold text-slate-600 text-base active:scale-95 transition-all"
                title="Aumentar tamanho do texto"
              >
                +
              </button>
            </div>

          </div>

          {/* Row 2: Undo, Redo & Custom Actions */}
          <div className="flex items-center justify-between border-t border-slate-300/40 pt-2 flex-wrap gap-2">
            
            {/* Undo / Redo & Highlights */}
            <div className="flex items-center gap-3">
              <button
                // @ts-ignore
                onClick={() => editor.chain().focus().undo().run()}
                // @ts-ignore
                disabled={!editor.can().undo()}
                className="text-xs text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors font-bold px-2 py-1 rounded hover:bg-white/60 flex items-center gap-1"
                title="Desfazer"
              >
                Desfazer
              </button>
              <button
                // @ts-ignore
                onClick={() => editor.chain().focus().redo().run()}
                // @ts-ignore
                disabled={!editor.can().redo()}
                className="text-xs text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors font-bold px-2 py-1 rounded hover:bg-white/60 flex items-center gap-1"
                title="Refazer"
              >
                Refazer
              </button>

              <div className="w-px h-4 bg-slate-200" />

              {/* Special Blocks (Ilustração, Aplicação, Acervo) */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => insertSpecialBlock('illustration')}
                  className="px-2.5 py-1 bg-amber-50 text-amber-800 text-[10px] font-black uppercase rounded border border-amber-200 hover:bg-amber-100 transition-colors shrink-0"
                >
                  Ilustração
                </button>
                <button
                  onClick={() => insertSpecialBlock('application')}
                  className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase rounded border border-emerald-200 hover:bg-emerald-100 transition-colors shrink-0"
                >
                  Aplicação
                </button>
                <button
                  onClick={() => onAiAction('thematic', '')}
                  className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-800 text-[10px] font-black uppercase rounded border border-purple-200 hover:bg-purple-100 transition-colors shrink-0"
                  title="Análise Temática de Acervo"
                >
                  <History size={11} />
                  Acervo
                </button>
              </div>
            </div>

            {/* Save Status & Share / Copy / Greek Hebrew */}
            <div className="flex items-center gap-1.5">
              {isSaving && (
                <div className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-400 italic">
                  <Loader2 size={11} className="animate-spin" />
                  A guardar...
                </div>
              )}
              
              <button
                onClick={handleDeepLexicon}
                disabled={isLexiconLoading}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-[10px] font-bold shrink-0 shadow-sm",
                  isLexiconLoading ? "bg-slate-100 animate-pulse" : "bg-slate-900 text-white hover:bg-slate-800"
                )}
                title="Análise Exegética IA da Palavra Selecionada"
              >
                <GreekIcon size={12} />
                <span>{isLexiconLoading ? "Analisando..." : "Hebraico/Grego"}</span>
              </button>
              
              <button
                onClick={handleCopyText}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-[10px] font-bold shrink-0 border",
                  copied ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? "Copiado!" : "Copiar"}</span>
              </button>
              
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-[10px] font-bold shrink-0 shadow-sm"
              >
                <Share2 size={12} />
                <span>Partilhar</span>
              </button>
            </div>

          </div>

        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 lg:px-8 pt-6 sm:pt-8 pb-1">
          {/* Preaching time & homiletical status indicators */}
          {(() => {
            const rawText = editor ? editor.getText() : '';
            const words = rawText.split(/\s+/).filter(Boolean).length;
            const estimatedMins = Math.max(1, Math.ceil(words / 130));
            return (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                  ⏱️ Estimativa: ~{estimatedMins} min
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                  ✍️ {words} palavras
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black tracking-wider text-violet-600 bg-violet-50 px-2.5 py-1 rounded-md">
                  💡 Análise Homilética Ativa
                </span>
              </div>
            );
          })()}

          <div className="flex items-center justify-between gap-2 sm:gap-4 mb-2">
            <input 
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Título do Sermão"
              className="flex-1 text-xl sm:text-2xl lg:text-4xl font-black text-slate-900 border-none focus:ring-0 placeholder:text-slate-200 bg-transparent min-w-0"
            />
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => onAiAction('titles', '')}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-all text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-sm"
                title="Gerar Sugestões de Título"
              >
                <Wand2 size={14} />
                <span className="hidden sm:inline">IA Títulos</span>
              </button>
              <button
                onClick={() => onAiAction('pgm', '')}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-sm"
                title="Gerar Roteiro de PGM (Igreja Multiplicadora)"
              >
                <MessageSquare size={14} />
                <span className="hidden sm:inline">Roteiro PGM</span>
              </button>
            </div>
          </div>
          <div className="w-16 sm:w-20 h-1 sm:h-1.5 bg-violet-600 rounded-full mb-6 sm:mb-8" />
        </div>
        
        <div style={{ fontSize: `${fontSizeScale}%` }} className="transition-all duration-200 origin-top-left">
          <EditorContent editor={editor} />
        </div>
        
        {/* Bible Smart Suggestion */}
        <AnimatePresence>
          {bibleSuggest && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-white border border-slate-200 shadow-2xl rounded-2xl p-2 flex items-center gap-2"
            >
              <div className="px-3 py-1.5 bg-violet-50 rounded-lg text-[10px] font-black text-violet-700 uppercase tracking-tight">
                Referência Detectada: {bibleSuggest.query}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleBibleInsert}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-[10px] font-bold hover:bg-violet-700 transition-all"
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
                <span className="text-[10px] font-black uppercase tracking-widest text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded">
                  {lexiconTooltip.term.language}
                </span>
                <span className="font-serif text-lg text-slate-300">{lexiconTooltip.term.original}</span>
              </div>
              
              <h4 className="font-black text-sm mb-1">{lexiconTooltip.term.term}: <span className="text-violet-300 font-bold">{lexiconTooltip.term.meaning}</span></h4>
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
                className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all flex items-center justify-center gap-2"
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-[10px] font-bold transition-all text-violet-400"
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

