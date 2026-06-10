import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Save, 
  History, 
  Layout, 
  Sparkles, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Presentation,
  BookOpen,
  LogOut,
  Shield,
  Users,
  Clock,
  User as UserIcon,
  X,
  List,
  Book,
  Download,
  RefreshCcw,
  Layers,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Editor from './components/Editor';
import BibleSearch from './components/BibleSearch';
import Auth from './components/Auth';
import PreachingSchedule from './components/PreachingSchedule';
import SeriesPanel from './components/SeriesPanel';
import { Sermon, UserProfile, Resource, Series, Slide, AgendaEntry } from './types';
import { cn, formatDate, parseSlides, withTimeout, parseMarkdownToHtml } from './lib/utils';
import { 
  generateSermonOutline, 
  analyzeVerse, 
  generateSlideDescriptions, 
  summarizeResource,
  generateIllustrations,
  simplifyContent,
  generateCreativeTitles,
  translateAndConsult,
  analyzeThematicConnections,
  semanticSearch,
  improveSlide,
  generatePGMOutline,
  DEFAULT_MODEL,
  getAIClient
} from './lib/gemini';
import { generatePowerPoint } from './lib/pptx';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { extractTextFromPdf } from './lib/pdf';
import { extractTextFromEpub } from './lib/epub';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  serverTimestamp, 
  setDoc,
  getDoc,
  orderBy
} from 'firebase/firestore';

