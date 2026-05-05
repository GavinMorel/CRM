import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

/**
 * Polyfill for window.storage
 *
 * The original artifact uses Anthropic's window.storage API. This shim
 * gives the same async API but reads/writes localStorage so the code
 * runs unmodified in a regular browser (and offline).
 *
 * To migrate to Supabase later, swap the bodies of these methods to
 * call your API. The component code never has to change.
 */
if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    get: async (key) => {
      try {
        const value = localStorage.getItem(key)
        return value !== null ? { value } : null
      } catch (e) {
        return null
      }
    },
    set: async (key, value) => {
      try {
        localStorage.setItem(key, String(value))
        return { value }
      } catch (e) {
        console.error('storage.set failed', e)
        return null
      }
    },
    delete: async (key) => {
      try {
        localStorage.removeItem(key)
        return { deleted: true }
      } catch (e) {
        return null
      }
    },
    list: async (prefix = '') => {
      try {
        const keys = Object.keys(localStorage).filter((k) => k.startsWith(prefix))
        return { keys }
      } catch (e) {
        return null
      }
    },
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
