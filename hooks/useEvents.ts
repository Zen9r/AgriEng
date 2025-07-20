// src/hooks/useEvents.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

// This interface now matches the output of our new `get_all_events` function
export interface Event {
  id: number;
  created_at: string;
  title: string | null;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string | null;
  image_url: string | null;
  check_in_code: string | null;
  team_id: string | null;
  category: string | null;
  details: string | null;
  organizer_whatsapp_link: string | null;
  max_attendees: number | null;
  registered_attendees: number;
}


/**
 * Fetches all upcoming events using the new, reliable `get_all_events` database function.
 */
const fetchEvents = async (): Promise<Event[]> => {
  // 🌟 FIX: We use a type assertion `as any` to bypass the outdated function list
  // and then cast the result to ensure TypeScript knows the data shape.
  const { data, error } = await supabase
    .rpc('get_all_events' as any);

  if (error) {
    console.error('Error fetching events with get_all_events:', error);
    throw new Error(error.message);
  }

  // The data from a TABLE function is an array, so we cast it to ensure type safety.
  return (data as Event[]) || [];
};

/**
 * Custom hook to fetch events using React Query.
 */
export const useEvents = () => {
  return useQuery<Event[], Error>({
    queryKey: ['events'],
    queryFn: fetchEvents,
    staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
  });
};
