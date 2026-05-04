import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { THEOLOGICAL_LEXICON } from '../constants/lexicon';

export interface LexiconOptions {
  onHover?: (term: any, pos: { left: number, top: number }) => void;
  onLeave?: () => void;
}

export const Lexicon = Extension.create<LexiconOptions>({
  name: 'lexicon',

  addOptions() {
    return {
      onHover: () => {},
      onLeave: () => {},
    };
  },

  addProseMirrorProps() {
    const { onHover, onLeave } = this.options;
    
    return {
      handleDOMEvents: {
        mouseover: (view, event) => {
          const target = event.target as HTMLElement;
          if (target.classList.contains('lexicon-term')) {
            const termName = target.getAttribute('data-term');
            const term = THEOLOGICAL_LEXICON.find(t => t.term === termName);
            if (term) {
              const rect = target.getBoundingClientRect();
              onHover?.(term, { 
                left: rect.left + window.scrollX, 
                top: rect.top + window.scrollY 
              });
            }
          } else {
            onLeave?.();
          }
          return false;
        },
        mouseleave: () => {
          onLeave?.();
          return false;
        }
      }
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('lexicon'),
        state: {
          init() { return DecorationSet.empty; },
          apply(tr, set) {
            // We re-calculate on every change or doc update
            // For production with huge docs, we should optimize this
            const doc = tr.doc;
            const decorations: Decoration[] = [];
            
            doc.descendants((node, pos) => {
              if (node.isText) {
                const text = node.text || '';
                THEOLOGICAL_LEXICON.forEach(item => {
                  const regex = new RegExp(`\\b${item.term}\\b`, 'gi');
                  let match;
                  while ((match = regex.exec(text)) !== null) {
                    const from = pos + match.index;
                    const to = from + match[0].length;
                    decorations.push(
                      Decoration.inline(from, to, {
                        class: 'lexicon-term cursor-help border-b-2 border-dotted border-orange-300',
                        'data-term': item.term
                      })
                    );
                  }
                });
              }
            });
            
            return DecorationSet.create(doc, decorations);
          }
        },
        props: {
          decorations(state) {
            return this.getState(state);
          }
        }
      })
    ];
  }
});
