import * as pdfjs from 'pdfjs-dist';
import { withTimeout } from './utils';

// Usar o worker local importado via Vite para consistência e confiabilidade, com fallback CDN robusto se necessário
// @ts-ignore - Vite specific import for worker URL
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

if (typeof window !== 'undefined') {
  const workerUrl = pdfjsWorker || `https://unpkg.com/pdfjs-dist@${pdfjs.version || '5.7.284'}/build/pdf.worker.mjs`;
  try {
    const blobCode = `importScripts(${JSON.stringify(workerUrl)});`;
    const blob = new Blob([blobCode], { type: 'application/javascript' });
    pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
  } catch (err) {
    console.error('Failed to set PDF.js safe worker:', err);
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  }
}

export async function extractTextFromPdf(file: File): Promise<{ text: string, toc: { title: string, charOffset: number }[] }> {
  return withTimeout(
    (async () => {
      console.log(`Iniciando extração bento de PDF: ${file.name}`);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ 
          data: arrayBuffer,
          useSystemFonts: true,
          disableFontFace: false
        });
        
        const pdf = await loadingTask.promise;
        console.log(`PDF carregado. Páginas totais: ${pdf.numPages}`);
        
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

        const maxPages = Math.min(pdf.numPages, 150);
        const pageTexts = new Array(maxPages);
        
        // Extração em lotes paralelos de 15 páginas para velocidade ultra-rápida (são ~200ms por página sequentially)
        const batchSize = 15;
        for (let i = 0; i < maxPages; i += batchSize) {
          const batchPromises = [];
          for (let k = 0; k < batchSize && (i + k) < maxPages; k++) {
            const pageNum = i + k + 1;
            const index = i + k;
            
            batchPromises.push((async (pNum, idx) => {
              try {
                const page = await pdf.getPage(pNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                  .map((item: any) => item.str)
                  .join(' ');
                pageTexts[idx] = pageText;
              } catch (pageErr) {
                console.warn(`Erro parcial ao ler página ${pNum} do PDF:`, pageErr);
                pageTexts[idx] = '';
              }
            })(pageNum, index));
          }
          await Promise.all(batchPromises);
        }

        let fullText = '';
        for (let i = 0; i < maxPages; i++) {
          fullText += (pageTexts[i] || '') + '\n\n';
          
          // Safety limit to guarantee the text never exceeds the Firestore 1MB document size limit
          if (fullText.length > 600000) {
            console.warn('Limite de segurança de 600k caracteres atingido para PDF. Truncando.');
            fullText = fullText.substring(0, 600000);
            break;
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

        console.log(`Extração de PDF e lotes paralelos concluída. Caracteres: ${fullText.length}. Itens TOC: ${toc.length}`);
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
