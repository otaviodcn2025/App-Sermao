export interface BibleBook {
  id: number;
  name: string;
  key: string;
  abbrev: string;
  chapters: number;
}

export const OLD_TESTAMENT: BibleBook[] = [
  { id: 1, name: "Gênesis", key: "Genesis", abbrev: "gn", chapters: 50 },
  { id: 2, name: "Êxodo", key: "Exodus", abbrev: "ex", chapters: 40 },
  { id: 3, name: "Levítico", key: "Leviticus", abbrev: "lv", chapters: 27 },
  { id: 4, name: "Números", key: "Numbers", abbrev: "nm", chapters: 36 },
  { id: 5, name: "Deuteronômio", key: "Deuteronomy", abbrev: "dt", chapters: 34 },
  { id: 6, name: "Josué", key: "Joshua", abbrev: "js", chapters: 24 },
  { id: 7, name: "Juízes", key: "Judges", abbrev: "jz", chapters: 21 },
  { id: 8, name: "Rute", key: "Ruth", abbrev: "rt", chapters: 4 },
  { id: 9, name: "1 Samuel", key: "1 Samuel", abbrev: "1sm", chapters: 31 },
  { id: 10, name: "2 Samuel", key: "2 Samuel", abbrev: "2sm", chapters: 24 },
  { id: 11, name: "1 Reis", key: "1 Kings", abbrev: "1rs", chapters: 22 },
  { id: 12, name: "2 Reis", key: "2 Kings", abbrev: "2rs", chapters: 25 },
  { id: 13, name: "1 Crônicas", key: "1 Chronicles", abbrev: "1cr", chapters: 29 },
  { id: 14, name: "2 Crônicas", key: "2 Chronicles", abbrev: "2cr", chapters: 36 },
  { id: 15, name: "Esdras", key: "Ezra", abbrev: "ed", chapters: 10 },
  { id: 16, name: "Neemias", key: "Nehemiah", abbrev: "ne", chapters: 13 },
  { id: 17, name: "Ester", key: "Esther", abbrev: "et", chapters: 10 },
  { id: 18, name: "Jó", key: "Job", abbrev: "jo", chapters: 42 },
  { id: 19, name: "Salmos", key: "Psalms", abbrev: "sl", chapters: 150 },
  { id: 20, name: "Provérbios", key: "Proverbs", abbrev: "pv", chapters: 31 },
  { id: 21, name: "Eclesiastes", key: "Ecclesiastes", abbrev: "ec", chapters: 12 },
  { id: 22, name: "Cantares", key: "Song of Solomon", abbrev: "ct", chapters: 8 },
  { id: 23, name: "Isaías", key: "Isaiah", abbrev: "is", chapters: 66 },
  { id: 24, name: "Jeremias", key: "Jeremiah", abbrev: "jr", chapters: 52 },
  { id: 25, name: "Lamentações", key: "Lamentations", abbrev: "lm", chapters: 5 },
  { id: 26, name: "Ezequiel", key: "Ezekiel", abbrev: "ez", chapters: 48 },
  { id: 27, name: "Daniel", key: "Daniel", abbrev: "dn", chapters: 12 },
  { id: 28, name: "Oseias", key: "Hosea", abbrev: "os", chapters: 14 },
  { id: 29, name: "Joel", key: "Joel", abbrev: "jl", chapters: 3 },
  { id: 30, name: "Amós", key: "Amos", abbrev: "am", chapters: 9 },
  { id: 31, name: "Obadias", key: "Obadiah", abbrev: "ob", chapters: 1 },
  { id: 32, name: "Jonas", key: "Jonah", abbrev: "jn", chapters: 4 },
  { id: 33, name: "Miqueias", key: "Micah", abbrev: "mq", chapters: 7 },
  { id: 34, name: "Naum", key: "Nahum", abbrev: "na", chapters: 3 },
  { id: 35, name: "Habacuque", key: "Habakkuk", abbrev: "hc", chapters: 3 },
  { id: 36, name: "Sofonias", key: "Zephaniah", abbrev: "sf", chapters: 3 },
  { id: 37, name: "Ageu", key: "Haggai", abbrev: "ag", chapters: 2 },
  { id: 38, name: "Zacarias", key: "Zechariah", abbrev: "zc", chapters: 14 },
  { id: 39, name: "Malaquias", key: "Malachi", abbrev: "ml", chapters: 4 }
];

export const NEW_TESTAMENT: BibleBook[] = [
  { id: 40, name: "Mateus", key: "Matthew", abbrev: "mt", chapters: 28 },
  { id: 41, name: "Marcos", key: "Mark", abbrev: "mc", chapters: 16 },
  { id: 42, name: "Lucas", key: "Luke", abbrev: "lc", chapters: 24 },
  { id: 43, name: "João", key: "John", abbrev: "jo", chapters: 21 },
  { id: 44, name: "Atos", key: "Acts", abbrev: "at", chapters: 28 },
  { id: 45, name: "Romanos", key: "Romans", abbrev: "rm", chapters: 16 },
  { id: 46, name: "1 Coríntios", key: "1 Corinthians", abbrev: "1co", chapters: 16 },
  { id: 47, name: "2 Coríntios", key: "2 Corinthians", abbrev: "2co", chapters: 13 },
  { id: 48, name: "Gálatas", key: "Galatians", abbrev: "gl", chapters: 6 },
  { id: 49, name: "Efésios", key: "Ephesians", abbrev: "ef", chapters: 6 },
  { id: 50, name: "Filipenses", key: "Philippians", abbrev: "fp", chapters: 4 },
  { id: 51, name: "Colossenses", key: "Colossians", abbrev: "cl", chapters: 4 },
  { id: 52, name: "1 Tessalonicenses", key: "1 Thessalonians", abbrev: "1ts", chapters: 5 },
  { id: 53, name: "2 Tessalonicenses", key: "2 Thessalonians", abbrev: "2ts", chapters: 3 },
  { id: 54, name: "1 Timóteo", key: "1 Timothy", abbrev: "1tm", chapters: 6 },
  { id: 55, name: "2 Timóteo", key: "2 Timothy", abbrev: "2tm", chapters: 4 },
  { id: 56, name: "Tito", key: "Titus", abbrev: "tt", chapters: 3 },
  { id: 57, name: "Filemom", key: "Philemon", abbrev: "fm", chapters: 1 },
  { id: 58, name: "Hebreus", key: "Hebrews", abbrev: "hb", chapters: 13 },
  { id: 59, name: "Tiago", key: "James", abbrev: "tg", chapters: 5 },
  { id: 60, name: "1 Pedro", key: "1 Peter", abbrev: "1pe", chapters: 5 },
  { id: 61, name: "2 Pedro", key: "2 Peter", abbrev: "2pe", chapters: 3 },
  { id: 62, name: "1 João", key: "1 John", abbrev: "1jo", chapters: 5 },
  { id: 63, name: "2 João", key: "2 John", abbrev: "2jo", chapters: 1 },
  { id: 64, name: "3 João", key: "3 John", abbrev: "3jo", chapters: 1 },
  { id: 65, name: "Judas", key: "Judas", abbrev: "jd", chapters: 1 },
  { id: 66, name: "Apocalipse", key: "Revelation", abbrev: "ap", chapters: 22 }
];

export const ALL_BOOKS = [...OLD_TESTAMENT, ...NEW_TESTAMENT];
