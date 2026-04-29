import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

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
  } catch (err) {
    console.error("Fatal render error:", err);
    // Fallback UI if possible
    container.innerHTML = `<div style="padding: 20px; color: red;"><h1>Erro Crítico</h1><p>${err instanceof Error ? err.message : String(err)}</p></div>`;
  }
} else {
  console.error("Root container not found");
}
