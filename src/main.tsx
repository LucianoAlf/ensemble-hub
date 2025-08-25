import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/motion.css'

// Verificação de segurança contra iframe
if (window !== window.top) {
  console.warn('App detectado em iframe, forçando redirecionamento...');
  window.top!.location.href = window.location.href;
}

createRoot(document.getElementById("root")!).render(<App />);
