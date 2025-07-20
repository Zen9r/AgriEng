// lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ٢. تمرير النوع الجديد هنا
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
