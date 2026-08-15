import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Custom plugin to remove crossorigin attribute from script tags for Electron file:// compatibility
const removeCrossOrigin = () => ({
  name: 'remove-crossorigin',
  transformIndexHtml(html) {
    return html.replace(/\s+crossorigin(="")?/g, '');
  }
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  },
  plugins: [react(), removeCrossOrigin()],
  base: './', // important for electron
  server: {
    host: true,
    allowedHosts: true,
  },
  }
})
