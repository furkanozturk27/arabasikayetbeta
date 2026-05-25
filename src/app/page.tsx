'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { AlertTriangle, Search, ArrowRight, CheckCircle, Brain, TrendingUp } from 'lucide-react';

/* ---- Animated counter ---- */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const start = performance.now();
    const duration = 800;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * to));
      if (p < 1) requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { requestAnimationFrame(tick); observer.disconnect(); }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to]);
  return <span ref={ref}>{val.toLocaleString('tr-TR')}{suffix}</span>;
}

/* ---- AI loading steps ---- */
const AI_STEPS = ['Taranıyor…', 'Analiz ediliyor…', 'Tamamlanıyor…'];

const CATEGORIES = [
  { key: 'engine',       label: 'Motor',            emoji: '🔧', count: 12 },
  { key: 'transmission', label: 'Şanzıman',         emoji: '⚙️', count: 8  },
  { key: 'brakes',       label: 'Frenler',          emoji: '🛑', count: 6  },
  { key: 'electrical',   label: 'Elektrik',         emoji: '⚡', count: 9  },
  { key: 'suspension',   label: 'Süspansiyon',      emoji: '🏎️', count: 4  },
  { key: 'ac_heating',   label: 'Klima',            emoji: '❄️', count: 5  },
];

const RECENT_COMPLAINTS = [
  { id: 'demo-1', brand: 'Volkswagen', model: 'Golf', year: 2021, category: 'Şanzıman', symptom: 'Vites geçmiyor, sertleşme', km: 42000, verdict: 'chronic',  ago: '2 dk önce' },
  { id: 'demo-2', brand: 'Toyota',     model: 'Corolla', year: 2022, category: 'Elektrik', symptom: 'Akü sorunu, kontak problemi', km: 28500, verdict: 'common',   ago: '15 dk önce' },
  { id: 'demo-3', brand: 'Renault',    model: 'Clio', year: 2021, category: 'Motor', symptom: 'Güç kaybı, titreşim', km: 61200, verdict: 'isolated', ago: '1 sa önce' },
];

const VERDICT_PILL: Record<string, { label: string; cls: string }> = {
  chronic:  { label: 'Kronik',   cls: 'pill pill-chronic'   },
  common:   { label: 'Yaygın',   cls: 'pill pill-recurring' },
  isolated: { label: 'İzole',    cls: 'pill pill-info'      },
};

const TIMELINE_STEPS = [
  { icon: '🚗', title: 'Araç seçimi', desc: 'Kullanıcı Volkswagen Golf 2021 1.5 TSI seçti.' },
  { icon: '⚙️', title: 'Şikayet bildirimi', desc: 'DSG şanzımanda sertleşme, 42.000 km\'de başladı.' },
  { icon: '🤖', title: 'AI analizi', desc: 'Claude modeli 8 benzer vakayı inceledi.' },
  { icon: '🚨', title: 'Kronik tespiti', desc: 'Bu model için %34 kronik sorun oranı belirlendi.' },
];

