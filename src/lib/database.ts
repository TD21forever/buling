import { createClient } from './supabase/client'
import { Inspiration, ChatSession, ChatMessage, InspirationCategory } from './types'

export class Database {
  private supabase = createClient()

  // Inspiration operations
  async createInspiration(data: {
    title: string
    content: string
    summary?: string
    categories?: string[]
    tags?: string[]
  }): Promise<Inspiration> {
    const { data: inspiration, error } = await this.supabase
      .from('inspirations')
      .insert({
        title: data.title,
        content: data.content,
        summary: data.summary,
        categories: data.categories || [],
        tags: data.tags || [],
      })
      .select()
      .single()

    if (error) throw error
    return inspiration
  }

  async getInspirations(): Promise<Inspiration[]> {
    const { data, error } = await this.supabase
      .from('inspirations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async updateInspiration(id: string, updates: Partial<Inspiration>): Promise<Inspiration> {
    const { data, error } = await this.supabase
      .from('inspirations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteInspiration(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('inspirations')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async deleteMultipleInspirations(ids: string[]): Promise<void> {
    const { error } = await this.supabase
      .from('inspirations')
      .delete()
      .in('id', ids)

    if (error) throw error
  }

  // Chat session operations
  async createChatSession(title?: string): Promise<ChatSession> {
    const { data, error } = await this.supabase
      .from('chat_sessions')
      .insert({ title })
      .select()
      .single()

    if (error) throw error
    return { ...data, messages: [] }
  }

  async getChatSessions(): Promise<ChatSession[]> {
    const { data, error } = await this.supabase
      .from('chat_sessions')
      .select(`
        *,
        chat_messages(*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data?.map(session => ({
      ...session,
      messages: session.chat_messages || []
    })) || []
  }

  async getChatSession(id: string): Promise<ChatSession | null> {
    const { data, error } = await this.supabase
      .from('chat_sessions')
      .select(`
        *,
        chat_messages(*)
      `)
      .eq('id', id)
      .single()

    if (error) return null
    return {
      ...data,
      messages: data.chat_messages || []
    }
  }

  async addChatMessage(sessionId: string, message: {
    role: 'user' | 'assistant'
    content: string
  }): Promise<ChatMessage> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: message.role,
        content: message.content,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateChatSession(id: string, updates: { title?: string; inspiration_id?: string }): Promise<void> {
    const { error } = await this.supabase
      .from('chat_sessions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  }

  async deleteChatSession(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('chat_sessions')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Search operations
  async searchInspirations(query: string): Promise<Inspiration[]> {
    const { data, error } = await this.supabase
      .from('inspirations')
      .select('*')
      .or(`title.ilike.%${query}%, content.ilike.%${query}%, summary.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getInspirationsByCategory(category: InspirationCategory): Promise<Inspiration[]> {
    const { data, error } = await this.supabase
      .from('inspirations')
      .select('*')
      .contains('categories', [category])
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getInspirationsByTag(tag: string): Promise<Inspiration[]> {
    const { data, error } = await this.supabase
      .from('inspirations')
      .select('*')
      .contains('tags', [tag])
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }
}

export const db = new Database()