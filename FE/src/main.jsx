import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || ''

if (API_BASE) {
  axios.defaults.baseURL = API_BASE

  const originalFetch = window.fetch.bind(window)
  window.fetch = (input, init) => {
    const rawUrl = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input)

    if (/^\/(api|uploads)\//.test(rawUrl)) {
      return originalFetch(`${API_BASE}${rawUrl}`, init)
    }

    return originalFetch(input, init)
  }
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </StrictMode>
)