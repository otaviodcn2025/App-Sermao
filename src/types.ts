export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  approved: boolean;
  createdAt: number;
}

export interface Sermon {
  id: string;
  userId: string;
  title: string;
  content: string; // JSON or HTML from TipTap
  seriesId?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Series {
  id: string;
  userId: string;
  title: string;
  description?: string;
  color?: string;
  tags?: string[];
  createdAt: number;
}

export interface Slide {
  id: string;
  title: string;
  content: string;
  imageDescription?: string;
}

export interface BibleVerse {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleResponse {
  reference: string;
  verses: BibleVerse[];
  text: string;
  translation_id: string;
  translation_name: string;
  translation_note: string;
}

export interface Resource {
  id: string;
  userId: string;
  title: string;
  type: 'pdf' | 'link' | 'epub';
  url?: string;
  tags?: string[];
  seriesId?: string;
  extractedText?: string;
  summary?: string;
  lastReadPosition?: number;
  highlights?: {
    id: string;
    text: string;
    startIndex: number;
    endIndex: number;
    color: string;
    createdAt: number;
  }[];
  createdAt: number;
}
