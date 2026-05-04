import { ALL_BOOKS } from '../constants/bible';

const VERSION = 'NVIPT'; // NVI Portuguese

export interface ParsedReference {
  bookId: number;
  bookName: string;
  chapter: number;
  verse?: number;
  verseEnd?: number;
}

export function parseBibleReference(query: string): ParsedReference | null {
  const q = query.trim();
  // Pattern supports: "João 3:16", "João 3.16", "1 Cor 13", "1 Co 13:1-4"
  const refMatch = q.match(/^([1-3]?\s?[a-zA-ZáàâãéèêíïóòôõúùûçÁÀÂÃÉÈÊÍÏÓÒÔÕÚÙÛÇ]+)\s*(\d+)(?:[:.](\d+))?(?:-(\d+))?$/i);
  
  if (!refMatch) return null;

  const bookName = refMatch[1].trim().toLowerCase();
  const chapter = parseInt(refMatch[2]);
  const verse = refMatch[3] ? parseInt(refMatch[3]) : undefined;
  const verseEnd = refMatch[4] ? parseInt(refMatch[4]) : undefined;

  const book = ALL_BOOKS.find(b => 
    b.name.toLowerCase() === bookName || 
    b.abbrev.toLowerCase() === bookName ||
    b.key.toLowerCase() === bookName
  );

  if (!book) return null;

  return {
    bookId: book.id,
    bookName: book.name,
    chapter,
    verse,
    verseEnd
  };
}

export async function fetchBibleVerses(ref: ParsedReference): Promise<{ text: string, reference: string } | null> {
  try {
    if (ref.verseEnd) {
      // Fetch multiple verses
      const res = await fetch(`https://bolls.life/get-chapter/${VERSION}/${ref.bookId}/${ref.chapter}/`, {
        mode: 'cors',
        referrerPolicy: 'no-referrer'
      });
      if (!res.ok) return null;
      const data = await res.json();
      
      const filteredVerses = data.filter((v: any) => v.verse >= ref.verse! && v.verse <= ref.verseEnd!);
      if (filteredVerses.length === 0) return null;
      
      return {
        text: filteredVerses.map((v: any) => v.text).join(' '),
        reference: `${ref.bookName} ${ref.chapter}:${ref.verse}-${ref.verseEnd}`
      };
    } else if (ref.verse) {
      // Fetch single verse
      const res = await fetch(`https://bolls.life/get-verse/${VERSION}/${ref.bookId}/${ref.chapter}/${ref.verse}/`, {
        mode: 'cors',
        referrerPolicy: 'no-referrer'
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        text: data.text,
        reference: `${ref.bookName} ${ref.chapter}:${ref.verse}`
      };
    } else {
      // Fetch entire chapter
      const res = await fetch(`https://bolls.life/get-chapter/${VERSION}/${ref.bookId}/${ref.chapter}/`, {
        mode: 'cors',
        referrerPolicy: 'no-referrer'
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        text: data.map((v: any) => v.text).join(' '),
        reference: `${ref.bookName} ${ref.chapter}`
      };
    }
  } catch (error) {
    console.error('Error fetching bible verses:', error);
    return null;
  }
}
