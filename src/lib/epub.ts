import ePub from 'epubjs';

export async function extractTextFromEpub(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const book = ePub(arrayBuffer);
    await book.ready;

    let fullText = '';
    const spine = book.spine;

    // Iterate through items in the spine
    // Note: This is an asynchronous process because chapters need to be loaded
    for (let i = 0; i < (spine as any).length; i++) {
      const item = (spine as any).get(i);
      if (item) {
        await item.load(book.load.bind(book));
        const document = item.document;
        if (document) {
          // Find the body tag and get its text content
          const body = document.querySelector('body');
          if (body) {
            // Basic cleanup: remove script and style tags
            const scripts = body.querySelectorAll('script, style');
            scripts.forEach((s: any) => s.remove());
            
            const text = body.innerText || body.textContent || '';
            fullText += text + '\n\n';
          }
        }
        item.unload();
      }
      
      // Safety break to avoid massive ePubs hanging the UI
      if (fullText.length > 1000000) break;
    }

    if (!fullText.trim()) {
      throw new Error('Não foi possível extrair texto deste arquivo ePub.');
    }

    return fullText;
  } catch (error) {
    console.error('Erro ao processar ePub:', error);
    throw error;
  }
}
