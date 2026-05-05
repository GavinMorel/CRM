import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
//
// IMPORTANT: `base` must match your GitHub repo name exactly.
// If your repo is at github.com/yourusername/agent-crm, leave this as '/agent-crm/'.
// If you renamed the repo, change it here to match (keep the leading and trailing slashes).
export default defineConfig({
  plugins: [react()],
  base: '/agent-crm/',
  server: {
    host: true, // allow access from your phone on the same Wi-Fi
    port: 5173,
  },
})
