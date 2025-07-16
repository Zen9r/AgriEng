// src/hooks/useUserProfileData.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import type { Profile } from './useProfile'; 
import type { Registration } from './useUserRegistrations';

interface TeamInfo {
  name: string;
  leader_title: string;
  role_in_team: 'leader' | 'member';
}

interface UserProfileData {
  profile: Profile | null;
  registrations: Registration[];
  team: TeamInfo | null;
  eventHours: number;
  extraHours: number;
}

const fetchUserProfileData = async (userId: string): Promise<UserProfileData> => {
    const { data, error } = await supabase
        .rpc('get_user_profile_data', { p_user_id: userId });

    if (error) {
        console.error("Error fetching user profile data:", error);
        throw new Error(error.message);
    }
    return data;
};

/**
 * Hook واحد فائق السرعة لجلب كل بيانات صفحة الملف الشخصي في طلب واحد
 */
export const useUserProfileData = () => {
  const { user } = useAuth();
  
  return useQuery<UserProfileData, Error>({
      queryKey: ['userProfileData', user?.id],
      queryFn: () => {
          if (!user?.id) throw new Error("User not authenticated");
          // --- [FIX] Corrected function name from fetchUserProfile_data to fetchUserProfileData ---
          return fetchUserProfileData(user.id);
      },
      enabled: !!user,
      staleTime: 5 * 60 * 1000, // 5 دقائق
  });
};