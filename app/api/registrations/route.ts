// app/api/registrations/route.ts
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
    const userId = searchParams.get('user_id');
    const eventId = searchParams.get('event_id');
    const userToken = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!userToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(userToken);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    let query = supabaseAdmin.from('event_registrations').select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data, error: null });

  } catch (error: any) {
    console.error('Registrations API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, role, userToken } = body;

    if (!userToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(userToken);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is already registered
    const { data: existingRegistration } = await supabaseAdmin
      .from('event_registrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .maybeSingle();

    if (existingRegistration) {
      return NextResponse.json({ error: 'User already registered for this event' }, { status: 400 });
    }

    // Check event capacity
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('max_attendees, registered_attendees')
      .eq('id', eventId)
      .single();

    if (event?.max_attendees && (event.registered_attendees || 0) >= event.max_attendees) {
      return NextResponse.json({ error: 'Event is full' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('event_registrations')
      .insert({
        user_id: user.id,
        event_id: eventId,
        status: 'registered',
        role: role || 'attendee'
      })
      .select()
      .single();

    if (error) throw error;

    // Update event attendee count
    await supabaseAdmin
      .from('events')
      .update({
        registered_attendees: (event?.registered_attendees || 0) + 1
      })
      .eq('id', eventId);

    return NextResponse.json({ data, error: null });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, status, userToken } = body;

    if (!userToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(userToken);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('event_registrations')
      .update({ status })
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data, error: null });

  } catch (error: any) {
    console.error('Update registration error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
