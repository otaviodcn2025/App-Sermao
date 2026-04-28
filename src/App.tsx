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
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Editor from './components/Editor';
import BibleSearch from './components/BibleSearch';
import Auth from './components/Auth';
import { Sermon, UserProfile } from './types';
import { cn, formatDate } from './lib/utils';
import { generateSermonOutline, analyzeVerse, generateSlideDescriptions } from './lib/gemini';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
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

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [currentSermonId, setCurrentSermonId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isBibleSearchOpen, setIsBibleSearchOpen] = useState(window.innerWidth > 1024);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // Monitor screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
        setIsBibleSearchOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Monitor Auth State
  useEffect(() => {
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
    if (!user) return;

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
        const lastSelected = localStorage.getItem(`last-sermon-${user.uid}`);
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

  // Keep track of last selected sermon per user
  useEffect(() => {
    if (user && currentSermonId) {
      localStorage.setItem(`last-sermon-${user.uid}`, currentSermonId);
    }
  }, [user, currentSermonId]);

  const currentSermon = sermons.find(s => s.id === currentSermonId);

  const createNewSermon = async () => {
    if (!user) return;
    
    const collectionRef = collection(db, 'sermons');
    const newDocRef = doc(collectionRef); // Generate ID on client
    const now = Date.now();
    
    try {
      const newSermon = {
        id: newDocRef.id,
        userId: user.uid,
        title: 'Novo Sermão',
        content: '<h1>Título do Sermão</h1><p>Comece aqui seu rascunho ou use o botão <strong>Gerar Esboço com IA</strong> acima para estruturar sua mensagem.</p>',
        createdAt: now,
        updatedAt: now,
      };
      
      await setDoc(newDocRef, newSermon);
      setCurrentSermonId(newDocRef.id);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'sermons');
    }
  };

  const updateSermon = async (content: string) => {
    if (!currentSermonId || !user) return;
    
    const titleMatch = content.match(/<h1>(.*?)<\/h1>/);
    const newTitle = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : 'Sermão sem título';

    const path = `sermons/${currentSermonId}`;
    try {
      const sermonRef = doc(db, 'sermons', currentSermonId);
      await updateDoc(sermonRef, {
        content,
        title: newTitle,
        updatedAt: Date.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteSermon = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
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

  const handleAiAction = async (action: string, text: string) => {
    setIsAiLoading(true);
    setAiResponse(null);
    try {
      let result = '';
      if (action === 'expand') {
        result = await generateSermonOutline(text);
      } else if (action === 'context') {
        result = await analyzeVerse(text, ''); // Text is the reference here
      } else if (action === 'slides') {
        result = await generateSlideDescriptions(currentSermon?.content || '');
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
      updateSermon(newContent);
    }
  };

  const handleGenerateOutlineFromTheme = async () => {
    const theme = prompt('Qual o tema ou versículo base para o seu sermão?');
    if (!theme) return;

    setIsAiLoading(true);
    setAiResponse(null);
    try {
      const outline = await generateSermonOutline(theme);
      if (outline) {
        setAiResponse(outline);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar esboço: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    } finally {
      setIsAiLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-orange-600" size={40} />
      </div>
    );
  }

  if (!user) {
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

      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
      {/* Overlay for mobile sidebars */}
      <AnimatePresence>
        {(isSidebarOpen || isBibleSearchOpen) && window.innerWidth < 1024 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
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
          width: isSidebarOpen ? 280 : 0, 
          opacity: isSidebarOpen ? 1 : 0,
          x: isSidebarOpen ? 0 : -280
        }}
        className={cn(
          "flex flex-col bg-white border-r border-slate-200 shrink-0 relative overflow-hidden z-50",
          "fixed inset-y-0 left-0 lg:relative lg:translate-x-0"
        )}
      >
        <div className="p-6 border-bottom border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <h1 className="font-bold text-slate-800 tracking-tight">ConectaSermon</h1>
          </div>
        </div>

        {/* User Profile Summary */}
        <div className="px-4 py-3 mx-2 mt-2 bg-white rounded-xl flex items-center gap-3 border border-slate-100 shadow-sm">
          <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center text-orange-700 relative">
            <UserIcon size={18} />
            {userProfile?.approved && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{userProfile?.name || user.displayName || 'Usuário'}</p>
            <div className="flex items-center gap-1">
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              {userProfile?.role === 'admin' && (
                <Shield size={10} className="text-orange-500" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {userProfile?.role === 'admin' && (
              <button 
                onClick={() => setIsAdminPanelOpen(true)}
                className="p-1.5 hover:bg-slate-100 rounded-md text-orange-400 hover:text-orange-600 transition-all"
                title="Painel ADM"
              >
                <Users size={14} />
              </button>
            )}
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
            onClick={createNewSermon}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-all shadow-sm group"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            Novo Sermão
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {sermons.length === 0 ? (
            <div className="text-center py-12 px-6">
              <FileText size={40} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Nenhum sermão salvo ainda.</p>
            </div>
          ) : (
            sermons.map(s => (
              <div
                key={s.id}
                onClick={() => setCurrentSermonId(s.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-all group relative cursor-pointer",
                  currentSermonId === s.id ? "bg-orange-50 text-orange-900" : "hover:bg-slate-100 text-slate-700"
                )}
              >
                <div className="text-sm font-bold truncate pr-6 group-hover:text-orange-600 transition-colors">{s.title || 'Sermão sem título'}</div>
                <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-1.5 uppercase font-black tracking-widest">
                  <History size={10} />
                  {formatDate(s.updatedAt)}
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
        <header className="h-14 border-bottom border-slate-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <Layout size={20} />
            </button>
            <div className="w-px h-4 bg-slate-200" />
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
               <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                 <Loader2 size={12} className="animate-spin text-orange-500" />
                 Pensando...
               </div>
             )}
             <button 
                onClick={() => setIsPresenting(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 p-2 md:px-3 md:py-1.5 rounded-lg border border-orange-100 hover:bg-orange-100 transition-colors"
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
                "flex items-center gap-2 p-2 md:px-4 md:py-1.5 rounded-lg md:rounded-full text-xs font-semibold transition-all",
                isBibleSearchOpen ? "bg-slate-900 text-white shadow-md shadow-slate-200" : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
              )}
            >
              <BookOpen size={16} />
              <span className="hidden md:inline">Bíblia</span>
            </button>
          </div>
        </header>

        {/* Editor Body */}
        <div className="flex-1 overflow-y-auto px-4 py-8 md:px-12">
          <div className="max-w-4xl mx-auto">
            {currentSermon ? (
              <Editor 
                content={currentSermon.content} 
                onChange={updateSermon} 
                onAiAction={handleAiAction}
              />
            ) : currentSermonId ? (
              <div className="h-[70vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-orange-600" size={32} />
              </div>
            ) : (
              <div className="h-[70vh] flex flex-col items-center justify-center text-slate-400 space-y-4">
                <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner">
                  <FileText size={32} className="text-slate-300" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Selecione um sermão para editar</p>
                  <p className="text-xs">Ou clique no botão "+" para criar um novo.</p>
                </div>
                <button 
                  onClick={createNewSermon}
                  className="mt-4 px-6 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-100 active:scale-95"
                >
                  Começar Agora
                </button>
              </div>
            )}
          </div>
        </div>

        {/* AI Response Panel (Slide-up) */}
        <AnimatePresence>
          {aiResponse && (
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="absolute bottom-4 left-4 right-4 max-h-[60vh] bg-white border border-slate-200 shadow-2xl rounded-2xl z-30 flex flex-col overflow-hidden"
            >
              <div className="p-4 border-bottom border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-orange-500" />
                  <span className="text-sm font-bold text-slate-800">Sugestão da IA</span>
                </div>
                <button 
                  onClick={() => setAiResponse(null)}
                  className="p-1 hover:bg-slate-200 rounded-md transition-colors"
                >
                  <ChevronRight size={20} className="rotate-90" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 prose prose-sm max-w-none prose-slate">
                <div dangerouslySetInnerHTML={{ __html: aiResponse.replace(/\n/g, '<br/>') }} />
              </div>
              <div className="p-4 border-top border-slate-100 bg-slate-50 flex justify-end">
                 <button 
                  onClick={() => {
                    const newContent = (currentSermon?.content || '') + `<hr/><div class="ai-suggestion">${aiResponse.replace(/\n/g, '<br/>')}</div>`;
                    updateSermon(newContent);
                    setAiResponse(null);
                  }}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors shadow-sm"
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
          width: isBibleSearchOpen ? 320 : 0, 
          opacity: isBibleSearchOpen ? 1 : 0,
          x: isBibleSearchOpen ? 0 : 320
        }}
        className={cn(
          "flex bg-white overflow-hidden z-50 border-l border-slate-200",
          "fixed inset-y-0 right-0 lg:relative lg:translate-x-0"
        )}
      >
        <BibleSearch onAddVerse={addVerseToEditor} />
      </motion.aside>
    </div>
    </>
  );
}
