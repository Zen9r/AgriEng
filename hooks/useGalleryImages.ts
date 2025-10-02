// src/hooks/useGalleryImages.ts
import { useQuery } from '@tanstack/react-query';
import { proxyClient } from '@/lib/supabaseClient';

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
  try {
    const { data, error } = await proxyClient
      .from('gallery_images')
      .select('*');

    if (error) {
      console.error('Error fetching gallery images:', error);
      throw new Error(error.message);
    }

    // Sort the data manually since order method might not work with proxy
    const sortedData = (data || []).sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return sortedData;
  } catch (error: any) {
    console.error('Error fetching gallery images:', error);
    throw new Error(error.message || 'Failed to fetch gallery images');
  }
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
