import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/motion.css'
import '@/lib/logger' // Inicializa captura de erros globais

createRoot(document.getElementById("root")!).render(<App />);
