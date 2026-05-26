import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatDate, formatKm, getSeverityLabel } from '@/lib/utils';
import { Car, Gauge, Calendar, User, ArrowLeft, AlertTriangle, TrendingUp, Info, CheckCircle } from 'lucide-react';
import { AiAnalysisCard } from '@/components/AiAnalysisCard';

const VERDICT_CONFIG = {
  chronic:    { label: 'Kronik Sorun',    cls: 'pill pill-chronic',   border: 'var(--chronic)',   bg: '#FDF7F6' },
  common:     { label: 'Yaygın Sorun',    cls: 'pill pill-recurring', border: 'var(--recurring)', bg: '#FFFBF0' },
  isolated:   { label: 'İzole Vaka',      cls: 'pill pill-info',      border: 'var(--info)',      bg: '#F0F5FF' },
  user_error: { label: 'Kullanım Hatası', cls: 'pill pill-neutral',   border: 'var(--border)',    bg: 'var(--bg-2)' },
};

const CATEGORY_LABELS: Record<string, string> = {
  engine: 'Motor', transmission: 'Şanzıman', brakes: 'Frenler',
  suspension: 'Süspansiyon', electrical: 'Elektrik', ac_heating: 'Klima/Isıtma',
  fuel_system: 'Yakıt', exhaust: 'Egzoz', body_paint: 'Kaporta/Boya',
  interior: 'İç Mekan', safety_systems: 'Güvenlik', steering: 'Direksiyon',
  tires_wheels: 'Lastik/Jant', other: 'Diğer',
};

export default async function ComplaintDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { id } = await params;
  const { new: isNew } = await searchParams;
  const supabase = await createClient();

  const { data: complaint } = await supabase
    .from('complaints')
    .select(`*, vehicles(*), users(full_name, trust_score), ai_analyses(*)`)
    .eq('id', id)
    .single();

  if (!complaint) notFound();

  const vehicle = (complaint as any).vehicles;
  const user    = (complaint as any).users;
  const analysis = (complaint as any).ai_analyses?.[0];
  const vc = analysis ? VERDICT_CONFIG[analysis.verdict as keyof typeof VERDICT_CONFIG] : null;
  const similarCount = analysis?.similar_complaint_ids?.length ?? 0;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Back */}
      <Link href="/sikayetler" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-3)', textDecoration: 'none', marginBottom: 24, fontFamily: 'DM Sans, sans-serif' }}>
        <ArrowLeft size={14} /> Şikayetlere Dön
      </Link>

      {/* New submission banner */}
      {isNew && (
        <div style={{
          padding: '12px 16px', borderRadius: 10, marginBottom: 24,
          background: '#F0FDF4', border: '1px solid #86EFAC',
          fontSize: 14, color: 'var(--resolved)', fontFamily: 'DM Sans, sans-serif',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <CheckCircle size={16} style={{ flexShrink: 0 }} />
          Şikayetiniz başarıyla kaydedildi.
        </div>
      )}

      {/* Vehicle badge — brief: araç bilgisi üstte belirgin */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 14px', borderRadius: 8,
        background: 'var(--bg-2)', border: '1px solid var(--border)',
        marginBottom: 16,
      }}>
        <Car size={15} style={{ color: 'var(--text-3)' }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', fontFamily: 'DM Mono, monospace' }}>
          {vehicle?.brand} · {vehicle?.model} · {vehicle?.year} · {vehicle?.engine}
        </span>
      </div>

      {/* Title */}
      <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 28, color: 'var(--text-1)', marginBottom: 12 }}>
        {CATEGORY_LABELS[complaint.category]} Arızası
      </h1>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
        {complaint.is_chronic && <span className="pill pill-chronic">Kronik</span>}
        {complaint.is_recurring && <span className="pill pill-recurring">Tekrarlayan</span>}
        <span className="pill pill-neutral">{getSeverityLabel(complaint.severity)} ({complaint.severity}/5)</span>
      </div>

      {/* ====== AI Analysis ====== */}
      <AiAnalysisCard complaintId={complaint.id} initialAnalysis={analysis} />

      {/* Details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Meta */}
        <div className="card">
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Şikayet Detayları
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: Gauge,    label: 'Km',      value: formatKm(complaint.km_at_complaint) },
              { icon: Calendar, label: 'Tarih',   value: formatDate(complaint.created_at) },
              { icon: User,     label: 'Kullanıcı', value: user?.full_name || 'Anonim' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
                <item.icon size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-3)' }}>{item.label}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--text-1)', fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
            {/* Brief: şikayet sahibinin güven skoru */}
            {user?.trust_score !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
                <span style={{ color: 'var(--text-3)' }}>Güven puanı</span>
                <span style={{ marginLeft: 'auto', fontFamily: 'DM Mono, monospace', fontSize: 12, fontWeight: 500, color: 'var(--accent)' }}>{user.trust_score} / 200</span>
              </div>
            )}
          </div>
        </div>

        {/* Symptoms */}
        <div className="card">
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Semptomlar
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {complaint.symptoms.map((s: string) => (
              <span key={s} className="pill pill-neutral">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      {complaint.description && (
        <div className="card" style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            Kullanıcı Açıklaması
          </p>
          <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.7, fontFamily: 'DM Sans, sans-serif' }}>
            {complaint.description}
          </p>
        </div>
      )}

      {/* Brief: benzer şikayetlere link */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif' }}>
          Bu araçtaki diğer şikayetler
        </span>
        <Link href={`/sikayetler?vehicleId=${complaint.vehicle_id}`} className="btn btn-secondary btn-sm">
          Benzer Şikayetler
        </Link>
      </div>
    </div>
  );
}
