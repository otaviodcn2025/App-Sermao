import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Interceptar o retorno do Google OAuth no popup
if (typeof window !== 'undefined' && window.opener && window.location.hash.includes('access_token')) {
  try {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const token = params.get('access_token');
    if (token) {
      window.opener.postMessage({ type: 'GOOGLE_DRIVE_AUTH_SUCCESS', token }, window.location.origin);
    }
  } catch (err) {
    console.error('Erro ao enviar mensagem para a janela principal:', err);
  }
  window.close();
}

console.log("Iniciando aplicação Sermão Digital...");

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );

    // Registra o Service Worker para suporte PWA e cache
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(reg => {
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('Nova versão encontrada! Forçando atualização...');
                  if (confirm('Uma nova versão do ConectaSermon está disponível. Atualizar agora?')) {
                    window.location.reload();
                  }
                }
              };
            }
          };
        }).catch(err => console.error('Erro ao registrar SW:', err));
      });
    }
  } catch (err) {
    console.error("Fatal render error:", err);
    // Fallback UI if possible
    container.innerHTML = `<div style="padding: 20px; color: red;"><h1>Erro Crítico</h1><p>${err instanceof Error ? err.message : String(err)}</p></div>`;
  }
} else {
  console.error("Root container not found");
}
