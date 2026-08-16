import { createClient } from '@supabase/supabase-js'

const ACTIVE_SUPABASE_URL = 'https://cnisrikrxwcnsjeuogwr.supabase.co'
const ACTIVE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuaXNyaWtyeHdjbnNqZXVvZ3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3ODczOTMsImV4cCI6MjEwMjM2MzM5M30.UqJQIwxydzeywKd5sIiMrSfzWuWOzH1VvQOsdkxzvrk'

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || ACTIVE_SUPABASE_URL
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ACTIVE_SUPABASE_ANON_KEY

// If hosting platform (e.g. Vercel) still has the old/mismatched project URL, enforce the active project where Google Auth and DB are configured
if (!supabaseUrl || !supabaseUrl.includes('cnisrikrxwcnsjeuogwr')) {
  supabaseUrl = ACTIVE_SUPABASE_URL
  supabaseAnonKey = ACTIVE_SUPABASE_ANON_KEY
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
