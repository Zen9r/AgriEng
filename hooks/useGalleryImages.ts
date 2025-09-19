// src/hooks/useGalleryImages.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

// واجهة البيانات لصورة المعرض
export interface GalleryImage {
  id: number;
  created_at: string;
  image_url: string | null;
  alt_text: string | null;
  category: string | null; 
}


/**
 * دالة لجلب كل صور المعرض، مرتبة حسب تاريخ الإنشاء
 */
const fetchGalleryImages = async (): Promise<GalleryImage[]> => {
  const { data, error } = await supabase
    .from('gallery_images')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching gallery images:', error);
    throw new Error(error.message);
  }

  return data || [];
};

/**
 * Hook مخصص لجلب صور المعرض باستخدام React Query
 */
export const useGalleryImages = () => {
  return useQuery<GalleryImage[], Error>({
    queryKey: ['galleryImages'], // مفتاح التخزين المؤقت
    queryFn: fetchGalleryImages,
    staleTime: 10 * 60 * 1000, // (اختياري) البيانات تعتبر "حديثة" لمدة 10 دقائق
  });
};
