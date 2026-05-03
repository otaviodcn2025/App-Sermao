import { Extension, InputRule } from '@tiptap/core';
import { parseBibleReference, fetchBibleVerses } from './bible';

export const BibleReference = Extension.create({
  name: 'bibleReference',

  addInputRules() {
    return [
      new InputRule({
        find: /((?:[1-3]?\s+)?[a-zA-ZáéíóúÁÉÍÓÚçÇ]{2,})\s+(\d+)(?:[:.](\d+))?(?:-(\d+))?\s$/,
        handler: async ({ state, range, match }) => {
          const query = match[0].trim();
          const parsed = parseBibleReference(query);
          
          if (!parsed) return null;

          const verses = await fetchBibleVerses(parsed);
          if (verses) {
            this.editor.chain()
              .focus()
              .deleteRange(range)
              .insertContent(`
                <blockquote class="bible-scripture border-l-4 border-orange-500 pl-4 my-6 bg-orange-50/30 p-4 rounded-r-lg">
                  <p class="italic text-slate-700 leading-relaxed">"${verses.text}"</p>
                  <p class="text-right text-xs font-bold text-orange-600 mt-2">— ${verses.reference}</p>
                </blockquote>
                <p></p>
              `)
              .run();
          }
          return null;
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
        
        // Get text of the current line before cursor
        const textBefore = $from.parent.textContent;
        
        // Regex for bible reference at the end of string
        const regex = /((?:[1-3]?\s+)?[a-zA-ZáéíóúÁÉÍÓÚçÇ]{2,})\s+(\d+)(?:[:.](\d+))?(?:-(\d+))?$/i;
        const match = textBefore.match(regex);
        
        if (match) {
          const query = match[0].trim();
          const parsed = parseBibleReference(query);
          
          if (parsed) {
            // Calculate ranges
            const from = $from.pos - match[0].length;
            const to = $from.pos;
            
            fetchBibleVerses(parsed).then(verses => {
              if (verses) {
                editor.chain()
                  .focus()
                  .deleteRange({ from, to })
                  .insertContent(`
                    <blockquote class="bible-scripture border-l-4 border-orange-500 pl-4 my-6 bg-orange-50/30 p-4 rounded-r-lg">
                      <p class="italic text-slate-700 leading-relaxed">"${verses.text}"</p>
                      <p class="text-right text-xs font-bold text-orange-600 mt-2">— ${verses.reference}</p>
                    </blockquote>
                    <p></p>
                  `)
                  .run();
              }
            });
            return true; // We handled it
          }
        }
        
        return false;
      },
      Space: ({ editor }) => {
        // Tiptap InputRules handle Space by default if it's the trigger character
        // but we can also handle it here if needed.
        // For now, let the InputRule handle it as it's cleaner.
        return false;
      }
    };
  },
});
