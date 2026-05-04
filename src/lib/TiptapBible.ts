import { Extension, InputRule } from '@tiptap/core';
import { parseBibleReference, fetchBibleVerses } from './bible';

export const BibleReference = Extension.create({
  name: 'bibleReference',

  addInputRules() {
    return [
      new InputRule({
        find: /((?:[1-3]?\s*)?[a-zA-ZáàâãéèêíïóòôõúùûçÁÀÂÃÉÈÊÍÏÓÒÔÕÚÙÛÇ]{2,})\s+(\d+)(?:[:.](\d+))?(?:-(\d+))?\s$/,
        handler: async ({ state, range, match }) => {
          const query = match[1].trim() + " " + match[2] + (match[3] ? ":" + match[3] : "") + (match[4] ? "-" + match[4] : "");
          const parsed = parseBibleReference(query);
          
          if (!parsed) return null;

          const verses = await fetchBibleVerses(parsed);
          if (verses) {
            this.editor.chain()
              .focus()
              .deleteRange(range)
              .insertContent(`
                <blockquote>
                  <p>"${verses.text}"</p>
                  <p>— ${verses.reference}</p>
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

  addProseMirrorProps() {
    return {
      handleDragOver: (_view, event) => {
        if (event.dataTransfer?.types.includes('application/bible-verse')) {
          event.preventDefault();
          return true;
        }
        return false;
      },
      handleDrop: (view, event, _slice, moved) => {
        const bibleData = event.dataTransfer?.getData('application/bible-verse');
        if (!moved && bibleData) {
          event.preventDefault();
          event.stopPropagation();
          
          try {
            const data = JSON.parse(bibleData);
            const { text, reference } = data;
            
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
            const pos = coordinates ? coordinates.pos : view.state.selection.from;
            
            const content = `
              <blockquote>
                <p>"${text}"</p>
                <p>— ${reference}</p>
              </blockquote>
              <p></p>
            `;
            
            this.editor.commands.insertContentAt(pos, content);
            this.editor.commands.focus();
            
            return true;
          } catch (e) {
            console.error('Error parsing bible verse drop data:', e);
          }
        }
        return false;
      },
    };
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
        const regex = /((?:[1-3]?\s*)?[a-zA-ZáàâãéèêíïóòôõúùûçÁÀÂÃÉÈÊÍÏÓÒÔÕÚÙÛÇ]{2,})\s+(\d+)(?:[:.](\d+))?(?:-(\d+))?$/i;
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
                    <blockquote>
                      <p>"${verses.text}"</p>
                      <p>— ${verses.reference}</p>
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
