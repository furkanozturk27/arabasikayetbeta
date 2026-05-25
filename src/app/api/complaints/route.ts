import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const {
    vehicleId, category, symptoms, kmAtComplaint,
    description, severity, isRecurring,
  } = body;

  // Validasyon
  if (!vehicleId || !category || !symptoms?.length || !kmAtComplaint || !severity) {
    return NextResponse.json({ error: 'Eksik alanlar var.' }, { status: 400 });
  }
  if (description && description.length < 50) {
    return NextResponse.json({ error: 'Açıklama en az 50 karakter olmalı.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('complaints')
    .insert({
      user_id: user.id,
      vehicle_id: vehicleId,
      category,
      symptoms,
      km_at_complaint: kmAtComplaint,
      description: description || null,
      severity,
      is_recurring: isRecurring || false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get('vehicleId');
  const category = searchParams.get('category');
  const page = parseInt(searchParams.get('page') || '0');
  const limit = 10;

  const supabase = await createClient();
  let query = supabase
    .from('complaints')
    .select(`
      *,
      users (full_name, trust_score),
      vehicles (brand, model, year, engine),
      ai_analyses (verdict, summary, confidence_score)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  if (vehicleId) query = query.eq('vehicle_id', vehicleId);
  if (category) query = query.eq('category', category);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ complaints: data, total: count, page, limit });
}
