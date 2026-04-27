import { EditorContent, useEditor, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';
import { Sparkles, Type, Heading1, Heading2, List, ListOrdered, Quote } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  onAiAction: (action: string, selectedText: string) => void;
}

export default function Editor({ content, onChange, onAiAction }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Comece a escrever seu sermão aqui... Use / para comandos (em breve) ou selecione texto para ações de IA.',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[70vh] px-4 py-8 bg-white selection:bg-orange-100',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="relative w-full border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="border-bottom border-slate-100 p-2 flex items-center gap-1 bg-slate-50/50 sticky top-0 z-10">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn("p-2 rounded hover:bg-slate-200 transition-colors", editor.isActive('heading', { level: 1 }) && "bg-slate-200")}
          title="Título 1"
        >
          <Heading1 size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn("p-2 rounded hover:bg-slate-200 transition-colors", editor.isActive('heading', { level: 2 }) && "bg-slate-200")}
          title="Título 2"
        >
          <Heading2 size={18} />
        </button>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn("p-2 rounded hover:bg-slate-200 transition-colors", editor.isActive('bulletList') && "bg-slate-200")}
          title="Lista"
        >
          <List size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn("p-2 rounded hover:bg-slate-200 transition-colors", editor.isActive('orderedList') && "bg-slate-200")}
          title="Lista Numerada"
        >
          <ListOrdered size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn("p-2 rounded hover:bg-slate-200 transition-colors", editor.isActive('blockquote') && "bg-slate-200")}
          title="Citação"
        >
          <Quote size={18} />
        </button>
      </div>

      <EditorContent editor={editor} />

      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1 bg-slate-900 text-white rounded-lg shadow-xl p-1 overflow-hidden"
          >
            <button
              onClick={() => onAiAction('expand', editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to))}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              <Sparkles size={14} className="text-orange-400" />
              Expandir com IA
            </button>
            <div className="w-px h-4 bg-slate-700" />
            <button
              onClick={() => onAiAction('context', editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to))}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              Contexto Histórico
            </button>
          </motion.div>
        </BubbleMenu>
      )}
    </div>
  );
}
