import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom plugin to remove crossorigin attribute from script tags for Electron file:// compatibility
const removeCrossOrigin = () => ({
  name: 'remove-crossorigin',
  transformIndexHtml(html) {
    return html.replace(/\s+crossorigin(="")?/g, '');
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), removeCrossOrigin()],
  base: './', // important for electron
  server: {
    host: true,
    allowedHosts: true,
  },
})
