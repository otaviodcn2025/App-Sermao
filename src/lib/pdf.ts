import * as pdfjs from 'pdfjs-dist';
import { withTimeout } from './utils';

// Usar o worker local importado via Vite para consistência e confiabilidade
// @ts-ignore - Vite specific import for worker URL
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function extractTextFromPdf(file: File): Promise<{ text: string, toc: { title: string, charOffset: number }[] }> {
  return withTimeout(
    (async () => {
      console.log(`Iniciando extração de PDF: ${file.name}`);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ 
          data: arrayBuffer,
          useSystemFonts: true,
          disableFontFace: false
        });
        
        const pdf = await loadingTask.promise;
        console.log(`PDF carregado. Páginas: ${pdf.numPages}`);
        
        // Extract TOC (Outline) if available
        let toc: { title: string, charOffset: number }[] = [];
        try {
          const outline = await pdf.getOutline();
          if (outline) {
            // Flatten the hierarchical PDF outline
            const flattenOutline = (items: any[]) => {
              items.forEach(item => {
                if (item.title) {
                  toc.push({ title: item.title, charOffset: -1 });
                }
                if (item.items && item.items.length > 0) {
                  flattenOutline(item.items);
                }
              });
            };
            flattenOutline(outline);
            console.log(`Outline found with ${toc.length} items`);
          }
        } catch (tocErr) {
          console.warn('Erro ao extrair sumário do PDF:', tocErr);
        }

        let fullText = '';
        const maxPages = Math.min(pdf.numPages, 150);

        for (let i = 1; i <= maxPages; i++) {
          try {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ');
            fullText += pageText + '\n\n';

            // Safety limit to guarantee the text never exceeds the Firestore 1MB document size limit
            if (fullText.length > 600000) {
              console.warn('Limite de segurança de 600k caracteres atingido para PDF. Parando extração.');
              break;
            }
          } catch (pageErr) {
            console.warn(`Erro parcial ao ler página ${i} do PDF, continuando...`, pageErr);
          }
        }

        if (!fullText.trim()) {
          throw new Error('Nenhum texto extraível encontrado no PDF.');
        }

        // Post-process TOC offsets
        toc = toc.map(item => {
          const offset = fullText.indexOf(item.title);
          return { ...item, charOffset: offset };
        }).filter(item => item.charOffset !== -1);

        console.log(`Extração de PDF concluída. Caracteres: ${fullText.length}. Itens TOC: ${toc.length}`);
        return { text: fullText, toc };
      } catch (error) {
        console.error('Erro detalhado no processamento do PDF:', error);
        throw error;
      }
    })(),
    45000,
    'O processamento do PDF demorou muito e foi interrompido.'
  );
}