import PresentationMode from './components/PresentationMode';
import AdminPanel from './components/AdminPanel';
import AiOutlineModal from './components/AiOutlineModal';
import Library from './components/Library';
import SlideGenerator from './components/SlideGenerator';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [currentSermonId, setCurrentSermonId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Start false
  const [isBibleSearchOpen, setIsBibleSearchOpen] = useState(false); 
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiActionType, setAiActionType] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [sharedSermonData, setSharedSermonData] = useState<Sermon | null>(null);
  const [mobileTab, setMobileTab] = useState<'list' | 'editor' | 'bible' | 'library' | 'series' | 'agenda'>('editor');
  const [currentView, setCurrentView] = useState<'editor' | 'library' | 'series' | 'agenda'>('editor');
  const [resources, setResources] = useState<Resource[]>([]);
  const [agenda, setAgenda] = useState<AgendaEntry[]>([]);
  const [searchResults, setSearchResults] = useState<string[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSlideGeneratorOpen, setIsSlideGeneratorOpen] = useState(false);
  const [generatedSlides, setGeneratedSlides] = useState<Slide[]>([]);

  // Initialize responsive state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSidebarOpen(window.innerWidth >= 1024);
      // setIsBibleSearchOpen(window.innerWidth >= 1024);
    }
  }, []);

  // Monitor screen size
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let lastWidth = window.innerWidth;
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      
      // Only trigger if we cross the 1024px breakpoint
      if (lastWidth < 1024 && currentWidth >= 1024) {
        setIsSidebarOpen(true);
        // setIsBibleSearchOpen(true); // Don't auto-open bible search
      } else if (lastWidth >= 1024 && currentWidth < 1024) {
        setIsSidebarOpen(false);
        setIsBibleSearchOpen(false);
        setMobileTab('editor'); // Reset to editor on mobile transition
      }
      
      lastWidth = currentWidth;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update sidebars based on mobile tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 1024) {
      if (mobileTab === 'list') {
        setIsSidebarOpen(true);
        setIsBibleSearchOpen(false);
      } else if (mobileTab === 'bible') {
        setIsSidebarOpen(false);
        setIsBibleSearchOpen(true);
      } else {
        setIsSidebarOpen(false);
        setIsBibleSearchOpen(false);
      }
    }
  }, [mobileTab]);

  // Monitor Auth State
  useEffect(() => {
    if (!auth || !db) {
      setAuthLoading(false);
      return;
    }

    // Check for shared sermon in URL
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('sermon');
    if (sharedId) {
      const fetchShared = async () => {
        try {
          const docRef = doc(db, 'sermons', sharedId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = { ...snap.data(), id: snap.id } as Sermon;
            setSharedSermonData(data);
            setCurrentSermonId(snap.id);
          }
        } catch (err) {
          console.error("Erro ao carregar sermão compartilhado:", err);
        }
      };
      fetchShared();
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setUser(currentUser);
          // Fetch profile
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            
            // Auto-fix master admin profile if needed
            if (currentUser.email === 'pastorotavio@gmail.com' && (data.role !== 'admin' || !data.approved)) {
              console.log('Detectado admin mestre sem permissões completas, corrigindo...');
              const updatedData = { ...data, role: 'admin' as const, approved: true };
              await updateDoc(userRef, { role: 'admin', approved: true });
              setUserProfile(updatedData);
            } else {
              setUserProfile(data);
            }
          } else if (currentUser.email === 'pastorotavio@gmail.com') {
            // Creation logic for master admin if not exists in Firestore
            const adminProfile: UserProfile = {
              uid: currentUser.uid,
              name: currentUser.displayName || 'Pastor Otávio',
              email: currentUser.email!,
              role: 'admin',
              approved: true,
              createdAt: Date.now()
            };
            await setDoc(userRef, adminProfile);
            setUserProfile(adminProfile);
          } else {
            // User exists in Auth but not in Firestore yet
            console.warn('Usuário autenticado sem perfil no Firestore.');
            setUserProfile(null);
          }
        } else {
          setUser(null);
          setUserProfile(null);
          setSermons([]);
          setCurrentSermonId(null);
        }
      } catch (err) {
        console.error('Erro crítico na inicialização do Auth:', err);
      } finally {
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync Sermons from Firestore
  useEffect(() => {
    if (!user || !db) return;

    const path = 'sermons';
    const q = query(
      collection(db, path), 
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sermonList: Sermon[] = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Sermon));
      setSermons(sermonList);
      
      // Select first sermon if none selected and list not empty
      if (!currentSermonId && sermonList.length > 0) {
        // Find if we had one in local memory that still exists
        let lastSelected = null;
        try {
          lastSelected = localStorage.getItem(`last-sermon-${user.uid}`);
        } catch (e) {
          console.warn("LocalStorage indisponível");
        }
        
        if (lastSelected && sermonList.some(s => s.id === lastSelected)) {
          setCurrentSermonId(lastSelected);
        } else {
          setCurrentSermonId(sermonList[0].id);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user, currentSermonId]);

  // Sync Resources (Library) from Firestore
  useEffect(() => {
    if (!user || !db) return;

    const path = 'resources';
    const q = query(
      collection(db, path), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const resourceList: Resource[] = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Resource));
      setResources(resourceList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  // Sync Series from Firestore
  useEffect(() => {
    if (!user || !db) return;

    const path = 'series';
    const q = query(
      collection(db, path), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const seriesList: Series[] = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Series));
      setSeries(seriesList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  // Sync Agenda from Firestore
  useEffect(() => {
    if (!user || !db) return;

    const path = 'agenda';
    const q = query(
      collection(db, path), 
      where('userId', '==', user.uid),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const agendaList: AgendaEntry[] = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as AgendaEntry));
      setAgenda(agendaList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  // Keep track of last selected sermon per user
  useEffect(() => {
    if (user && currentSermonId) {
      try {
        localStorage.setItem(`last-sermon-${user.uid}`, currentSermonId);
      } catch (e) {
        // ignore storage errors
      }
    }
  }, [user, currentSermonId]);

  const currentSermon = sermons.find(s => s.id === currentSermonId) || (sharedSermonData?.id === currentSermonId ? sharedSermonData : null);

  const handleSemanticSearch = async (queryStr: string) => {
    if (!queryStr.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const searchableItems = [
        ...sermons.map(s => ({ id: s.id, title: s.title, type: 'sermon' })),
        ...resources.map(r => ({ id: r.id, title: r.title, summary: r.summary, type: 'resource' }))
      ];
      const ids = await semanticSearch(queryStr, searchableItems);
      setSearchResults(ids);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const createNewSermon = async (seriesId?: string) => {
    if (!user || !db) return;
    
    const collectionRef = collection(db, 'sermons');
    const newDocRef = doc(collectionRef); // Generate ID on client
    const now = Date.now();
    
    try {
      const newSermon = {
        id: newDocRef.id,
        userId: user.uid,
        title: 'Novo Sermão',
        content: '<h1>Título do Sermão</h1><p>Comece aqui seu rascunho ou use o botão <strong>Gerar Esboço com IA</strong> acima para estruturar sua mensagem.</p>',
        seriesId: seriesId || null,
        createdAt: now,
        updatedAt: now,
      };
      
      await setDoc(newDocRef, newSermon);
      setCurrentSermonId(newDocRef.id);
      setCurrentView('editor');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'sermons');
    }
  };

  const createNewSeries = async (title: string, description?: string) => {
    if (!user || !db) return;
    const seriesRef = collection(db, 'series');
    const newDoc = doc(seriesRef);
    try {
      const newSeries: Series = {
        id: newDoc.id,
        userId: user.uid,
        title,
        description,
        createdAt: Date.now()
      };
      await setDoc(newDoc, newSeries);
      return newDoc.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'series');
    }
  };

  const deleteSeriesWithGradients = async (id: string) => {
    if (!user || !db) return;
    const path = `series/${id}`;
    try {
      await deleteDoc(doc(db, 'series', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const createAgendaEntry = async (entry: Omit<AgendaEntry, 'id' | 'userId' | 'createdAt'>) => {
    if (!user || !db) return;
    const agendaRef = collection(db, 'agenda');
    const newDoc = doc(agendaRef);
    try {
      const newEntry: AgendaEntry = {
        ...entry,
        id: newDoc.id,
        userId: user.uid,
        createdAt: Date.now()
      };
      await setDoc(newDoc, newEntry);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'agenda');
    }
  };

  const updateAgendaEntry = async (id: string, updates: Partial<AgendaEntry>) => {
    if (!user || !db) return;
    const path = `agenda/${id}`;
    try {
      const entryRef = doc(db, 'agenda', id);
      await updateDoc(entryRef, updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteAgendaEntry = async (id: string) => {
    if (!user || !db) return;
    const path = `agenda/${id}`;
    try {
      await deleteDoc(doc(db, 'agenda', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const updateSermon = async (updates: Partial<Sermon>) => {
    if (!currentSermonId || !user || !db) return;
    
    const path = `sermons/${currentSermonId}`;
    try {
      const sermonRef = doc(db, 'sermons', currentSermonId);
      await updateDoc(sermonRef, {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteSermon = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!db) return;
    if (confirm('Tem certeza que deseja excluir este sermão?')) {
      const path = `sermons/${id}`;
      try {
        await deleteDoc(doc(db, 'sermons', id));
        if (currentSermonId === id) {
          setCurrentSermonId(null);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  };

  const handleLogout = async () => {
    if (confirm('Deseja realmente sair?')) {
      await signOut(auth);
    }
  };

  const forceUpdate = async () => {
    if (confirm('Deseja forçar a limpeza do cache e carregar a versão mais recente?')) {
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          for(let reg of regs) {
            await reg.unregister();
          }
        }
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        window.location.reload();
      } catch (err) {
        window.location.reload();
      }
    }
  };

  const handleAiAction = async (action: string, text: string) => {
    setIsAiLoading(true);
    setAiResponse(null);
    setAiActionType(action);
    try {
      // Feed reference content from library if available
      const referenceContent = resources.map(r => r.extractedText).filter(Boolean).join('\n\n---\n\n').substring(0, 15000); // Limit to safety

      let result = '';
      if (action === 'expand') {
        result = await generateSermonOutline(text, '', referenceContent);
      } else if (action === 'context') {
        result = await analyzeVerse(text, '', referenceContent);
      } else if (action === 'slides') {
        result = await generateSlideDescriptions(currentSermon?.content || '', text);
        const slides = parseSlides(result);
        if (slides.length > 0) {
          setGeneratedSlides(slides.map((s, idx) => ({ ...s, id: `slide-${idx}-${Date.now()}` })));
          setIsSlideGeneratorOpen(true);
          setIsAiLoading(false);
          return; // Don't show in basic AI panel
        }
      } else if (action === 'illustrations') {
        result = await generateIllustrations(text);
      } else if (action === 'simplify') {
        result = await simplifyContent(text);
      } else if (action === 'titles') {
        result = await generateCreativeTitles(currentSermon?.content || '');
      } else if (action === 'translate') {
        result = await translateAndConsult(text);
      } else if (action === 'thematic') {
        const otherSermonsContext = sermons
          .filter(s => s.id !== currentSermonId)
          .map(s => ({ id: s.id, title: s.title, content: s.content.substring(0, 500) }));
        result = await analyzeThematicConnections(currentSermon?.content || '', otherSermonsContext) || 'Nenhuma conexão significativa encontrada.';
      } else if (action === 'pgm') {
        result = await generatePGMOutline(currentSermon?.title || 'Sermão', currentSermon?.content || '');
      }
      setAiResponse(result);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Verifique sua conexão e tente novamente.';
      alert(`Erro ao processar com IA: ${errorMessage}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const addVerseToEditor = (verseText: string, reference: string) => {
    if (currentSermon) {
      const newContent = currentSermon.content + `<blockquote><p>${verseText}</p><cite>— ${reference}</cite></blockquote><p></p>`;
      updateSermon({ content: newContent });
    }
  };

  const handleGenerateOutline = async (theme: string, baseText: string, fileContent: string, userIdeias: string, style: 'traditional' | 'practical' | 'historical') => {
    setIsAiLoading(true);
    setAiResponse(null);
    try {
      const libraryContext = resources.map(r => r.extractedText).filter(Boolean).join('\n\n---\n\n').substring(0, 20000);
      const fullContext = `${fileContent}\n\nRECURSOS DA BIBLIOTECA:\n${libraryContext}`;
      
      const outline = await generateSermonOutline(theme, baseText, fullContext, userIdeias, style);
      if (outline) {
        setAiActionType('outline');
        setAiResponse(outline);
        setIsAiModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar esboço: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGenerateOutlineFromTheme = async () => {
    setIsAiModalOpen(true);
  };

  const handleImproveSlide = async (slide: Slide, type: 'simplify' | 'topics' | 'verse') => {
    const result = await improveSlide(slide, type);
    return { ...slide, ...result };
  };

  const handleResourceUpload = async (file: File) => {
    if (!user || !db) return;
    
    console.log(`Upload solicitado: ${file.name} (${file.size} bytes)`);
    setIsAiLoading(true);
    
    try {
      const isPdf = file.name.toLowerCase().endsWith('.pdf');
      const isEpub = file.name.toLowerCase().endsWith('.epub');

      let extractionResult: { text: string, toc?: { title: string, charOffset: number }[] };
      if (isPdf) {
        extractionResult = await extractTextFromPdf(file);
      } else if (isEpub) {
        extractionResult = await extractTextFromEpub(file);
      } else {
        throw new Error('Formato de arquivo não suportado. Use PDF ou ePub.');
      }

      const { text, toc } = extractionResult;

      let summary = '';
      let tags: string[] = [];

      try {
        console.log('Fase de extração terminada. Iniciando resumo com IA...');
        summary = await withTimeout(summarizeResource(file.name, text), 35000, "O resumo da IA demorou muito.");
        
        // Auto-tagging with IA
        console.log('Iniciando auto-tagging...');
        const tagsPrompt = `A partir deste resumo, sugira 3 a 5 etiquetas (tags) curtas de temas teológicos separadas por vírgula (ex: Fé, Graça, Salvação). Retorne apenas as palavras separadas por vírgula: "${summary.substring(0, 500)}"`;
        const ai = getAIClient();
        if (ai) {
          try {
            const res = await ai.models.generateContent({ model: DEFAULT_MODEL, contents: tagsPrompt });
            const textRes = res.text || '';
            tags = textRes.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
          } catch (e) {
            console.error("Auto-tagging error:", e);
          }
        }
      } catch (aiErr) {
        console.warn("Falha ao gerar resumo/etiquetas com IA (não bloqueante):", aiErr);
        summary = "O resumo inteligente não pôde ser gerado automaticamente. Você ainda pode ler o conteúdo completo do livro.";
        tags = ['Teologia'];
      }

      console.log('Salvando no Firestore...');
      const resourceRef = collection(db, 'resources');
      const newDoc = doc(resourceRef);
      
      const resource: Resource = {
        id: newDoc.id,
        userId: user.uid,
        title: file.name.replace(/\.(pdf|epub)$/i, ''),
        type: isPdf ? 'pdf' : 'epub',
        extractedText: text,
        summary: summary,
        tags: tags,
        toc: toc,
        createdAt: Date.now()
      };
      
      await setDoc(newDoc, resource);
      console.log('Livro anexado com sucesso!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao processar arquivo';
      console.error('Falha no upload:', err);
      alert(message);
      handleFirestoreError(err, OperationType.CREATE, 'resources');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleResourceDelete = async (id: string) => {
    if (!db || !confirm('Deseja excluir este livro da sua biblioteca?')) return;
    try {
      await deleteDoc(doc(db, 'resources', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `resources/${id}`);
    }
  };

  if (!auth || !db) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="bg-red-50 p-8 rounded-3xl border border-red-100 max-w-md shadow-xl">
          <Shield size={48} className="text-red-500 mx-auto mb-6" />
          <h1 className="text-xl font-bold text-slate-800 mb-4">Erro de Configuração</h1>
          <p className="text-slate-500 text-sm mb-6">
            Não foi possível inicializar o banco de dados. Isso geralmente acontece quando as chaves de configuração do Firebase estão faltando ou são inválidas.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-orange-600" size={40} />
      </div>
    );
  }

  if (!user) {
    if (sharedSermonData) {
      return (
        <div className="h-screen bg-slate-50 overflow-y-auto flex flex-col font-sans">
          <div className="p-4 lg:p-6 border-b bg-white flex justify-between items-center sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-100">
                <Sparkles size={20} className="text-white" />
              </div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight">Sermão Compartilhado</h1>
            </div>
            <button 
              onClick={() => window.location.href = window.location.origin}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors"
            >
              Entrar no PregaIA
            </button>
          </div>
          <div className="max-w-4xl w-full mx-auto p-4 lg:p-12 flex-1">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden"
            >
              <div className="p-8 lg:p-16">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest">Leitura Pública</span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-black text-slate-900 mb-8 leading-tight">{sharedSermonData.title}</h1>
                <div 
                  className="prose prose-slate max-w-none prose-headings:font-black prose-p:leading-relaxed prose-strong:text-orange-600" 
                  dangerouslySetInnerHTML={{ __html: sharedSermonData.content }} 
                />
              </div>
            </motion.div>
          </div>
          <footer className="p-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            Criado com PregaIA • Inteligência para sua Pregação
          </footer>
        </div>
      );
    }
    return <Auth />;
  }

  if (userProfile && !userProfile.approved && userProfile.role !== 'admin') {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100"
        >
          <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-600">
            <Clock size={40} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Aguardando Aprovação</h2>
          <p className="mt-4 text-slate-500 text-sm leading-relaxed">
            Sua conta (<span className="font-mono text-slate-800">{user.email}</span>) foi criada com sucesso, mas precisa ser liberada pelo administrador antes do primeiro acesso.
          </p>
          <div className="mt-8 pt-8 border-t border-slate-50 flex flex-col gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3.5 bg-orange-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-100"
            >
              Verificar Novamente
            </button>
            <button 
              onClick={() => signOut(auth)}
              className="text-slate-400 text-sm font-bold hover:text-slate-600"
            >
              Sair da Conta
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isAdminPanelOpen && userProfile?.role === 'admin') {
    return <AdminPanel onBack={() => setIsAdminPanelOpen(false)} />;
  }

  return (
    <>
      <AnimatePresence>
        {isPresenting && currentSermon && (
          <PresentationMode 
            sermon={currentSermon} 
            onClose={() => setIsPresenting(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSlideGeneratorOpen && generatedSlides.length > 0 && (
          <SlideGenerator 
            initialSlides={generatedSlides}
            sermonTitle={currentSermon?.title || 'Sermão'}
            onClose={() => setIsSlideGeneratorOpen(false)}
            onRegenerate={() => {
              setIsSlideGeneratorOpen(false);
              handleAiAction('slides', '');
            }}
            onImproveSlide={handleImproveSlide}
          />
        )}
      </AnimatePresence>

      {/* AI Outline Modal */}
      <AnimatePresence>
        {isAiModalOpen && (
          <AiOutlineModal
            onClose={() => setIsAiModalOpen(false)}
            onGenerate={handleGenerateOutline}
            isLoading={isAiLoading}
          />
        )}
      </AnimatePresence>

      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative pb-16 lg:pb-0">
      {/* Overlay for mobile sidebars */}
      <AnimatePresence>
        {(isSidebarOpen || isBibleSearchOpen) && (typeof window !== 'undefined' && window.innerWidth < 1024) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setMobileTab('editor');
              setIsSidebarOpen(false);
              setIsBibleSearchOpen(false);
            }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* List Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? (window.innerWidth < 1024 ? '85%' : 280) : 0, 
          opacity: isSidebarOpen ? 1 : 0,
          x: isSidebarOpen ? 0 : -320
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={cn(
          "flex flex-col bg-white border-r border-slate-200 shrink-0 relative overflow-hidden z-[60]",
          "fixed inset-y-0 left-0 lg:relative lg:translate-x-0"
        )}
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-display">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <h1 className="font-extrabold text-slate-800 tracking-tight">Sermão Digital</h1>
          </div>
          <button 
            onClick={() => setMobileTab('editor')}
            className="lg:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Profile Summary */}
        <div className="px-4 py-3 mx-2 mt-2 bg-white rounded-xl flex items-center gap-3 border border-slate-100 shadow-sm">
          <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center text-violet-700 relative">
            <UserIcon size={18} />
            {userProfile?.approved && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          <div className="flex-1 min-w-0 font-sans">
            <p className="text-sm font-bold text-slate-800 truncate">{userProfile?.name || user.displayName || 'Usuário'}</p>
            <div className="flex items-center gap-1">
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              {userProfile?.role === 'admin' && (
                <Shield size={10} className="text-violet-500" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {userProfile?.role === 'admin' && (
              <button 
                onClick={() => setIsAdminPanelOpen(true)}
                className="p-1.5 hover:bg-slate-100 rounded-md text-violet-400 hover:text-violet-600 transition-all"
                title="Painel ADM"
              >
                <Users size={14} />
              </button>
            )}
            <button 
              onClick={forceUpdate}
              className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-orange-600 transition-all"
              title="Forçar Atualização"
            >
              <RefreshCcw size={14} />
            </button>
            <button 
              onClick={handleLogout}
              className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-all"
              title="Sair"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        <div className="p-4">
          <button 
            onClick={() => createNewSermon()}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-sm group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            Novo Esboço
          </button>
        </div>

        <div className="px-4 mb-4">
          <div className="relative group font-sans">
            <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 transition-colors", isSearching ? "text-violet-500 animate-pulse" : "text-slate-400 group-focus-within:text-violet-500")} size={16} />
            <input 
              type="text"
              placeholder="Busca Semântica (IA)..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSemanticSearch((e.target as HTMLInputElement).value);
                }
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all placeholder:text-slate-400"
            />
            {searchResults && (
              <button 
                onClick={() => setSearchResults(null)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {searchResults && (
            <div className="mt-2 text-[10px] text-violet-600 font-bold bg-violet-50 px-2 py-1 rounded border border-violet-100 flex items-center justify-between font-sans">
              Filtro IA Ativo
              <span className="text-[8px] opacity-70">Encontrados: {searchResults.length}</span>
            </div>
          )}
        </div>

        <div className="px-4 py-2 flex flex-col gap-1">
          <button 
            onClick={() => {
              setCurrentView('editor');
              setMobileTab('editor');
              if(window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all font-sans",
              currentView === 'editor' ? "bg-violet-50 text-violet-600 shadow-sm" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <FileText size={18} />
            Editor de Sermões
          </button>
          <button 
            onClick={() => {
              setCurrentView('series');
              setMobileTab('series');
              if(window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all font-sans",
              currentView === 'series' ? "bg-violet-50 text-violet-600 shadow-sm" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <Layers size={18} />
            Séries
          </button>
          <button 
            onClick={() => {
              setCurrentView('agenda');
              setMobileTab('agenda');
              if(window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all font-sans",
              currentView === 'agenda' ? "bg-violet-50 text-violet-600 shadow-sm" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <Calendar size={18} />
            Agenda de Pregações
          </button>
          <button 
            onClick={() => {
              setCurrentView('library');
              setMobileTab('library');
              if(window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all font-sans",
              currentView === 'library' ? "bg-violet-50 text-violet-600 shadow-sm" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <Book size={18} />
            Biblioteca Teológica
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-20 lg:pb-0">
          <div className="px-4 py-2 flex items-center justify-between">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Séries de Mensagens</h2>
            <button 
              onClick={() => {
                const title = prompt('Título da Nova Série:');
                if (title) createNewSeries(title);
              }}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-orange-600"
            >
              <Plus size={14} />
            </button>
          </div>
          
          <div className="flex flex-col gap-1 px-2 mb-4">
            {series.map(ser => (
              <div 
                key={ser.id}
                className="group flex flex-col p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 truncate">{ser.title}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      createNewSermon(ser.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 bg-orange-50 text-orange-600 rounded"
                    title="Adicionar Sermão a esta Série"
                  >
                    <Plus size={10} />
                  </button>
                </div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  {sermons.filter(s => s.seriesId === ser.id).length} Sermões
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-2">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Todos os Esboços</h2>
          </div>
          {sermons.length === 0 ? (
            <div className="text-center py-12 px-6">
              <FileText size={40} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Nenhum esboço salvo ainda.</p>
            </div>
          ) : (
            sermons.filter(s => !searchResults || searchResults.includes(s.id)).map(s => (
              <div
                key={s.id}
                onClick={() => {
                  setCurrentSermonId(s.id);
                  setMobileTab('editor');
                  if(window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-all group relative cursor-pointer",
                  currentSermonId === s.id ? "bg-orange-50 text-orange-900 border-l-4 border-orange-500" : "hover:bg-slate-100 text-slate-700"
                )}
              >
                <div className="text-sm font-bold truncate pr-6 group-hover:text-orange-600 transition-colors uppercase tracking-tight">{s.title || 'Esboço sem título'}</div>
                <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-1.5 uppercase font-black tracking-widest">
                  <Clock size={10} />
                  {formatDate(s.updatedAt)}
                  {s.seriesId && (
                    <span className="ml-auto bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded text-[8px]">
                      {series.find(ser => ser.id === s.seriesId)?.title}
                    </span>
                  )}
                </div>
                <button 
                  onClick={(e) => deleteSermon(e, s.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 hover:text-red-600 rounded-md transition-all z-10"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        {/* Top Navbar */}
        <header className="h-16 lg:h-14 border-b border-slate-100 flex items-center justify-between px-4 lg:px-6 bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2 lg:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors lg:hidden"
            >
              <Users size={20} />
            </button>
            <div className="hidden lg:block w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-2">
              <button 
                onClick={handleGenerateOutlineFromTheme}
                className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 text-xs font-semibold rounded-full border border-orange-100 hover:bg-orange-100 transition-colors"
              >
                <Sparkles size={14} />
                <span className="hidden sm:inline">Esboço IA</span>
              </button>
              <button 
                onClick={() => handleAiAction('slides', '')}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-700 text-xs font-semibold rounded-full border border-slate-100 hover:bg-slate-100 transition-colors"
              >
                <Presentation size={14} />
                Slides
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
             {isAiLoading && (
               <div className="flex items-center gap-2 text-xs text-orange-500 font-bold bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                 <Loader2 size={12} className="animate-spin" />
                 <span className="hidden sm:inline">IA pensando...</span>
               </div>
             )}
             <button 
                onClick={() => setIsPresenting(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 p-2 lg:px-3 lg:py-1.5 rounded-lg border border-orange-100 hover:bg-orange-100 transition-colors"
                title="Modo Apresentação"
              >
                <Presentation size={16} />
                <span className="hidden md:inline">Apresentar</span>
              </button>
              <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-tighter bg-slate-50 px-2 py-1 rounded border border-slate-100">
               <Save size={10} />
               Sincronizado
             </div>
             <button 
              onClick={() => setIsBibleSearchOpen(!isBibleSearchOpen)}
              className={cn(
                "hidden lg:flex items-center gap-2 p-2 lg:px-4 lg:py-1.5 rounded-lg lg:rounded-full text-xs font-semibold transition-all",
                isBibleSearchOpen ? "bg-slate-900 text-white shadow-md shadow-slate-200" : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
              )}
            >
              <BookOpen size={16} />
              <span className="hidden md:inline">Bíblia</span>
            </button>
            <button 
              onClick={() => setIsAdminPanelOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl"
            >
              <Shield size={20} />
            </button>
          </div>
        </header>

        {/* Editor, Series, Agenda or Library Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-12 py-6 bg-slate-50">
          <div className="max-w-[1200px] mx-auto pb-24 md:pb-12 h-full">
            {currentView === 'library' ? (
              <Library 
                resources={resources}
                onUpload={handleResourceUpload}
                onDelete={handleResourceDelete}
                userApproved={userProfile?.approved || false}
                searchResults={searchResults}
              />
            ) : currentView === 'series' ? (
              <SeriesPanel
                sermons={sermons}
                series={series}
                onCreateSeries={async (data) => {
                  await createNewSeries(data.title, data.description || '');
                }}
                onDeleteSeries={deleteSeriesWithGradients}
                onSelectSermon={(sId) => {
                  setCurrentSermonId(sId);
                  setCurrentView('editor');
                }}
                onNewSermonWithSeries={(serId) => {
                  createNewSermon(serId);
                }}
              />
            ) : currentView === 'agenda' ? (
              <PreachingSchedule
                sermons={sermons}
                agenda={agenda}
                onCreateEntry={createAgendaEntry}
                onUpdateEntry={updateAgendaEntry}
                onDeleteEntry={deleteAgendaEntry}
                onSelectSermon={(sId) => {
                  setCurrentSermonId(sId);
                  setCurrentView('editor');
                }}
              />
            ) : currentSermon ? (
              <Editor 
                content={currentSermon.content} 
                onChange={(content) => updateSermon({ content })} 
                onAiAction={handleAiAction}
                onTitleChange={(title) => updateSermon({ title })}
                title={currentSermon.title}
                sermonId={currentSermonId}
                readOnly={currentSermon.userId !== user?.uid}
              />
            ) : currentSermonId ? (
              <div className="h-[70vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-violet-600" size={32} />
              </div>
            ) : (
              <div className="h-[70vh] flex flex-col items-center justify-center text-slate-400 space-y-4">
                <div className="bg-slate-50 w-24 h-24 rounded-[40px] flex items-center justify-center shadow-inner">
                  <BookOpen size={40} className="text-slate-200" />
                </div>
                <div className="text-center px-6">
                  <p className="text-lg font-bold text-slate-800">Pronto para pregar?</p>
                  <p className="text-sm">Selecione um esboço ou crie um novo para começar.</p>
                </div>
                <button 
                  onClick={() => createNewSermon()}
                  className="mt-4 px-8 py-3 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                >
                  Criar Novo Esboço
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Buttons for Mobile AI */}
        <AnimatePresence>
          {currentSermon && mobileTab === 'editor' && !isAiLoading && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="fixed bottom-20 right-4 flex flex-col gap-3 lg:hidden z-30"
            >
               <button 
                onClick={handleGenerateOutlineFromTheme}
                className="w-12 h-12 bg-orange-600 text-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-white active:scale-90 transition-transform"
                title="Esboço IA"
              >
                <Sparkles size={22} />
              </button>
              <button 
                onClick={() => handleAiAction('slides', '')}
                className="w-12 h-12 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-white active:scale-90 transition-transform"
                title="Gerar Slides"
              >
                <Presentation size={22} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Response Panel (Slide-up) */}
        <AnimatePresence>
          {aiResponse && (
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="absolute bottom-4 left-4 right-4 max-h-[60vh] bg-white border border-slate-200 shadow-2xl rounded-2xl z-30 flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-violet-600" />
                  <span className="text-sm font-bold text-slate-800">Sugestão da IA</span>
                </div>
                <button 
                  onClick={() => {
                    setAiResponse(null);
                    setAiActionType(null);
                  }}
                  className="p-1 hover:bg-slate-200 rounded-md transition-colors"
                >
                  <ChevronRight size={20} className="rotate-90" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 prose prose-sm max-w-none prose-slate">
                <div dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(aiResponse) }} />
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between gap-4">
                 {(aiActionType === 'slides' || (aiResponse && aiResponse.includes('Slide 1'))) && (
                   <button 
                     onClick={async () => {
                       const slides = parseSlides(aiResponse || '');
                       if (slides.length > 0) {
                         await generatePowerPoint(currentSermon?.title || 'Sermão', slides);
                       } else {
                         alert('Não foi possível identificar o formato dos slides para exportação.');
                       }
                     }}
                     className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
                   >
                     <Download size={16} />
                     Baixar PowerPoint
                   </button>
                 )}
                 <button 
                  onClick={() => {
                    const newContent = (currentSermon?.content || '') + `<hr/><div class="ai-suggestion">${parseMarkdownToHtml(aiResponse)}</div>`;
                    updateSermon({ content: newContent });
                    setAiResponse(null);
                    setAiActionType(null);
                  }}
                  className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-violet-700 transition-colors shadow-sm ml-auto"
                >
                  Adicionar ao Sermão
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bible Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isBibleSearchOpen ? (window.innerWidth < 1024 ? '100vw' : 320) : 0, 
          opacity: isBibleSearchOpen ? 1 : 0,
          x: isBibleSearchOpen ? 0 : 320
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={cn(
          "flex flex-col bg-white z-[70] border-l border-slate-200 fixed top-0 bottom-16 right-0 lg:bottom-0 lg:relative lg:translate-x-0 overflow-hidden"
        )}
      >
        <div className="flex-1 flex flex-col min-h-0 h-full">
          <div className="p-4 lg:hidden border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <h3 className="font-bold text-slate-800">Bíblia Sagrada</h3>
            <button onClick={() => setMobileTab('editor')} className="p-2 text-slate-400">
               <X size={20} />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <BibleSearch onAddVerse={addVerseToEditor} />
          </div>
        </div>
      </motion.aside>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around z-[100] lg:hidden px-2 pb-safe">
        <button 
          onClick={() => setMobileTab('list')}
          className={cn(
            "flex flex-col items-center gap-1 flex-1 py-1 transition-all rounded-xl",
             mobileTab === 'list' ? "text-orange-600 scale-110" : "text-slate-400"
          )}
        >
          <List size={22} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Esboços</span>
        </button>
        <div className="w-px h-8 bg-slate-100" />
        <button 
          onClick={() => setMobileTab('editor')}
          className={cn(
            "flex flex-col items-center gap-1 flex-1 py-1 transition-all rounded-xl",
             mobileTab === 'editor' ? "text-orange-600 scale-110" : "text-slate-400"
          )}
        >
          <BookOpen size={22} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Editor</span>
        </button>
        <button 
          onClick={() => {
            setMobileTab('library');
            setCurrentView('library');
          }}
          className={cn(
            "flex flex-col items-center gap-1 flex-1 py-1 transition-all rounded-xl",
             mobileTab === 'library' ? "text-orange-600 scale-110" : "text-slate-400"
          )}
        >
          <Layout size={22} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Biblioteca</span>
        </button>
        <div className="w-px h-8 bg-slate-100" />
        <button 
          onClick={() => setMobileTab('bible')}
          className={cn(
            "flex flex-col items-center gap-1 flex-1 py-1 transition-all rounded-xl",
             mobileTab === 'bible' ? "text-orange-600 scale-110" : "text-slate-400"
          )}
        >
          <BookOpen size={22} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Bíblia</span>
        </button>
      </nav>
      </div>
    </>
  );
}
