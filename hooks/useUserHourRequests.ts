'use client';

import { useQuery } from '@tanstack/react-query';
import { proxyClient } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export interface UserHourRequest {
  id: string;
  activity_title: string;
  task_description: string;
  task_type: string;
  image_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  awarded_hours: number | null;
  created_at: string;
  reviewed_by: string | null;
}

export function useUserHourRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userHourRequests', user?.id],
    queryFn: async (): Promise<UserHourRequest[]> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      try {
        const { data, error } = await proxyClient
          .from('extra_hours_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(`Failed to fetch hour requests: ${error.message}`);
        }

        return data || [];
      } catch (error: any) {
        console.error('Error fetching user hour requests:', error);
        throw new Error(error.message || 'Failed to fetch hour requests');
      }
    },
    enabled: !!user,
  });
}
