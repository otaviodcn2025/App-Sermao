import ePub from 'epubjs';
import { withTimeout } from './utils';

export async function extractTextFromEpub(file: File): Promise<string> {
  return withTimeout(
    (async () => {
      console.log(`Iniciando extração de ePub: ${file.name}`);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const book = ePub(arrayBuffer);
        await book.ready;
        console.log('ePub carregado. Iniciando leitura da espinha (spine)...');

        let fullText = '';
        const spine = book.spine;
        const totalItems = (spine as any).length;

        // Iterate through items in the spine
        for (let i = 0; i < totalItems; i++) {
          console.log(`Processando item ${i+1}/${totalItems} do ePub...`);
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
          
          // Safety break to avoid massive ePubs hanging the UI (approx 1MB)
          if (fullText.length > 800000) {
            console.warn('Limite de segurança de 800k caracteres atingido para ePub. Interrompendo extração.');
            break;
          }
        }

        if (!fullText.trim()) {
          throw new Error('Não foi possível extrair texto deste arquivo ePub.');
        }

        console.log(`Extração de ePub concluída. Caracteres: ${fullText.length}`);
        return fullText;
      } catch (error) {
        console.error('Erro ao processar ePub:', error);
        throw error;
      }
    })(),
    45000,
    'O processamento do ePub demorou muito e foi interrompido.'
  );
}
