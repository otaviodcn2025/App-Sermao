import * as pdfjs from 'pdfjs-dist';
import { withTimeout } from './utils';

// Usar o worker local importado via Vite para consistência e confiabilidade
// @ts-ignore - Vite specific import for worker URL
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function extractTextFromPdf(file: File): Promise<string> {
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
        let fullText = '';
        const maxPages = Math.min(pdf.numPages, 150); // Aumentado um pouco para 150

        for (let i = 1; i <= maxPages; i++) {
          console.log(`Processando página ${i}/${maxPages}...`);
          try {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ');
            fullText += pageText + '\n\n';
          } catch (pageErr) {
            console.warn(`Erro ao processar página ${i}:`, pageErr);
          }
        }

        if (!fullText.trim()) {
          throw new Error('Nenhum texto extraível encontrado no PDF.');
        }

        console.log(`Extração de PDF concluída. Caracteres: ${fullText.length}`);
        return fullText;
      } catch (error) {
        console.error('Erro detalhado no processamento do PDF:', error);
        throw error;
      }
    })(),
    45000,
    'O processamento do PDF demorou muito e foi interrompido.'
  );
}