export default function HomePage() {
  const [aiStep, setAiStep] = useState(0);
  const [timelineActive, setTimelineActive] = useState(-1);

  useEffect(() => {
    const t = setInterval(() => setAiStep(s => (s + 1) % AI_STEPS.length), 1600);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      setTimelineActive(i);
      i++;
      if (i >= TIMELINE_STEPS.length) clearInterval(t);
    }, 600);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-1)' }}>

      {/* =========================================================
          HERO
      ========================================================= */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 24px 56px' }}>
        <div style={{ maxWidth: 640 }}>
          <span className="pill pill-info" style={{ marginBottom: 20, display: 'inline-flex' }}>
            Beta · Türkiye&apos;nin ilk araç güvenilirlik platformu
          </span>
          <h1 className="hero-title" style={{ marginBottom: 20 }}>
            Araba almadan önce{' '}
            <em style={{ color: 'var(--accent)', fontStyle: 'normal' }}>gerçekleri öğren</em>
          </h1>
          <p style={{ fontSize: 17, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 32, maxWidth: 520 }}>
            Binlerce araç sahibinin doğrulanmış şikayetleri, Claude AI analizi ve kronik
            arıza haritası ile doğru aracı seçin.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/sikayet-bildir" className="btn btn-primary btn-lg">
              <AlertTriangle size={18} />
              Şikayet Bildir
            </Link>
            <Link href="/araclar" className="btn btn-secondary btn-lg">
              <Search size={18} />
              Araç Ara
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          STATS — gerçek sayı (beta placeholder değil)
      ========================================================= */}
      <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
          {[
            { label: 'Beta döneminde toplanan şikayet', to: 47, suffix: '' },
            { label: 'Tespit edilen kronik sorun', to: 11, suffix: '' },
            { label: 'Desteklenen araç modeli', to: 50, suffix: '+' },
          ].map((stat, i) => (
            <div key={stat.label} style={{
              textAlign: 'center',
              padding: '0 24px',
              borderRight: i < 2 ? '1px solid var(--border)' : 'none',
            }}>
              <div className="stat-number" style={{ fontFamily: 'DM Serif Display, serif', fontSize: 40, color: 'var(--text-1)', lineHeight: 1 }}>
                <Counter to={stat.to} suffix={stat.suffix} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6, fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================
          CATEGORIES
      ========================================================= */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 32 }}>
          <h2 className="section-title" style={{ fontSize: 24 }}>Kategoriye Göre Ara</h2>
          <Link href="/sikayetler" style={{ fontSize: 14, color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
            Tüm şikayetler <ArrowRight size={14} />
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {CATEGORIES.map(cat => (
            <Link
              key={cat.key}
              href={`/sikayetler?category=${cat.key}`}
              className="card card-hover"
              style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 8, padding: 16 }}
            >
              <span style={{ fontSize: 28 }}>{cat.emoji}</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)', fontFamily: 'DM Sans, sans-serif' }}>{cat.label}</span>
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif' }}>{cat.count} şikayet</span>
            </Link>
          ))}
        </div>
      </section>

      {/* =========================================================
          HOW IT WORKS — animated timeline
      ========================================================= */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 24px 0' }}>
        <h2 className="section-title" style={{ fontSize: 24, marginBottom: 8 }}>Gerçek Bir Şikayetin Yolculuğu</h2>
        <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 32 }}>VW Golf · DSG şanzıman · Kronik tespit</p>

        <div style={{ position: 'relative', paddingLeft: 40 }}>
          {/* Vertical line */}
          <div style={{ position: 'absolute', left: 15, top: 0, bottom: 0, width: 2, background: 'var(--bg-3)' }} />

          {TIMELINE_STEPS.map((step, i) => {
            const active = i <= timelineActive;
            return (
              <div key={step.title} style={{
                display: 'flex', gap: 16, marginBottom: 24, position: 'relative',
                opacity: active ? 1 : 0.3,
                transition: 'opacity 400ms ease',
              }}>
                {/* Dot */}
                <div style={{
                  position: 'absolute', left: -31,
                  width: 32, height: 32,
                  borderRadius: '50%',
                  background: active ? 'var(--accent)' : 'var(--bg-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                  transition: 'background 300ms ease',
                  zIndex: 1,
                }}>{step.icon}</div>

                {/* Content */}
                <div className="card" style={{ flex: 1, padding: '14px 16px' }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)', fontFamily: 'DM Sans, sans-serif', marginBottom: 4 }}>{step.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: 'DM Sans, sans-serif' }}>{step.desc}</div>
                  {/* AI loading animation on step 2 */}
                  {i === 2 && active && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <div className="spinner" />
                      <span style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'DM Mono, monospace', transition: 'opacity 300ms' }}>
                        {AI_STEPS[aiStep]}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================
          RECENT COMPLAINTS — canlı feed
      ========================================================= */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
          <div>
            <h2 className="section-title" style={{ fontSize: 24, marginBottom: 4 }}>Son Şikayetler</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--resolved)', display: 'inline-block' }} />
              Canlı güncelleniyor
            </div>
          </div>
          <Link href="/sikayetler" style={{ fontSize: 14, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
            Tümünü gör <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {RECENT_COMPLAINTS.map(c => {
            const vp = VERDICT_PILL[c.verdict];
            return (
              <Link key={c.id} href={`/sikayetler/${c.id}`} className="card card-hover" style={{ textDecoration: 'none', padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', fontFamily: 'DM Sans, sans-serif' }}>
                        {c.brand} {c.model} · {c.year}
                      </span>
                      <span className="pill pill-neutral">{c.category}</span>
                      {vp && <span className={vp.cls}>{vp.label}</span>}
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 8, fontFamily: 'DM Sans, sans-serif' }}>{c.symptom}</p>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'DM Mono, monospace', display: 'flex', gap: 12 }}>
                      <span>{c.km.toLocaleString('tr-TR')} km</span>
                      <span>{c.ago}</span>
                    </div>
                  </div>
                  <ArrowRight size={16} style={{ color: 'var(--text-3)', flexShrink: 0, marginTop: 2 }} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* =========================================================
          CTA BOTTOM
      ========================================================= */}
      <section style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-2)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
          <CheckCircle size={40} style={{ color: 'var(--accent)', margin: '0 auto 16px' }} />
          <h2 className="section-title" style={{ fontSize: 28, marginBottom: 12 }}>Güvenilir bilgi topluluğa katkıyla oluşur</h2>
          <p style={{ fontSize: 16, color: 'var(--text-2)', marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
            Şikayetini bildirerek hem kendin için hem de binlerce araç alıcısı için değerli veri üretirsin.
          </p>
          <Link href="/giris" className="btn btn-primary btn-lg">
            Hemen Kayıt Ol — Ücretsiz
          </Link>
        </div>
      </section>

    </div>
  );
}
