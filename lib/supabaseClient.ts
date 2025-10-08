// agring/lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and/or anonymous key are missing in .env.local file. Check variable names.");
}

// دالة ذكية لتحديد الرابط الكامل للبروكسي
const getProxyUrl = () => {
  // استخدم API route في جميع البيئات
  if (typeof window !== 'undefined') {
    // في المتصفح، استخدم الرابط الحالي
    return `${window.location.origin}/api/proxy`;
  }
  
  // في الخادم (SSR)، استخدم رابط الموقع من متغيرات البيئة
  return `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/proxy`;
};

// استخدام API route كبروكسي
const proxyUrl = getProxyUrl();

// لاحظ أننا نمرر النوع <Database> كما كان في الكود الأصلي
export const supabase = createClient<Database>(proxyUrl, supabaseAnonKey!);