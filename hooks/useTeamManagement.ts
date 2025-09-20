// src/hooks/useTeamManagement.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import type { Database } from '@/types/supabase';

// تعريف الأنواع بناءً على القاموس الذي تم توليده
type Profile = Database['public']['Tables']['profiles']['Row'];
export type PendingRequest = Database['public']['Tables']['extra_hours_requests']['Row'] & {
  profiles: Pick<Profile, 'full_name'> | null;
};

export type ArchivedRequest = Database['public']['Tables']['extra_hours_requests']['Row'] & {
  profiles: Pick<Profile, 'full_name'> | null;
};

export function useTeamManagement(teamId: string | undefined | null) {
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [archivedRequests, setArchivedRequests] = useState<ArchivedRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    
    if (!teamId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // الخطوة 1: جلب user_id لكل الأعضاء في الفريق
      const { data: membersResponse, error: membersError } = await supabase
        .from('team_members')
        .select('user_id, profiles!inner(*)')
        .eq('team_id', teamId);

      if (membersError) throw membersError;

      // نستخرج بيانات البروفايل الكاملة للأعضاء
      const members = (membersResponse || []).map(m => m.profiles).filter(Boolean) as Profile[];
      setTeamMembers(members);

      // الخطوة 2: جلب الطلبات المعلقة والمؤرشفة لهؤلاء الأعضاء
      if (members.length > 0) {
        const memberIds = members.map(m => m.id);
        
        // جلب الطلبات المعلقة
        const { data: pendingData, error: pendingError } = await supabase
          .from('extra_hours_requests')
          .select('*, profiles!user_id(full_name)')
          .in('user_id', memberIds)
          .eq('status', 'pending');

        if (pendingError) throw pendingError;
        setPendingRequests(pendingData || []);

        // جلب الطلبات المؤرشفة (موافق عليها أو مرفوضة)
        const { data: archivedData, error: archivedError } = await supabase
          .from('extra_hours_requests')
          .select('*, profiles!user_id(full_name)')
          .in('user_id', memberIds)
          .in('status', ['approved', 'rejected'])
          .order('created_at', { ascending: false });

        if (archivedError) throw archivedError;
        setArchivedRequests(archivedData || []);
      } else {
        // إذا لم يكن هناك أعضاء، لا توجد طلبات
        setPendingRequests([]);
        setArchivedRequests([]);
      }
    } catch (error) {
      toast.error("فشل تحميل بيانات الفريق.");
      console.error("Team Management Hook Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { isLoading, teamMembers, pendingRequests, archivedRequests, refreshData: fetchData };
}