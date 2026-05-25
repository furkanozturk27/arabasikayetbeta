import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { formatDate, formatKm, getSeverityLabel } from '@/lib/utils';

const CATEGORY_LABELS: Record<string, string> = {
  engine: 'Motor', transmission: 'Şanzıman', brakes: 'Frenler',
  suspension: 'Süspansiyon', electrical: 'Elektrik', ac_heating: 'Klima/Isıtma',
  fuel_system: 'Yakıt', exhaust: 'Egzoz', body_paint: 'Kaporta/Boya',
  interior: 'İç Mekan', safety_systems: 'Güvenlik', steering: 'Direksiyon',
  tires_wheels: 'Lastik/Jant', other: 'Diğer',
};

const VERDICT_PILL: Record<string, { label: string; cls: string }> = {
  chronic:    { label: '🚨 Kronik',   cls: 'pill pill-chronic'   },
  common:     { label: '⚠️ Yaygın',   cls: 'pill pill-recurring' },
  isolated:   { label: '🔍 İzole',    cls: 'pill pill-info'      },
  user_error: { label: '💡 Kullanım', cls: 'pill pill-neutral'   },
};

const SEVERITY_PILL: Record<number, string> = {
  1: 'pill pill-resolved',
  2: 'pill pill-resolved',
  3: 'pill pill-recurring',
  4: 'pill pill-chronic',
  5: 'pill pill-chronic',
};

export default async function SikayetlerPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    chronic?: string;
    brand?: string;
    model?: string;
    vehicleId?: string;
  }>;
}) {
  const filters = await searchParams;
  const supabase = await createClient();

  const selectString = (filters.brand || filters.model)
    ? `*, vehicles!inner(brand, model, year, engine), ai_analyses(verdict, summary)`
    : `*, vehicles(brand, model, year, engine), ai_analyses(verdict, summary)`;

  let query = supabase
    .from('complaints')
    .select(selectString, { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(30);

  if (filters.category) query = query.eq('category', filters.category);
  if (filters.chronic === '1') query = query.eq('is_chronic', true);
  if (filters.vehicleId) query = query.eq('vehicle_id', filters.vehicleId);
  if (filters.brand) query = query.eq('vehicles.brand', filters.brand);
  if (filters.model) query = query.eq('vehicles.model', filters.model);

  const { data: complaints, count } = await query;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 32, color: 'var(--text-1)', marginBottom: 8 }}>
            Şikayetler
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>
            {count ?? 0} şikayet bulundu
          </p>
          {(filters.brand || filters.model || filters.vehicleId) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500, fontFamily: 'DM Sans, sans-serif' }}>
                Filtre: {filters.brand ? `${filters.brand} ${filters.model || ''}` : 'Seçili Araç'}
              </span>
              <Link href="/sikayetler" style={{ fontSize: 12, color: 'var(--text-3)', textDecoration: 'underline' }}>
                Temizle
              </Link>
            </div>
          )}
        </div>
        <Link href="/sikayet-bildir" className="btn btn-primary">
          <AlertTriangle size={15} />
          Şikayet Bildir
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
        {[
          { label: 'Tümü', href: '/sikayetler', active: !filters.category && !filters.chronic },
          { label: '🚨 Kronik', href: '/sikayetler?chronic=1', active: filters.chronic === '1' },
          ...Object.entries(CATEGORY_LABELS).map(([k, v]) => ({
            label: v,
            href: `/sikayetler?category=${k}`,
            active: filters.category === k,
          })),
        ].map(f => (
          <Link key={f.href} href={f.href} style={{
            padding: '5px 14px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: f.active ? 500 : 400,
            color: f.active ? 'var(--accent)' : 'var(--text-2)',
            background: f.active ? 'var(--accent-light)' : 'transparent',
            border: `1px solid ${f.active ? 'var(--accent)' : 'var(--border)'}`,
            textDecoration: 'none',
            transition: 'all var(--ease)',
            fontFamily: 'DM Sans, sans-serif',
          }}>
            {f.label}
          </Link>
        ))}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {complaints?.map((c: any) => {
          const v = c.vehicles;
          const ai = c.ai_analyses?.[0];
          const vp = ai ? VERDICT_PILL[ai.verdict] : null;
          return (
            <Link key={c.id} href={`/sikayetler/${c.id}`} className="card card-hover" style={{ textDecoration: 'none', padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Meta row */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', fontFamily: 'DM Sans, sans-serif' }}>
                      {v?.brand} {v?.model} · {v?.year}
                    </span>
                    <span className="pill pill-neutral">{CATEGORY_LABELS[c.category]}</span>
                    {c.is_chronic && <span className="pill pill-chronic">Kronik</span>}
                    {vp && !c.is_chronic && <span className={vp.cls}>{vp.label}</span>}
                  </div>

                  {/* Symptoms */}
                  <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 8, fontFamily: 'DM Sans, sans-serif' }}>
                    {c.symptoms?.join(', ')}
                  </p>

                  {/* AI summary */}
                  {ai?.summary && (
                    <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 8, fontFamily: 'DM Sans, sans-serif', fontStyle: 'italic' }}>
                      {ai.summary}
                    </p>
                  )}

                  {/* Footer meta */}
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-3)', fontFamily: 'DM Mono, monospace' }}>
                    <span>{formatKm(c.km_at_complaint)}</span>
                    <span>{formatDate(c.created_at)}</span>
                    <span className={SEVERITY_PILL[c.severity]}>{getSeverityLabel(c.severity)}</span>
                  </div>
                </div>
                <ArrowRight size={16} style={{ color: 'var(--text-3)', flexShrink: 0, marginTop: 4 }} />
              </div>
            </Link>
          );
        })}

        {/* Empty state */}
        {(!complaints || complaints.length === 0) && (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <AlertTriangle size={36} style={{ color: 'var(--text-3)', margin: '0 auto 16px' }} />
            <p style={{ fontSize: 16, color: 'var(--text-2)', fontFamily: 'DM Sans, sans-serif', marginBottom: 8 }}>
              Bu filtreye ait şikayet henüz yok
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif' }}>
              İlk şikayeti bildiren sen olabilirsin.
            </p>
            <Link href="/sikayet-bildir" className="btn btn-primary" style={{ marginTop: 24 }}>
              Şikayet Bildir
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
