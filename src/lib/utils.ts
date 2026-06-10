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

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string = 'Operação expirou'): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => {
    clearTimeout(timeoutId);
  });
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

export function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return "";
  
  // Simple regex conversion
  let html = markdown;
  
  // Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Headers (h1, h2, h3)
  html = html.replace(/^### (.*?)$/gm, '<h3 class="text-sm font-black text-slate-800 mt-4 mb-2 flex items-center gap-1.5">$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2 class="text-base font-black text-slate-800 mt-5 mb-3 border-b border-slate-100 pb-1">$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1 class="text-xl font-black text-slate-900 mt-6 mb-4">$1</h1>');
  
  // List items starting with '-' or '*'
  html = html.replace(/^\s*[-*]\s+(.*?)$/gm, '<li class="ml-4 list-disc pl-1 text-slate-600 my-1">$1</li>');
  
  // Blockquotes starting with '>'
  html = html.replace(/^\s*>\s+(.*?)$/gm, '<blockquote class="border-l-4 border-violet-500 pl-4 py-1 my-3 bg-violet-50/50 rounded-r text-slate-700 italic">$1</blockquote>');
  
  // Line breaks
  html = html.replace(/\n/g, '<br/>');
  
  // Clean contiguous duplicates or breaks from list and headers
  html = html.replace(/(<br\/>)+<li/g, '<li');
  html = html.replace(/<\/li>(<br\/>)+/g, '</li>');
  html = html.replace(/(<br\/>)+<h/g, '<h');

  return html;
}

