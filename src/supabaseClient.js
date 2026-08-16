import { createClient } from '@supabase/supabase-js'

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cnisrikrxwcnsjeuogwr.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuaXNyaWtyeHdjbnNqZXVvZ3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3ODczOTMsImV4cCI6MjEwMjM2MzM5M30.UqJQIwxydzeywKd5sIiMrSfzWuWOzH1VvQOsdkxzvrk'

// Auto-correct any typo if hosting platform (e.g. Vercel) still has the old cnns URL in environment variables
if (typeof supabaseUrl === 'string' && supabaseUrl.includes('cnnsjeuogwr')) {
  supabaseUrl = supabaseUrl.replace('cnnsjeuogwr', 'cnsjeuogwr')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
