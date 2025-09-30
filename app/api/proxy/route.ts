// app/api/proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../types/supabase';

// Server-side Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, table, data, filters, select, order, limit, offset } = body;

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { data: { user: userData } } = await supabaseAdmin.auth.getUser(token);
        user = userData;
      } catch (error) {
        console.error('Auth error:', error);
      }
    }

    let result;
    let query = supabaseAdmin.from(table);

    switch (action) {
      case 'select':
        if (select) query = query.select(select);
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else if (typeof value === 'object' && value !== null) {
              Object.entries(value).forEach(([op, val]) => {
                if (op === 'eq') query = query.eq(key, val);
                else if (op === 'neq') query = query.neq(key, val);
                else if (op === 'gt') query = query.gt(key, val);
                else if (op === 'gte') query = query.gte(key, val);
                else if (op === 'lt') query = query.lt(key, val);
                else if (op === 'lte') query = query.lte(key, val);
                else if (op === 'like') query = query.like(key, val);
                else if (op === 'ilike') query = query.ilike(key, val);
                else if (op === 'is') query = query.is(key, val);
                else if (op === 'in') query = query.in(key, val);
                else if (op === 'contains') query = query.contains(key, val);
                else if (op === 'containedBy') query = query.containedBy(key, val);
                else if (op === 'rangeGt') query = query.rangeGt(key, val);
                else if (op === 'rangeGte') query = query.rangeGte(key, val);
                else if (op === 'rangeLt') query = query.rangeLt(key, val);
                else if (op === 'rangeLte') query = query.rangeLte(key, val);
                else if (op === 'rangeAdjacent') query = query.rangeAdjacent(key, val);
                else if (op === 'overlaps') query = query.overlaps(key, val);
                else if (op === 'textSearch') query = query.textSearch(key, val);
                else if (op === 'match') query = query.match(val);
              });
            } else {
              query = query.eq(key, value);
            }
          });
        }
        if (order) {
          Object.entries(order).forEach(([column, direction]) => {
            query = query.order(column, { ascending: direction === 'asc' });
          });
        }
        if (limit) query = query.limit(limit);
        if (offset) query = query.range(offset, offset + (limit || 10) - 1);
        result = await query;
        break;

      case 'insert':
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        result = await query.insert(data);
        break;

      case 'update':
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        result = await query.update(data);
        break;

      case 'delete':
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        result = await query.delete();
        break;

      case 'rpc':
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { function_name, params } = data;
        result = await supabaseAdmin.rpc(function_name, params);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json({ data: result.data, error: null });

  } catch (error: any) {
    console.error('Proxy API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
