// src/hooks/useEvents.ts
import { useQuery } from '@tanstack/react-query';
import { proxyClient } from '@/lib/supabaseClient';

// This interface matches the database schema with all fields
export interface Event {
  id: number;
  created_at: string;
  title: string;
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
  report_id: string | null;
  registered_attendees: number;
}


/**
 * Fetches all upcoming events from the database.
 */
const fetchEvents = async (): Promise<Event[]> => {
  try {
    // Fetch all events with all fields
    const { data: eventsData, error: eventsError } = await proxyClient
      .from('events')
      .select('*')
      .order('start_time', { ascending: true });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      throw new Error(eventsError.message);
    }

    if (!eventsData || eventsData.length === 0) {
      return [];
    }

    // Fetch registration counts for all events in one query
    const eventIds = eventsData.map(e => e.id);
    const { data: registrationsData, error: regError } = await proxyClient
      .from('event_registrations')
      .select('event_id')
      .in('event_id', eventIds);

    if (regError) {
      console.error('Error fetching registrations:', regError);
    }

    // Count registrations per event
    const registrationCounts = new Map<number, number>();
    (registrationsData || []).forEach((reg: any) => {
      const count = registrationCounts.get(reg.event_id) || 0;
      registrationCounts.set(reg.event_id, count + 1);
    });

    // Combine events with their registration counts
    const events = eventsData.map(event => ({
      ...event,
      registered_attendees: registrationCounts.get(event.id) || 0
    }));

    return events as Event[];
  } catch (error: any) {
    console.error('Error fetching events:', error);
    throw new Error(error.message || 'Failed to fetch events');
  }
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
