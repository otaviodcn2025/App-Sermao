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
  createdAt: number;
  updatedAt: number;
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
