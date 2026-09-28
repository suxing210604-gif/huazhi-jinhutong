import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode data-qoder-id="qel-strictmode-086be5fe" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-strictmode-086be5fe&quot;,&quot;filePath&quot;:&quot;react-vite/src/main.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;strictmode&quot;,&quot;loc&quot;:{&quot;line&quot;:7,&quot;column&quot;:3}}">
    <App  data-qoder-id="qel-app-df45d203" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-app-df45d203&quot;,&quot;filePath&quot;:&quot;react-vite/src/main.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;app&quot;,&quot;loc&quot;:{&quot;line&quot;:8,&quot;column&quot;:5}}"/>
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
