// app/api/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password, userData } = body;

    let result;

    switch (action) {
      case 'signUp':
        result = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: userData
          }
        });
        break;

      case 'signIn':
        result = await supabase.auth.signInWithPassword({
          email,
          password
        });
        break;

      case 'signOut':
        result = await supabase.auth.signOut();
        break;

      case 'getUser':
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }
        const token = authHeader.substring(7);
        result = await supabase.auth.getUser(token);
        break;

      case 'resetPassword':
        result = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json({ data: result.data, error: null });

  } catch (error: any) {
    console.error('Auth API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
