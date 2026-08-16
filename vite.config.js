import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import url from 'url'
import path from 'path'
import fs from 'fs'

// Custom plugin to remove crossorigin attribute from script tags for Electron file:// compatibility
const removeCrossOrigin = () => ({
  name: 'remove-crossorigin',
  transformIndexHtml(html) {
    return html.replace(/\s+crossorigin(="")?/g, '')
  }
})

// Dev server middleware to serve /api/* routes locally
const apiMiddlewarePlugin = () => ({
  name: 'api-server-middleware',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const parsedUrl = url.parse(req.url, true)
      if (!parsedUrl.pathname || !parsedUrl.pathname.startsWith('/api/')) {
        return next()
      }

      const apiRoute = parsedUrl.pathname.replace(/^\/api\//, '').split('?')[0]
      let filePath = path.resolve(__dirname, 'api', `${apiRoute}.js`)
      
      if (!fs.existsSync(filePath)) {
        filePath = path.resolve(__dirname, 'api', `${apiRoute}/index.js`)
      }

      if (!fs.existsSync(filePath)) {
        return next()
      }

      let bodyData = ''
      req.on('data', chunk => {
        bodyData += chunk
      })

      req.on('end', async () => {
        try {
          if (bodyData) {
            try {
              req.body = JSON.parse(bodyData)
            } catch {
              req.body = bodyData
            }
          } else {
            req.body = {}
          }

          res.status = (code) => {
            res.statusCode = code
            return res
          }
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
            return res
          }
          res.send = (data) => {
            res.end(data)
            return res
          }

          const module = await server.ssrLoadModule(filePath)
          const handler = module.default || module
          if (typeof handler === 'function') {
            await handler(req, res)
          } else {
            res.status(500).json({ error: 'Handler is not a function' })
          }
        } catch (err) {
          console.error('API Error:', err)
          if (!res.writableEnded) {
            res.status(500).json({ error: err.message || 'Internal Server Error' })
          }
        }
      })
    })
  }
})

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
      'import.meta.env.VITE_RAZORPAY_KEY_ID': JSON.stringify(env.VITE_RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID || ''),
    },
    plugins: [react(), removeCrossOrigin(), apiMiddlewarePlugin()],
    base: './', // important for electron
    server: {
      host: true,
      allowedHosts: true,
    },
  }
})
