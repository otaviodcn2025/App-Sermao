import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  FileText, 
  Layers, 
  Calendar, 
  Plus, 
  HelpCircle, 
  ArrowRight, 
  ChevronRight, 
  Play, 
  Check, 
  Copy, 
  Library, 
  Upload, 
  Menu,
  FileDown,
  Info,
  ExternalLink,
  Bot,
  Compass,
  MessageSquare,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface InteractiveManualProps {
  onNavigateView?: (view: any) => void;
  onClose?: () => void;
}

type GuideTab = 'welcome' | 'ai-sermon' | 'blb-study' | 'library' | 'schedule' | 'sim';

export default function InteractiveManual({ onNavigateView, onClose }: InteractiveManualProps) {
  const [activeTab, setActiveTab] = useState<GuideTab>('welcome');
  const [simStep, setSimStep] = useState<number>(0);
  const [simOutlineTitle, setSimOutlineTitle] = useState('O Poder da Graça');
  const [simGeneratedText, setSimGeneratedText] = useState('');
  const [isSimulatingText, setIsSimulatingText] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Simulation AI content
  const startSimulation = () => {
    setSimStep(1);
    setIsSimulatingText(true);
    setSimGeneratedText('');
    
    const stepsText = [
      `✍️ **Título:** O Poder da Graça Transformadora\n\n`,
      `📖 **Texto Base de Estudo:** Efésios 2:8-9\n\n`,
      `💡 **Introdução:** A graça não é apenas uma doutrina de perdão; é o motor dinâmico que nos reconcilia e transforma nossa conduta diária.\n\n`,
      `🔹 **Ponto 1: Favor Imerecido (Grego: Χάρις - Charis)**\n`,
      `   A graça nos resgata do abismo em que nossas próprias forças falharam. É um presente incondicional divino.\n\n`,
      `🔹 **Ponto 2: Pela Fé na Prática**\n`,
      `   O canal humano para a ativação desse dom é a fé, que confia plenamente nos méritos de Cristo, e não em realizações próprias.\n\n`,
      `🔹 **Ponto 3: Obra Suprema da Criação**\n`,
      `   Somos gerados para as boas obras que o Pai preparou de antemão.`
    ];

    let currentText = '';
    let i = 0;
    
    const timer = setInterval(() => {
      if (i < stepsText.length) {
        currentText += stepsText[i];
        setSimGeneratedText(currentText);
        i++;
      } else {
        clearInterval(timer);
        setIsSimulatingText(false);
        setSimStep(2); // Generation complete, allow inserting BLB study
      }
    }, 450);
  };

  const insertSimStudy = () => {
    setSimStep(3);
    setSimGeneratedText(prev => prev + `\n\n---\n🔎 **ESTUDO EXEGÉTICO BLB (Efésios 2:8)**\n` + 
      `• **Palavra Original (Grego):** χάριτι (chariti) — Strong G5485\n` +
      `• **Parte do Discurso:** Substantivo Feminino\n` + 
      `• **Tradução:** Graça, benevolência imerecida, favor divino que concede salvação.\n` +
      `• **Paralelo Cruzado (Romanos 5:15):** Mas não é assim o dom gratuito como a ofensa. Porque, se pela ofensa de um morreram muitos, muito mais a graça de Deus abundante em muitos.\n` +
      `• **Exegese:** O artigo definido aponta para 'A' graça bem conhecida por Paulo. Não é um conceito abstrato, mas um poder personificado na cruz.`
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(simGeneratedText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg leading-relaxed text-slate-700 h-full flex flex-col min-h-0 overflow-hidden font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 p-5 shrink-0 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center justify-center -mr-10">
          <BookOpen size={160} />
        </div>
        <div className="flex items-start justify-between relative z-10">
          <div>
            <span className="text-[10px] bg-white/25 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest block w-fit mb-2">Tutorial Integrado</span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Manual Dinâmico do Pregador</h2>
            <p className="text-xs text-violet-100 mt-1 max-w-lg">
              Aprenda a utilizar os recursos de inteligência artificial, exegese lexical e biblioteca teológica para o seu ministério de pregação.
            </p>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1 px-2.5 bg-white/20 hover:bg-white/30 text-white text-xs font-black rounded-lg transition-colors cursor-pointer border-none"
            >
              FECHAR ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0 divide-x divide-slate-100 flex-col md:flex-row">
        {/* Left Nav menu - list items */}
        <div className="w-full md:w-56 bg-slate-50/50 p-2.5 shrink-0 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto border-b md:border-b-0 border-slate-100">
          <button
            onClick={() => setActiveTab('welcome')}
            className={cn(
              "w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold font-sans flex items-center gap-2.5 transition-all shrink-0 md:shrink border-none outline-none cursor-pointer",
              activeTab === 'welcome' ? "bg-white text-violet-700 shadow-xs ring-1 ring-slate-200/50" : "text-slate-500 hover:bg-slate-100/50"
            )}
          >
            <Compass size={15} className={activeTab === 'welcome' ? "text-violet-600" : "text-slate-400"} />
            <span>Guia do Usuário</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-sermon')}
            className={cn(
              "w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold font-sans flex items-center gap-2.5 transition-all shrink-0 md:shrink border-none outline-none cursor-pointer",
              activeTab === 'ai-sermon' ? "bg-white text-violet-700 shadow-xs ring-1 ring-slate-200/50" : "text-slate-500 hover:bg-slate-100/50"
            )}
          >
            <Sparkles size={15} className={activeTab === 'ai-sermon' ? "text-amber-500" : "text-slate-400"} />
            <span>IA & Esboços</span>
          </button>

          <button
            onClick={() => setActiveTab('blb-study')}
            className={cn(
              "w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold font-sans flex items-center gap-2.5 transition-all shrink-0 md:shrink border-none outline-none cursor-pointer",
              activeTab === 'blb-study' ? "bg-white text-violet-700 shadow-xs ring-1 ring-slate-200/50" : "text-slate-500 hover:bg-slate-100/50"
            )}
          >
            <BookOpen size={15} className={activeTab === 'blb-study' ? "text-rose-500" : "text-slate-400"} />
            <span>Bíblia & Strong (BLB)</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={cn(
              "w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold font-sans flex items-center gap-2.5 transition-all shrink-0 md:shrink border-none outline-none cursor-pointer",
              activeTab === 'library' ? "bg-white text-violet-700 shadow-xs ring-1 ring-slate-200/50" : "text-slate-500 hover:bg-slate-100/50"
            )}
          >
            <Library size={15} className={activeTab === 'library' ? "text-sky-500" : "text-slate-400"} />
            <span>Biblioteca de PDFs</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={cn(
              "w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold font-sans flex items-center gap-2.5 transition-all shrink-0 md:shrink border-none outline-none cursor-pointer",
              activeTab === 'schedule' ? "bg-white text-violet-700 shadow-xs ring-1 ring-slate-200/50" : "text-slate-500 hover:bg-slate-100/50"
            )}
          >
            <Calendar size={15} className={activeTab === 'schedule' ? "text-violet-500" : "text-slate-400"} />
            <span>Séries & Agenda</span>
          </button>

          <div className="hidden md:block my-2 border-t border-slate-100" />

          <button
            onClick={() => {
              setActiveTab('sim');
              setSimStep(0);
              setSimGeneratedText('');
            }}
            className={cn(
              "w-full text-left px-3.5 py-3 rounded-xl text-xs font-black font-sans flex items-center gap-2.5 transition-all shrink-0 md:shrink border-none outline-none cursor-pointer uppercase tracking-tight bg-emerald-50 text-emerald-700",
              activeTab === 'sim' ? "bg-emerald-600 text-white shadow-xs" : "hover:bg-emerald-100/50"
            )}
          >
            <Play size={14} className={activeTab === 'sim' ? "text-white" : "text-emerald-600"} />
            <span>Simulador IA</span>
          </button>
        </div>

        {/* Right side content pane */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6" id="manual-content-body">
          <AnimatePresence mode="wait">
            {/* WELCOME VIEW */}
            {activeTab === 'welcome' && (
              <motion.div 
                key="welcome"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <Compass className="text-violet-600" size={18} /> Boas-vindas ao seu Espaço Homilético
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Este software foi projetado de forma cirúrgica e personalizada para ajudar pastores a preparar, arquivar e pregar sermões edificantes utilizando as tecnologias mais avançadas de IA e exegese teológica.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <span className="text-slate-900 font-extrabold text-sm block mb-1">⛪ Centralizador Ministerial</span>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Gerencie seu catálogo completo de mensagens, separe-os em temas/campanhas de séries e acompanhe no calendário de pregação de modo integrado.
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <span className="text-slate-900 font-extrabold text-sm block mb-1">📖 Exegese Avançada no Ar</span>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Painel Bíblico com os códigos Strong completos em português para analisar raízes gregas/hebraicas de cada termo e inserir nas notas de 1 clique.
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <span className="text-emerald-700 font-extrabold text-sm block mb-1">🤖 Inteligência Artificial Co-Pastor</span>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Auxilia na estruturação de ideias homiléticas batistas, sugere três pontos doutrinários principais e gera esquemas de slides em segundos.
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <span className="text-sky-700 font-extrabold text-sm block mb-1">📂 Importador de PDFs de Estudo</span>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Extrai automaticamente manuscritos antigos ou apostilas teológicas no editor, marcando parágrafos vitais por marcadores.
                    </p>
                  </div>
                </div>

                <div className="bg-violet-50/60 p-4 rounded-xl border border-violet-100 flex items-start gap-3">
                  <Info size={16} className="text-violet-600 mt-1 shrink-0" />
                  <div>
                    <h5 className="text-xs font-extrabold text-violet-900 uppercase">Dica de Introdução:</h5>
                    <p className="text-xs text-slate-600 mt-1">
                      A maneira mais rápida de aprender é usar o **Simulador IA** no menu esquerdo. Lá você pode testar a inteligência de esboços e o léxico bíblico imediatamente sem afetar seus sermões reais!
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Ministério Organizado</span>
                  <button 
                    onClick={() => setActiveTab('ai-sermon')}
                    className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-black px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Próximo Passo <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* AI SERMON OUTLINES */}
            {activeTab === 'ai-sermon' && (
              <motion.div 
                key="ai-sermon"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  <Sparkles className="text-amber-500 animate-pulse" size={18} /> Geração de Esboços & Slides com IA
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  A inteligência artificial integrada atua como um assistente pastoral teologicamente fundamentado. Ela ajuda você a superar a "fobia da página em branco" estruturando de forma lógica seu tema de preferência.
                </p>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3.5">
                  <div className="flex gap-2.5 items-start">
                    <div className="bg-white border rounded px-1.5 py-0.5 mt-0.5 text-[9px] font-mono font-black text-amber-700 bg-amber-50 border-amber-100">1</div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase">Esboço por Tema ou Versículo Chave</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                        Clique no botão **"Esboço IA"** localizado no canto superior direito do cabeçalho. Insira o tema (ex: "Graça redentora" ou "Ansiedade") e o versículo principal. A IA devolverá um roteiro estruturado com Introdução, Três Pontos Principais detalhados e Aplicação Prática.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start border-t border-slate-100 pt-3">
                    <div className="bg-white border rounded px-1.5 py-0.5 mt-0.5 text-[9px] font-mono font-black text-amber-700 bg-amber-50 border-amber-100">2</div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase">Gerador de Slides Integrado</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                        No Editor ou clicando no botão **"Slides"** do menu superior, você pode converter o esboço ativo em sequências de slides para projeção na igreja. Cada slide conterá o título, a referência bíblica associada e as notas rápidas do orador.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start border-t border-slate-100 pt-3">
                    <div className="bg-white border rounded px-1.5 py-0.5 mt-0.5 text-[9px] font-mono font-black text-amber-700 bg-amber-50 border-amber-100">3</div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase">Análise de Tom Exegético</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                        Ao selecionar palavras ou parágrafos no editor de texto, o menu da IA permite obter sugestões teológicas adicionais, analisar a hermenêutica ou reformular a linguagem pastoral instantaneamente.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-4 border-t border-slate-105">
                  <button 
                    onClick={() => setActiveTab('welcome')}
                    className="text-slate-500 font-bold hover:underline cursor-pointer border-none bg-transparent"
                  >
                    Voltar
                  </button>
                  <button 
                    onClick={() => setActiveTab('blb-study')}
                    className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-black px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Estudo Blue Letter <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* BIBLE & BLB STUDY */}
            {activeTab === 'blb-study' && (
              <motion.div 
                key="blb-study"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  <BookOpen className="text-rose-500" size={18} /> Léxico Forte & Concordância Teológica (BLB)
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Para pastores reformados, batistas e estudiosos que prezam pelo compromisso com o texto bíblico original, o painel do lado direito contém o sistema similar de estudo hermenêutico inspirado no **Blue Letter Bible (BLB)** completamente traduzido para o Português brasileiro.
                </p>

                <div className="space-y-3">
                  <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100/60 flex gap-3">
                    <div className="w-10 h-10 bg-rose-100 text-rose-700 rounded-lg flex items-center justify-center shrink-0">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase">Como funciona a concordância?</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1">
                        Ao abrir o painel **"Bíblia"** na barra superior direita, navegue até qualquer versículo. Ao passar o mouse por cima do versículo, o botão **"ESTUDAR"** aparecerá. Ele puxará o mapeamento exegético do versículo imediatamente.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-150 space-y-3">
                    <h5 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">O que você tem acesso no Estudo:</h5>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <li className="flex gap-2 items-start text-slate-600 leading-relaxed">
                        <span className="text-rose-600 mt-0.5">🔹</span>
                        <div>
                          <strong className="text-slate-800 font-bold block">Originais Grego/Hebraico:</strong>
                          Raízes silábicas, transliteração fonética, códigos no léxico Strong (H/G) e detalhe exegético.
                        </div>
                      </li>
                      <li className="flex gap-2 items-start text-slate-600 leading-relaxed">
                        <span className="text-rose-600 mt-0.5">🔹</span>
                        <div>
                          <strong className="text-slate-800 font-bold block">Concordância Paralela:</strong>
                          Compare o mesmo versículo nas versões clássicas e modernas: ACF, ARA, NVI e NTLH lado a lado.
                        </div>
                      </li>
                      <li className="flex gap-2 items-start text-slate-600 leading-relaxed">
                        <span className="text-rose-600 mt-0.5">🔹</span>
                        <div>
                          <strong className="text-slate-800 font-bold block">Referências Cruzadas (TSK):</strong>
                          Pontes entre passagens que compartilham pensamentos teológicos profundos.
                        </div>
                      </li>
                      <li className="flex gap-2 items-start text-slate-600 leading-relaxed">
                        <span className="text-rose-600 mt-0.5">🔹</span>
                        <div>
                          <strong className="text-slate-800 font-bold block">Exposições e Esboço:</strong>
                          Comentário pastoral de análise estrutural focado na aplicação teológica batista e notas devocionais.
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-slate-900 text-white p-3.5 rounded-xl text-xs space-y-1">
                    <span className="text-[9px] font-black text-rose-300 uppercase tracking-widest block">💡 Super Praticidade</span>
                    <p className="text-slate-300 leading-relaxed">
                      Ao bater o olho em um estudo lexical que gostou, clique no botão **"Inserir"** ou **"Copiar Estudo"** e ele será automaticamente colado nas notas do seu sermão, economizando minutos de digitação manual!
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-4 border-t border-slate-105">
                  <button 
                    onClick={() => setActiveTab('ai-sermon')}
                    className="text-slate-500 font-bold hover:underline cursor-pointer border-none bg-transparent"
                  >
                    Voltar
                  </button>
                  <button 
                    onClick={() => setActiveTab('library')}
                    className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-black px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Biblioteca de PDFs <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* LIBRARY / resources */}
            {activeTab === 'library' && (
              <motion.div 
                key="library"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  <Library className="text-sky-500" size={18} /> Biblioteca Teológica & Extração de PDFs
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Evite perder suas referências bibliográficas favoritas! Centralize livros, arquivos acadêmicos, esboços antigos salvos em Word ou arquivos **PDF** de forma estruturada.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-slate-150 rounded-xl p-4 space-y-2.5">
                    <div className="p-1 px-2.5 bg-sky-50 text-sky-700 text-[10px] font-black rounded-lg w-fit uppercase">Leitor Inteligente</div>
                    <h4 className="text-xs font-black text-slate-800 uppercase leading-normal">Como carregar materiais de estudo:</h4>
                    <p className="text-xs text-slate-500 leading-normal">
                      Acesse a guia **"Biblioteca"** no menu principal. Arraste qualquer documento PDF ou clique em Selecionar Arquivo para subir esboços antigos de pregações. Nossa ferramenta lê as páginas em background.
                    </p>
                  </div>

                  <div className="border border-slate-150 rounded-xl p-4 space-y-2.5">
                    <div className="p-1 px-2.5 bg-sky-50 text-sky-700 text-[10px] font-black rounded-lg w-fit uppercase">Índice Clássico de Páginas</div>
                    <h4 className="text-xs font-black text-slate-800 uppercase leading-normal">Visualizador de TOC & Marcador:</h4>
                    <p className="text-xs text-slate-500 leading-normal">
                      Ao abrir os livros dentro da biblioteca, o painel do leitor extrai automaticamente o sumário do livro facilitando pulo por páginas. Você pode arrastar para selecionar trechos marcando com cores, ou extrair e enviá-los de imediato para a área do editor selecionado.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-3">
                  <Info size={16} className="text-sky-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Você pode cruzar os dados da biblioteca com as pastas de sermões abrindo o livro paralelamente de modo a manter sua tese e exegetas no campo de visão enquanto digita novas notas homiléticas de aplicação.
                  </p>
                </div>

                <div className="flex justify-between items-center text-xs pt-4 border-t border-slate-105">
                  <button 
                    onClick={() => setActiveTab('blb-study')}
                    className="text-slate-500 font-bold hover:underline cursor-pointer border-none bg-transparent"
                  >
                    Voltar
                  </button>
                  <button 
                    onClick={() => setActiveTab('schedule')}
                    className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-black px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Séries & Agenda <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* SCHEDULE & SERIES */}
            {activeTab === 'schedule' && (
              <motion.div 
                key="schedule"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  <Calendar className="text-violet-600" size={18} /> Organização de Campanhas, Séries e Sélas
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Para uma pregação saudável ao longo das semanas, a boa prática homilética sugere estruturar séries temáticas para que a congregação entenda o contexto integral das escrituras.
                </p>

                <div className="space-y-3.5">
                  <div className="border border-slate-150 rounded-xl p-4 flex gap-3.5 items-start">
                    <div className="w-9 h-9 bg-pink-50 text-pink-600 rounded-lg flex items-center justify-center shrink-0">
                      <Layers size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase">Séries de Pregações</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1">
                        Crie Campanhas (ex: "Sermão do Monte", "Família sob a Rocha") na aba **"Séries"**. Vincule múltiplos sermões a ela para organizar o material cronológico e agrupar estudos em livros compartilhados ou apresentações unificadas.
                      </p>
                    </div>
                  </div>

                  <div className="border border-slate-150 rounded-xl p-4 flex gap-3.5 items-start">
                    <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase">Agenda de Ministrações</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1">
                        Na aba **"Agenda"**, marque as datas de seus próximos cultos, o local (ex: Templo Central, Sala de Jovens), horário da pregação e qual dos seus esboços você está escalando para expor naquele dia. Isso garante planejamento ministerial e evita repetição recente de estudos.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-4 border-t border-slate-105">
                  <button 
                    onClick={() => setActiveTab('library')}
                    className="text-slate-500 font-bold hover:underline cursor-pointer border-none bg-transparent"
                  >
                    Voltar
                  </button>
                  <button 
                    onClick={() => {
                      setActiveTab('sim');
                      setSimStep(0);
                      setSimGeneratedText('');
                    }}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-lg cursor-pointer uppercase tracking-tight"
                  >
                    Testar no Simulador <Play size={11} fill="white" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* INTERACTIVE SIMULATOR (TRY IT NOW) - THE REAL BENTO BOX FOR INTERACTION */}
            {activeTab === 'sim' && (
              <motion.div 
                key="sim"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-black text-slate-850 uppercase tracking-tight flex items-center gap-2">
                    <Play size={14} className="text-emerald-600" fill="currentColor" /> Simulador de Fluxo Homilético IA
                  </h3>
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 font-black px-2 py-0.5 rounded uppercase">Prática Imediata</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Use os controles inferiores para assistir como a IA cria os pontos teológicos e insere de modo instantâneo as referências lexicais de pesquisa no mesmo editor. É o rascunho em tempo real!
                </p>

                {/* Simulated Workspace */}
                <div className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-xs relative">
                  {/* Top toolbar */}
                  <div className="bg-slate-900 text-slate-200 px-3.5 py-2.5 flex items-center justify-between text-[11px] font-sans">
                    <div className="flex items-center gap-2 font-black uppercase text-white tracking-widest text-[9px]">
                      <FileText size={12} className="text-amber-500" /> Editor de Teste: {simOutlineTitle}
                    </div>
                    <div className="flex gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    </div>
                  </div>

                  {/* Body window of editor */}
                  <div className="p-4 bg-white min-h-[190px] max-h-[240px] overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-700 whitespace-pre-line">
                    {simStep === 0 && (
                      <div className="h-full flex flex-col items-center justify-center py-8 text-center space-y-2 text-slate-400 font-sans">
                        <Bot size={28} className="text-slate-300 animate-bounce" />
                        <div>
                          <p className="text-xs font-black text-slate-700 uppercase">Editor sem rascunho</p>
                          <p className="text-[10px] text-slate-400 mt-1 max-w-[280px]">
                            Clique em **"1. Gerar Roteiro Geral por IA"** no painel de comando abaixo.
                          </p>
                        </div>
                      </div>
                    )}

                    {simStep > 0 && (
                      <div className="space-y-2 relative">
                        {simOutlineTitle && (
                          <div className="text-emerald-700 font-sans font-black uppercase tracking-wider text-[10px] border-b pb-1">
                            🚀 Simulando Manuscrito
                          </div>
                        )}
                        <p>{simGeneratedText}</p>
                        {isSimulatingText && (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-sans pb-4">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-ping" />
                            IA escrevendo exegese...
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Simulator Controls Toolbar inside Box */}
                  <div className="bg-slate-50 border-t border-slate-150 p-3.5 flex flex-wrap gap-2 justify-between items-center font-sans">
                    <div className="flex gap-2">
                      <button
                        onClick={startSimulation}
                        disabled={isSimulatingText}
                        className={cn(
                          "px-3 py-2 text-[10px] font-black uppercase rounded-lg shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1",
                          simStep === 0 ? "bg-amber-500 text-white hover:bg-amber-600 animate-pulse" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        )}
                      >
                        <Sparkles size={11} /> 1. Gerar Rascunho IA
                      </button>

                      <button
                        onClick={insertSimStudy}
                        disabled={simStep < 2 || isSimulatingText}
                        className={cn(
                          "px-3 py-2 text-[10px] font-black uppercase rounded-lg shadow-xs border transition-all cursor-pointer flex items-center gap-1",
                          simStep === 2 ? "bg-rose-600 text-white hover:bg-rose-700 animate-bounce border-transparent" : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                        )}
                      >
                        <BookOpen size={11} /> 2. Inserir Estudo BLB
                      </button>
                    </div>

                    {simStep >= 2 && (
                      <button
                        onClick={handleCopy}
                        className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        {copiedText ? <Check size={11} className="text-emerald-400 animate-pulse" /> : <Copy size={11} />} {copiedText ? 'Copiado!' : 'Copiar Toda Nota'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Step explainer under simulator */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150/70 text-xs text-slate-600 leading-normal space-y-1.5">
                  <div className="font-extrabold text-slate-800 uppercase text-[9px] tracking-wider">Como converter esse teste em produção:</div>
                  {simStep === 0 && <p className="text-[11px]">👉 Clique no botão amarelo **"1. Gerar Rascunho IA"** para assistir a renderização dinâmica simulada de João 1:1 / Efésios.</p>}
                  {simStep === 1 && <p className="text-[11px] text-amber-700 animate-pulse">⚡ A Inteligência Artificial está montando o rascunho com introdução e 3 pontos homiléticos principais...</p>}
                  {simStep === 2 && <p className="text-[11px] text-rose-700">🎉 Excelente! Agora clique em **"2. Inserir Estudo BLB"** para colar em 1 clique a raiz grega de Efésios obtida na Concordância.</p>}
                  {simStep === 3 && (
                    <div className="text-[11px] text-emerald-800 space-y-1">
                      <p className="font-bold">✨ Incrível! Você simulou com sucesso um roteiro pastoral avançado para o seu ministério!</p>
                      <p className="text-[10px] text-slate-500">Para fazer isso de verdade, basta abrir o **"Editor de Sermões"**, clicar em **"Esboço IA"** para gerar notas, abrir a barra lateral **"Bíblia"**, e dar clique duplo em **"+ Estudar"** em qualquer verso!</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs pt-4 border-t border-slate-105">
                  <button 
                    onClick={() => setActiveTab('schedule')}
                    className="text-slate-500 font-bold hover:underline cursor-pointer border-none bg-transparent"
                  >
                    Voltar
                  </button>
                  {onNavigateView && (
                    <button 
                      onClick={() => {
                        onNavigateView('editor');
                        if (onClose) onClose();
                      }}
                      className="flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white font-black px-4 py-2.5 rounded-lg shadow-sm cursor-pointer"
                    >
                      Ir para o Editor Real <Check size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
