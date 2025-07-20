// src/hooks/useEvents.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

// واجهة البيانات يجب أن تطابق تمامًا ما تعيده الدالة
export interface Event {
  id: number;
  created_at: string;
  title: string | null;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string | null;
  image_url: string | null;
  team_id: string | null;
  registered_attendees: number;

  // --- الحقول التي تم تصحيحها ---
  check_in_cod: string | null; // كان check_in_code
  category: string | null;
  details: string | null;
  organizer_wh: string | null;     // كان organizer_whatsapp_link
  max_attendee: number | null;     // كان max_attendees
}

/**
 * دالة واحدة تستدعي دالة قاعدة البيانات لجلب كل شيء مرة واحدة
 */
const fetchEvents = async (): Promise<Event[]> => {
  const { data, error } = await supabase
    .rpc('get_events_with_attendee_count');

  if (error) {
    console.error('Error fetching events with counts:', error);
    throw new Error(error.message);
  }

  // نقوم بالتحويل إلى number إذا لزم الأمر للتعامل مع bigint
  return (data as any[] || []).map(event => ({
    ...event,
    id: Number(event.id),
    registered_attendees: Number(event.registered_attendees),
  }));
};

/**
 * Hook مخصص لجلب الفعاليات باستخدام React Query
 */
export const useEvents = () => {
  return useQuery<Event[], Error>({
    queryKey: ['events'],
    queryFn: fetchEvents,
    staleTime: 5 * 60 * 1000, // البيانات تعتبر "حديثة" لمدة 5 دقائق
  });
};