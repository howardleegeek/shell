import { supabase } from './client'
import { getUser } from './auth'

export type Project = {
  id: string
  user_id?: string
  name: string
  chain: string
  description?: string
  files?: any
  is_public?: boolean
  created_at?: string
  updated_at?: string
  [key: string]: any
}

async function getCurrentUser(): Promise<any> {
  const user = await getUser()
  return user
}

export async function createProject(input: {
  name: string
  chain: string
  description?: string
  files?: any
  is_public?: boolean
}): Promise<{ data?: any; error?: any }> {
  if (!supabase || !supabase.from) {
    return { data: null, error: { message: 'Supabase not configured' } }
  }
  const user = await getCurrentUser()
  const userId = user?.id ?? null
  const now = new Date().toISOString()
  const project: Project = {
    id: crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
    user_id: userId,
    name: input.name,
    chain: input.chain,
    description: input.description ?? '',
    files: JSON.stringify(input.files ?? {}),
    is_public: input.is_public ?? false,
    created_at: now,
    updated_at: now,
  }

  const { data, error } = await (supabase as any).from('projects').insert([project])
  return { data, error }
}

export async function getProjects(): Promise<{ data?: any; error?: any }> {
  if (!supabase || !supabase.from) {
    return { data: null, error: { message: 'Supabase not configured' } }
  }
  const user = await getCurrentUser()
  const userId = user?.id ?? null
  const query = (supabase as any).from('projects').select('*')
  if (userId) {
    // This presumes a user_id column exists
    const res = await query.eq('user_id', userId)
    return { data: res.data, error: res.error }
  }
  const res = await query
  return { data: res.data, error: res.error }
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<{ data?: any; error?: any }> {
  if (!supabase || !supabase.from) {
    return { data: null, error: { message: 'Supabase not configured' } }
  }
  const now = new Date().toISOString()
  const payload = { ...updates, updated_at: now }
  const res = await (supabase as any).from('projects').update(payload).eq('id', id)
  return { data: res.data, error: res.error }
}

export async function deleteProject(id: string): Promise<{ data?: any; error?: any }> {
  if (!supabase || !supabase.from) {
    return { data: null, error: { message: 'Supabase not configured' } }
  }
  const res = await (supabase as any).from('projects').delete().eq('id', id)
  return { data: res.data, error: res.error }
}
