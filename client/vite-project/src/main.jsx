import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Apply persisted theme before React renders to avoid flash
const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
if (typeof window !== 'undefined') {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const effective = savedTheme === 'dark' || savedTheme === 'light'
    ? savedTheme
    : prefersDark ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', effective)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
