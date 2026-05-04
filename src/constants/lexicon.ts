
export interface LexiconTerm {
  term: string;
  original: string;
  language: 'Hebraico' | 'Grego' | 'Latim' | 'Teologia';
  meaning: string;
  explanation: string;
}

export const THEOLOGICAL_LEXICON: LexiconTerm[] = [
  {
    term: 'Tohu wa-Bohu',
    original: 'תֹּהוּ וָבֹהוּ',
    language: 'Hebraico',
    meaning: 'Sem forma e vazio',
    explanation: 'Expressão usada em Gênesis 1:2 para descrever o estado da terra antes da organização divina. Indica caos, desolação e vacuidade.'
  },
  {
    term: 'Hesed',
    original: 'חֶסֶד',
    language: 'Hebraico',
    meaning: 'Amor Leal / Misericórdia',
    explanation: 'Termo riquíssimo que descreve a bondade amorosa de Deus, Sua fidelidade pactual e misericórdia inabalável.'
  },
  {
    term: 'Logos',
    original: 'λόγος',
    language: 'Grego',
    meaning: 'A Palavra / Verbo',
    explanation: 'Em João 1:1, refere-se à segunda pessoa da Trindade, Jesus Cristo, como a revelação absoluta e lógica de Deus.'
  },
  {
    term: 'Agápē',
    original: 'ἀγάπη',
    language: 'Grego',
    meaning: 'Amor Incondicional',
    explanation: 'O tipo de amor que Deus tem pela humanidade; um amor sacrificial que busca o bem do outro independente do mérito.'
  },
  {
    term: 'Shalom',
    original: 'שָׁלוֹם',
    language: 'Hebraico',
    meaning: 'Paz / Plenitude',
    explanation: 'Mais do que ausência de conflito, significa integridade, bem-estar total e harmonia com Deus e a criação.'
  },
  {
    term: 'Kenosis',
    original: 'κένωσις',
    language: 'Grego',
    meaning: 'Esvaziamento',
    explanation: 'Refere-se ao ato de Cristo se esvaziar de Sua glória divina ao assumir a forma humana (Filipenses 2:7).'
  },
  {
    term: 'Sola Fide',
    original: 'Sola Fide',
    language: 'Latim',
    meaning: 'Somente a Fé',
    explanation: 'Um dos cinco solas da Reforma Protestante, afirmando que a justificação do pecador é somente pela fé, sem méritos humanos.'
  },
  {
    term: 'Ex Nihilo',
    original: 'Ex Nihilo',
    language: 'Latim',
    meaning: 'A partir do nada',
    explanation: 'Doutrina de que Deus criou o universo sem utilizar matéria pré-existente.'
  },
  {
    term: 'Koinonia',
    original: 'κοινωνία',
    language: 'Grego',
    meaning: 'Comunhão',
    explanation: 'Descreve a parceria espiritual e a vida compartilhada entre os cristãos e com o Espírito Santo.'
  },
  {
    term: 'Ruach',
    original: 'רוּחַ',
    language: 'Hebraico',
    meaning: 'Espírito / Sopro / Vento',
    explanation: 'Refere-se tanto ao vento físico quanto ao Espírito de Deus que traz vida e poder.'
  }
];
