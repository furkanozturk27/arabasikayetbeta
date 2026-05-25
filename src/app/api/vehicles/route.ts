import { NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { filterVehicles, STATIC_VEHICLES } from '@/lib/vehicles-static';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brand  = searchParams.get('brand')  ?? undefined;
  const model  = searchParams.get('model')  ?? undefined;
  const year   = searchParams.get('year')   ?? undefined;
  const engine = searchParams.get('engine') ?? undefined;

  // ── Fallback: serve static data when Supabase is not configured ─────────
  if (!isSupabaseConfigured()) {
    const data = filterVehicles({ brand, model, year, engine });
    return NextResponse.json(data);
  }

  // ── Live Supabase query ──────────────────────────────────────────────────
  try {
    const supabase = await createClient();
    let query = supabase
      .from('vehicles')
      .select('*')
      .order('brand')
      .order('model')
      .order('year', { ascending: false });

    if (brand)  query = query.eq('brand',  brand);
    if (model)  query = query.eq('model',  model);
    if (year)   query = query.eq('year',   Number(year));
    if (engine) query = query.eq('engine', engine);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch {
    // Supabase unreachable — fall back to static
    const data = filterVehicles({ brand, model, year, engine });
    return NextResponse.json(data);
  }
}
