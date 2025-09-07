export interface Inspiration {
  id: string;
  title: string;
  content: string;
  summary?: string;
  categories: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title?: string;
  messages: ChatMessage[];
  inspiration_id?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export type InspirationCategory = 'work' | 'life' | 'creation' | 'learning';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface SupabaseClient {
  from: (table: string) => any;
  auth: {
    getUser: () => Promise<{ data: { user: User | null }; error: any }>;
  };
}

export interface BatchOperationResult {
  id: string;
  success: boolean;
  error?: string;
  categories?: string[];
  tags?: string[];
}