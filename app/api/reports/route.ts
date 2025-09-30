// app/api/reports/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');
    const teamId = searchParams.get('team_id');
    const userToken = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!userToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(userToken);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    let data;
    let error;

    switch (reportType) {
      case 'events':
        const eventsQuery = supabaseAdmin
          .from('events')
          .select(`
            id,
            title,
            start_time,
            end_time,
            registered_attendees,
            max_attendees,
            category,
            team_id,
            teams(name)
          `);
        
        if (teamId) {
          eventsQuery.eq('team_id', teamId);
        }
        
        const eventsResult = await eventsQuery.order('created_at', { ascending: false });
        data = eventsResult.data;
        error = eventsResult.error;
        break;

      case 'registrations':
        const registrationsQuery = supabaseAdmin
          .from('event_registrations')
          .select(`
            id,
            status,
            role,
            created_at,
            events(title, start_time),
            profiles(full_name, student_id)
          `);
        
        if (teamId) {
          registrationsQuery.eq('events.team_id', teamId);
        }
        
        const registrationsResult = await registrationsQuery.order('created_at', { ascending: false });
        data = registrationsResult.data;
        error = registrationsResult.error;
        break;

      case 'members':
        const membersQuery = supabaseAdmin
          .from('profiles')
          .select(`
            id,
            full_name,
            student_id,
            email,
            role,
            created_at,
            team_members(
              teams(name, team_type)
            )
          `);
        
        if (teamId) {
          membersQuery.eq('team_members.team_id', teamId);
        }
        
        const membersResult = await membersQuery.order('created_at', { ascending: false });
        data = membersResult.data;
        error = membersResult.error;
        break;

      case 'hours':
        const hoursQuery = supabaseAdmin
          .from('extra_hours_requests')
          .select(`
            id,
            hours,
            status,
            created_at,
            profiles(full_name, student_id),
            events(title)
          `);
        
        if (teamId) {
          hoursQuery.eq('events.team_id', teamId);
        }
        
        const hoursResult = await hoursQuery.order('created_at', { ascending: false });
        data = hoursResult.data;
        error = hoursResult.error;
        break;

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    if (error) throw error;

    return NextResponse.json({ data, error: null });

  } catch (error: any) {
    console.error('Reports API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
