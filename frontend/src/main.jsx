import './theme.css';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

/* UI-PRO-CLASS-START */
try {
  const root = document.documentElement;
  root.classList.remove('uiV2');
  root.classList.add('uiPro');
} catch (e) {}
/* UI-PRO-CLASS-END */


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)








