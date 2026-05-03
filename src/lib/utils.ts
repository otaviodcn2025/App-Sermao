import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function parseSlides(text: string) {
  const slides: { title: string; content: string; imageDescription?: string }[] = [];
  // Split by "Slide X" where X is a number
  const slideBlocks = text.split(/Slide \d+[:\s]*/i).filter(b => b.trim());
  
  slideBlocks.forEach(block => {
    const lines = block.trim().split('\n');
    let title = '';
    let content = '';
    let imageDescription = '';
    
    let currentSection = 'title';
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      if (trimmed.match(/^Título:|^Title:/i)) {
        title = trimmed.replace(/^Título:|^Title:\s*/i, '');
        currentSection = 'title';
      } else if (trimmed.match(/^Texto Principal:|^Conteúdo:|^Texto:|^Main Text:/i)) {
        content = trimmed.replace(/^Texto Principal:|^Conteúdo:|^Texto:|^Main Text:\s*/i, '');
        currentSection = 'content';
      } else if (trimmed.match(/^Descrição Visual:|^Imagem:|^Visual:|^Visual Description:/i)) {
        imageDescription = trimmed.replace(/^Descrição Visual:|^Imagem:|^Visual:|^Visual Description:\s*/i, '');
        currentSection = 'image';
      } else {
        // Append to current section
        if (currentSection === 'title') title += (title ? ' ' : '') + trimmed;
        else if (currentSection === 'content') content += (content ? '\n' : '') + trimmed;
        else if (currentSection === 'image') imageDescription += (imageDescription ? ' ' : '') + trimmed;
      }
    });
    
    if (title || content) {
      slides.push({
        title: title || 'Slide',
        content: content || '',
        imageDescription: imageDescription || ''
      });
    }
  });
  
  return slides;
}
