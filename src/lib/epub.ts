import ePub from 'epubjs';
import { withTimeout } from './utils';

export async function extractTextFromEpub(file: File): Promise<{ text: string, toc: { title: string, charOffset: number }[] }> {
  return withTimeout(
    (async () => {
      console.log(`Iniciando extração de ePub: ${file.name}`);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const book = ePub(arrayBuffer);
        await book.ready;
        console.log('ePub carregado. Iniciando leitura da espinha (spine)...');

        let fullText = '';
        let toc: { title: string, charOffset: number }[] = [];
        
        // Extract TOC before processing spine to know titles
        try {
          const nav = await book.navigation;
          if (nav && nav.toc) {
            const flattenNav = (items: any[]) => {
              items.forEach(item => {
                if (item.label) {
                  toc.push({ title: item.label.trim(), charOffset: -1 });
                }
                if (item.subitems && item.subitems.length > 0) {
                  flattenNav(item.subitems);
                }
              });
            };
            flattenNav(nav.toc);
          }
        } catch (navErr) {
          console.warn('Erro ao ler navegação do ePub:', navErr);
        }

        const spine = book.spine;
        const totalItems = (spine as any).length;

        for (let i = 0; i < totalItems; i++) {
          const item = (spine as any).get(i);
          if (item) {
            try {
              await item.load(book.load.bind(book));
              const document = item.document;
              if (document) {
                const body = document.querySelector('body');
                if (body) {
                  const scripts = body.querySelectorAll('script, style');
                  scripts.forEach((s: any) => s.remove());
                  
                  const text = body.innerText || body.textContent || '';
                  fullText += text + '\n\n';
                }
              }
              item.unload();
            } catch (itemErr) {
              console.warn(`Erro ao processar item ${i+1} do ePub:`, itemErr);
            }
          }
          
          if (fullText.length > 600000) {
            console.warn('Limite de segurança de 600k caracteres atingido para ePub. Parando extração.');
            break;
          }
        }

        if (!fullText.trim()) {
          throw new Error('Não foi possível extrair texto deste arquivo ePub.');
        }

        // Map TOC titles closer to their positions in the combined text
        toc = toc.map(item => {
          const offset = fullText.indexOf(item.title);
          return { ...item, charOffset: offset };
        }).filter(item => item.charOffset !== -1);

        console.log(`Extração de ePub concluída. Caracteres: ${fullText.length}. TOC: ${toc.length}`);
        return { text: fullText, toc };
      } catch (error) {
        console.error('Erro ao processar ePub:', error);
        throw error;
      }
    })(),
    45000,
    'O processamento do ePub demorou muito e foi interrompido.'
  );
}
