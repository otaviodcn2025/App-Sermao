export interface BibleBook {
  name: string;
  key: string;
  chapters: number;
}

export const OLD_TESTAMENT: BibleBook[] = [
  { name: "Gênesis", key: "Genesis", chapters: 50 },
  { name: "Êxodo", key: "Exodus", chapters: 40 },
  { name: "Levítico", key: "Leviticus", chapters: 27 },
  { name: "Números", key: "Numbers", chapters: 36 },
  { name: "Deuteronômio", key: "Deuteronomy", chapters: 34 },
  { name: "Josué", key: "Joshua", chapters: 24 },
  { name: "Juízes", key: "Judges", chapters: 21 },
  { name: "Rute", key: "Ruth", chapters: 4 },
  { name: "1 Samuel", key: "1 Samuel", chapters: 31 },
  { name: "2 Samuel", key: "2 Samuel", chapters: 24 },
  { name: "1 Reis", key: "1 Kings", chapters: 22 },
  { name: "2 Reis", key: "2 Kings", chapters: 25 },
  { name: "1 Crônicas", key: "1 Chronicles", chapters: 29 },
  { name: "2 Crônicas", key: "2 Chronicles", chapters: 36 },
  { name: "Esdras", key: "Ezra", chapters: 10 },
  { name: "Neemias", key: "Nehemiah", chapters: 13 },
  { name: "Ester", key: "Esther", chapters: 10 },
  { name: "Jó", key: "Job", chapters: 42 },
  { name: "Salmos", key: "Psalms", chapters: 150 },
  { name: "Provérbios", key: "Proverbs", chapters: 31 },
  { name: "Eclesiastes", key: "Ecclesiastes", chapters: 12 },
  { name: "Cantares", key: "Song of Solomon", chapters: 8 },
  { name: "Isaías", key: "Isaiah", chapters: 66 },
  { name: "Jeremias", key: "Jeremiah", chapters: 52 },
  { name: "Lamentações", key: "Lamentations", chapters: 5 },
  { name: "Ezequiel", key: "Ezekiel", chapters: 48 },
  { name: "Daniel", key: "Daniel", chapters: 12 },
  { name: "Oseias", key: "Hosea", chapters: 14 },
  { name: "Joel", key: "Joel", chapters: 3 },
  { name: "Amós", key: "Amos", chapters: 9 },
  { name: "Obadias", key: "Obadiah", chapters: 1 },
  { name: "Jonas", key: "Jonah", chapters: 4 },
  { name: "Miqueias", key: "Micah", chapters: 7 },
  { name: "Naum", key: "Nahum", chapters: 3 },
  { name: "Habacuque", key: "Habakkuk", chapters: 3 },
  { name: "Sofonias", key: "Zephaniah", chapters: 3 },
  { name: "Ageu", key: "Haggai", chapters: 2 },
  { name: "Zacarias", key: "Zechariah", chapters: 14 },
  { name: "Malaquias", key: "Malachi", chapters: 4 }
];

export const NEW_TESTAMENT: BibleBook[] = [
  { name: "Mateus", key: "Matthew", chapters: 28 },
  { name: "Marcos", key: "Mark", chapters: 16 },
  { name: "Lucas", key: "Luke", chapters: 24 },
  { name: "João", key: "John", chapters: 21 },
  { name: "Atos", key: "Acts", chapters: 28 },
  { name: "Romanos", key: "Romans", chapters: 16 },
  { name: "1 Coríntios", key: "1 Corinthians", chapters: 16 },
  { name: "2 Coríntios", key: "2 Corinthians", chapters: 13 },
  { name: "Gálatas", key: "Galatians", chapters: 6 },
  { name: "Efésios", key: "Ephesians", chapters: 6 },
  { name: "Filipenses", key: "Philippians", chapters: 4 },
  { name: "Colossenses", key: "Colossians", chapters: 4 },
  { name: "1 Tessalonicenses", key: "1 Thessalonians", chapters: 5 },
  { name: "2 Tessalonicenses", key: "2 Thessalonians", chapters: 3 },
  { name: "1 Timóteo", key: "1 Timothy", chapters: 6 },
  { name: "2 Timóteo", key: "2 Timothy", chapters: 4 },
  { name: "Tito", key: "Titus", chapters: 3 },
  { name: "Filemom", key: "Philemon", chapters: 1 },
  { name: "Hebreus", key: "Hebrews", chapters: 13 },
  { name: "Tiago", key: "James", chapters: 5 },
  { name: "1 Pedro", key: "1 Peter", chapters: 5 },
  { name: "2 Pedro", key: "2 Peter", chapters: 3 },
  { name: "1 João", key: "1 John", chapters: 5 },
  { name: "2 João", key: "2 John", chapters: 1 },
  { name: "3 João", key: "3 John", chapters: 1 },
  { name: "Judas", key: "Judas", chapters: 1 },
  { name: "Apocalipse", key: "Revelation", chapters: 22 }
];

export const ALL_BOOKS = [...OLD_TESTAMENT, ...NEW_TESTAMENT];
