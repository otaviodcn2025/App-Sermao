import * as pdfjs from 'pdfjs-dist';
// @ts-ignore - Vite specific import for worker URL
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Ensure the worker version matches the library exactly
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ 
      data: arrayBuffer,
      useSystemFonts: true,
      disableFontFace: false
    });
    
    const pdf = await loadingTask.promise;
    let fullText = '';
    const maxPages = Math.min(pdf.numPages, 100); // Limit to first 100 pages for performance

    for (let i = 1; i <= maxPages; i++) {
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

    return fullText;
  } catch (error) {
    console.error('Erro detalhado no processamento do PDF:', error);
    throw error;
  }
}
