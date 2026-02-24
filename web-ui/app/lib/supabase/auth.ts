import { supabase } from './client'

export type User = {
  id: string
  email?: string
  [key: string]: any
} | null

// Sign up a user with email/password
export async function signUp(email: string, password: string): Promise<{ user: User; session: any; error: any }> {
  try {
    const s: any = supabase
    const res = typeof s?.auth?.signUp === 'function' ? await s.auth.signUp({ email, password }) : null
    if (!res) {
      return { user: null, session: null, error: { message: 'Supabase not configured' } }
    }
    const user = res.user ?? res.data?.user ?? null
    const session = res.session ?? res.data?.session ?? null
    const error = res.error ?? null
    return { user, session, error }
  } catch (e) {
    return { user: null, session: null, error: e }
  }
}

// Sign in with email/password
export async function signIn(email: string, password: string): Promise<{ user: User; session: any; error: any }> {
  try {
    const s: any = supabase
    const res = typeof s?.auth?.signIn === 'function' ? await s.auth.signIn({ email, password }) : null
    if (!res) {
      return { user: null, session: null, error: { message: 'Supabase not configured' } }
    }
    const user = res.user ?? res.data?.user ?? null
    const session = res.session ?? res.data?.session ?? null
    const error = res.error ?? null
    return { user, session, error }
  } catch (e) {
    return { user: null, session: null, error: e }
  }
}

// Sign out current user
export async function signOut(): Promise<{ error: any }> {
  try {
    const s: any = supabase
    const res = typeof s?.auth?.signOut === 'function' ? await s.auth.signOut() : null
    if (!res) {
      return { error: { message: 'Supabase not configured' } }
    }
    return { error: res.error ?? null }
  } catch (e) {
    return { error: e }
  }
}

// Get current user
export async function getUser(): Promise<User> {
  try {
    const s: any = supabase
    if (typeof s?.auth?.getUser === 'function') {
      const res = await s.auth.getUser()
      return res?.data?.user ?? null
    }
    if (typeof s?.auth?.user === 'function') {
      return s.auth.user()
    }
    return null
  } catch {
    return null
  }
}
