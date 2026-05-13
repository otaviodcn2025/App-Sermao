import * as pdfjs from 'pdfjs-dist';

// Usar o worker do CDN para garantir que a versão do Worker coincida exatamente com a API (pdfjs.version)
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

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
