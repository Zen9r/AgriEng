// lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client for authentication only
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Proxy API client for database operations
class ProxyClient {
  private baseUrl = '/api';

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth methods
  async signUp(email: string, password: string, userData?: any) {
    return this.request('/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'signUp', email, password, userData }),
    });
  }

  async signIn(email: string, password: string) {
    return this.request('/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'signIn', email, password }),
    });
  }

  async signOut() {
    return this.request('/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'signOut' }),
    });
  }

  async getUser() {
    return this.request('/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'getUser' }),
    });
  }

  async resetPassword(email: string) {
    return this.request('/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'resetPassword', email }),
    });
  }

  // Database methods
  async from(table: string) {
    return {
      select: (columns?: string) => this.select(table, columns),
      insert: (data: any) => this.insert(table, data),
      update: (data: any) => this.update(table, data),
      delete: () => this.delete(table),
      eq: (column: string, value: any) => this.eq(table, column, value),
      single: () => this.single(table),
      order: (column: string, options?: { ascending?: boolean }) => this.order(table, column, options),
      limit: (count: number) => this.limit(table, count),
      range: (from: number, to: number) => this.range(table, from, to),
    };
  }

  private async select(table: string, columns?: string) {
    return this.request('/proxy', {
      method: 'POST',
      body: JSON.stringify({ 
        action: 'select', 
        table, 
        select: columns 
      }),
    });
  }

  private async insert(table: string, data: any) {
    return this.request('/proxy', {
      method: 'POST',
      body: JSON.stringify({ 
        action: 'insert', 
        table, 
        data 
      }),
    });
  }

  private async update(table: string, data: any) {
    return this.request('/proxy', {
      method: 'POST',
      body: JSON.stringify({ 
        action: 'update', 
        table, 
        data 
      }),
    });
  }

  private async delete(table: string) {
    return this.request('/proxy', {
      method: 'POST',
      body: JSON.stringify({ 
        action: 'delete', 
        table 
      }),
    });
  }

  private async eq(table: string, column: string, value: any) {
    return this.request('/proxy', {
      method: 'POST',
      body: JSON.stringify({ 
        action: 'select', 
        table, 
        filters: { [column]: value }
      }),
    });
  }

  private async single(table: string) {
    return this.request('/proxy', {
      method: 'POST',
      body: JSON.stringify({ 
        action: 'select', 
        table 
      }),
    });
  }

  private async order(table: string, column: string, options?: { ascending?: boolean }) {
    return this.request('/proxy', {
      method: 'POST',
      body: JSON.stringify({ 
        action: 'select', 
        table, 
        order: { [column]: options?.ascending ? 'asc' : 'desc' }
      }),
    });
  }

  private async limit(table: string, count: number) {
    return this.request('/proxy', {
      method: 'POST',
      body: JSON.stringify({ 
        action: 'select', 
        table, 
        limit: count
      }),
    });
  }

  private async range(table: string, from: number, to: number) {
    return this.request('/proxy', {
      method: 'POST',
      body: JSON.stringify({ 
        action: 'select', 
        table, 
        limit: to - from + 1,
        offset: from
      }),
    });
  }

  // RPC methods
  async rpc(functionName: string, params?: any) {
    return this.request('/proxy', {
      method: 'POST',
      body: JSON.stringify({ 
        action: 'rpc', 
        data: { 
          function_name: functionName, 
          params 
        }
      }),
    });
  }

  // Storage methods
  storage = {
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', bucket);
        formData.append('path', path);

        const token = (await supabase.auth.getSession()).data.session?.access_token;
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        return response.json();
      },
      getPublicUrl: (path: string) => ({
        data: { publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}` }
      })
    })
  };
}

// Export both the original client for auth and the proxy client for database operations
export { supabase };
export const proxyClient = new ProxyClient();
