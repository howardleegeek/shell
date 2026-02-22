// Supabase client initialization with graceful fallback when keys are missing
import { createClient } from '@supabase/supabase-js'

type SupabaseClientLike = any

const SUPABASE_URL = typeof process !== 'undefined' ? process.env.SUPABASE_URL : undefined
const SUPABASE_ANON_KEY = typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : undefined

let _client: SupabaseClientLike

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
} else {
  // Graceful mock client when keys are not configured
  _client = {
    auth: {
      signUp: async (_payload?: any) => ({ user: null, session: null, error: { message: 'Supabase not configured' } }),
      signIn: async (_payload?: any) => ({ user: null, session: null, error: { message: 'Supabase not configured' } }),
      signOut: async () => ({ error: { message: 'Supabase not configured' } }),
      getUser: async () => ({ data: { user: null }, error: null }),
      user: () => null,
    },
    from: (_table: string) => ({
      select: async () => ({ data: null, error: null }),
      insert: async () => ({ data: null, error: null }),
      update: async () => ({ data: null, error: null }),
      delete: async () => ({ data: null, error: null }),
    }),
  }
}

export const supabase = _client as SupabaseClientLike
