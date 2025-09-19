// src/hooks/useUserProfileData.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

// --- ١. استيراد الأنواع من مصادرها الصحيحة ---
import type { Profile } from './useProfile';
import type { Registration } from './useUserRegistrations';

// --- ٢. تعريف الأنواع الجديدة وتصديرها ---
export interface TeamInfo {
  id: string;
  name: string;
  // تم تعديل هذا الحقل ليكون اختياريًا ويتوافق مع قاعدة البيانات
  leader_title: string | null; 
  role_in_team: 'leader' | 'member';
}

export interface UserProfileData {
  profile: Profile | null;
  registrations: Registration[];
  team: TeamInfo | null;
  eventHours: number;
  extraHours: number;
}

// --- ٣. تعديل الدالة لإخبار TypeScript بنوع البيانات العائدة ---
const fetchUserProfileData = async (userId: string): Promise<UserProfileData | null> => {
    const { data, error } = await supabase
        .rpc('get_user_profile_data', { p_user_id: userId });

    if (error) {
        console.error("Error fetching user profile data:", error);
        throw new Error(error.message);
    }
    // "نؤكد" لـ TypeScript أن هذه البيانات هي من نوع UserProfileData
    return data as UserProfileData | null;
};

/**
 * Hook واحد فائق السرعة لجلب كل بيانات صفحة الملف الشخصي في طلب واحد
 */
export const useUserProfileData = () => {
  const { user } = useAuth();
  
  return useQuery<UserProfileData | null, Error>({
      queryKey: ['userProfileData', user?.id],
      queryFn: () => {
          if (!user?.id) return null; // إذا لم يكن هناك مستخدم، لا تقم بالطلب
          return fetchUserProfileData(user.id);
      },
      enabled: !!user, // لا يعمل الـ Hook إلا إذا كان هناك مستخدم
      staleTime: 5 * 60 * 1000, // 5 دقائق
  });
};