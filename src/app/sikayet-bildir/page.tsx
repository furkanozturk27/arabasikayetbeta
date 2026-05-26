'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/appStore';
import { ChevronRight, Car, Wrench, Settings, Disc, Zap, Wind, FileText, Shield, Palette, Sofa, Target, Circle, HelpCircle } from 'lucide-react';

const CATEGORIES = [
  { value: 'engine',         label: 'Motor',               Icon: Wrench   },
  { value: 'transmission',   label: 'Şanzıman',            Icon: Settings },
  { value: 'brakes',         label: 'Frenler',             Icon: Disc     },
  { value: 'suspension',     label: 'Süspansiyon',         Icon: Car      },
  { value: 'electrical',     label: 'Elektrik Sistemi',    Icon: Zap      },
  { value: 'ac_heating',     label: 'Klima / Isıtma',      Icon: Wind     },
  { value: 'fuel_system',    label: 'Yakıt Sistemi',       Icon: FileText },
  { value: 'exhaust',        label: 'Egzoz',               Icon: Wind     },
  { value: 'body_paint',     label: 'Kaporta / Boya',      Icon: Palette  },
  { value: 'interior',       label: 'İç Mekan',            Icon: Sofa     },
  { value: 'safety_systems', label: 'Güvenlik Sistemleri', Icon: Shield   },
  { value: 'steering',       label: 'Direksiyon',          Icon: Target   },
  { value: 'tires_wheels',   label: 'Lastik / Jant',       Icon: Circle   },
  { value: 'other',          label: 'Diğer',               Icon: HelpCircle },
];

const SYMPTOMS_BY_CATEGORY: Record<string, string[]> = {
  engine: ['Titreşim', 'Güç kaybı', 'Fazla yakıt tüketimi', 'Motor uyarı lambası', 'Anormal ses', 'Aşırı ısınma', 'Yağ sızıntısı', 'Soğuk start sorunu'],
  transmission: ['Vites geçmiyor', 'Sertleşme', 'Kayma', 'Titreşim', 'Ses çıkarıyor', 'Gecikme'],
  brakes: ['Titreşim', 'Ses çıkarıyor', 'Uzun fren mesafesi', 'Çekiyor', 'Fren pedalı sertleşiyor', 'ABS arızası'],
  electrical: ['Akü sorunu', 'Alternator arızası', 'Far çalışmıyor', 'Merkezi kilit sorunu', 'Cam motoru', 'Sensör arızası'],
  suspension: ['Ses çıkarıyor', 'Sürüş konforu bozuldu', 'Çekiyor', 'Titreşim', 'Lastik düzensiz aşınıyor'],
  ac_heating: ['Soğutmuyor', 'Ses çıkarıyor', 'Kaçak', 'Kötü koku', 'Ön cam buğulanıyor'],
  fuel_system: ['Fazla tüketim', 'Sürüş kesintisi', 'Motor durması', 'Yakıt kokusu'],
  exhaust: ['Duman çıkıyor', 'Ses çıkarıyor', 'Kötü koku', 'Oksijen sensörü arızası'],
  body_paint: ['Boya dökülmesi', 'Pas', 'Hava sesi', 'Sızdırıyor'],
  interior: ['Döşeme sorunu', 'Plastik ses', 'Kapı mekanizması', 'Gösterge paneli arızası'],
  safety_systems: ['Airbag lambası', 'ESP arızası', 'Kamera sorunu', 'Park sensörü'],
  steering: ['Sertleşme', 'Ses çıkarıyor', 'Titreşim', 'Hizalama sorunu'],
  tires_wheels: ['Düzensiz aşınma', 'Titreşim', 'Lastik kaybı', 'Jant deformasyonu'],
  other: ['Diğer belirti'],
};



const STEP_LABELS = ['Araç Seç', 'Kategori', 'Detaylar', 'Gözden Geçir'];

type Step = 0 | 1 | 2 | 3;

export default function SikayetBildirPage() {
  const router = useRouter();
  const supabase = createClient();
  const { complaintStep, setComplaintStep, complaintDraft, setComplaintDraft, resetComplaintDraft } = useAppStore();

  const [vd, setVd] = useState({ brands: [] as string[], models: [] as string[], years: [] as number[], engines: [] as string[], vehicleId: null as string | null });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/vehicles').then(r => r.json()).then((data: any[]) => {
      const brands = [...new Set(data.map(v => v.brand))].sort() as string[];
      setVd(p => ({ ...p, brands }));
    });
  }, []);

  async function onBrandChange(brand: string) {
    setComplaintDraft({ brand, model: '', year: null, engine: '', vehicleId: null });
    const r = await fetch(`/api/vehicles?brand=${brand}`);
    const d = await r.json();
    setVd(p => ({ ...p, models: [...new Set(d.map((v: any) => v.model))].sort() as string[], years: [], engines: [], vehicleId: null }));
  }
  async function onModelChange(model: string) {
    setComplaintDraft({ model, year: null, engine: '', vehicleId: null });
    const r = await fetch(`/api/vehicles?brand=${complaintDraft.brand}&model=${model}`);
    const d = await r.json();
    setVd(p => ({ ...p, years: ([...new Set(d.map((v: any) => v.year as number))] as number[]).sort((a, b) => b - a), engines: [], vehicleId: null }));
  }
  async function onYearChange(year: number) {
    setComplaintDraft({ year, engine: '', vehicleId: null });
    const r = await fetch(`/api/vehicles?brand=${complaintDraft.brand}&model=${complaintDraft.model}&year=${year}`);
    const d = await r.json();
    setVd(p => ({ ...p, engines: [...new Set(d.map((v: any) => v.engine))].sort() as string[], vehicleId: null }));
  }
  async function onEngineChange(engine: string) {
    setComplaintDraft({ engine });
    const r = await fetch(`/api/vehicles?brand=${complaintDraft.brand}&model=${complaintDraft.model}&year=${complaintDraft.year}&engine=${engine}`);
    const d = await r.json();
    if (d.length > 0) { setVd(p => ({ ...p, vehicleId: d[0].id })); setComplaintDraft({ vehicleId: d[0].id }); }
  }
  function toggleSymptom(s: string) {
    const cur = complaintDraft.symptoms;
    setComplaintDraft({ symptoms: cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s] });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/giris'); return; }

    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: complaintDraft.vehicleId,
        category: complaintDraft.category,
        symptoms: complaintDraft.symptoms,
        kmAtComplaint: complaintDraft.kmAtComplaint,
        description: complaintDraft.description || null,
        severity: complaintDraft.severity,
        isRecurring: complaintDraft.isRecurring,
      }),
    });

    const complaint = await res.json();
    if (!res.ok) { setError(complaint.error || 'Bir hata oluştu.'); setSubmitting(false); return; }

    // Fire-and-forget analysis (AI feature disabled for now; kept for future re-enablement)
    fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaintId: complaint.id }),
    }).catch(() => {});

    resetComplaintDraft();
    router.push(`/sikayetler/${complaint.id}?new=1`);
  }

  /* ===== STYLES ===== */
  const s = {
    container: { maxWidth: 640, margin: '0 auto', padding: '48px 24px 80px' },
    card: { background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 28 },
    label: { fontSize: 13, fontWeight: 500, color: 'var(--text-2)', fontFamily: 'DM Sans, sans-serif', display: 'block', marginBottom: 6 } as React.CSSProperties,
  };

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 28, color: 'var(--text-1)', marginBottom: 8 }}>
          Şikayet Bildir
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif' }}>
          Araç arızanızı adım adım kaydedin ve topluluğa katkıda bulunun.
        </p>
      </div>

      {/* Step progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
        {STEP_LABELS.map((label, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600,
                background: i < complaintStep ? 'var(--accent)' : i === complaintStep ? 'var(--accent-light)' : 'var(--bg-3)',
                color: i < complaintStep ? '#fff' : i === complaintStep ? 'var(--accent)' : 'var(--text-3)',
                border: i === complaintStep ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 200ms ease',
                fontFamily: 'DM Sans, sans-serif',
              }}>
                {i < complaintStep ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 11, fontWeight: i === complaintStep ? 500 : 400, color: i === complaintStep ? 'var(--text-1)' : 'var(--text-3)', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < complaintStep ? 'var(--accent)' : 'var(--bg-3)', margin: '0 8px', marginBottom: 20, transition: 'background 200ms ease' }} />
            )}
          </div>
        ))}
      </div>

      {/* ===== STEP 0: Vehicle ===== */}
      {complaintStep === 0 && (
        <div style={s.card}>
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: 'var(--text-1)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Car size={20} style={{ color: 'var(--accent)' }} /> Aracınızı Seçin
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Marka', value: complaintDraft.brand, onChange: (v: string) => onBrandChange(v), options: vd.brands, placeholder: 'Marka seçin', disabled: false },
              { label: 'Model', value: complaintDraft.model, onChange: (v: string) => onModelChange(v), options: vd.models, placeholder: 'Önce marka seçin', disabled: !complaintDraft.brand },
              { label: 'Yıl', value: complaintDraft.year?.toString() ?? '', onChange: (v: string) => onYearChange(parseInt(v)), options: vd.years.map(y => y.toString()), placeholder: 'Yıl seçin', disabled: !complaintDraft.model },
              { label: 'Motor', value: complaintDraft.engine, onChange: (v: string) => onEngineChange(v), options: vd.engines, placeholder: 'Motor seçin', disabled: !complaintDraft.year },
            ].map(field => (
              <div key={field.label}>
                <label style={s.label}>{field.label}</label>
                <select
                  className="form-select"
                  value={field.value}
                  onChange={e => field.onChange(e.target.value)}
                  disabled={field.disabled}
                >
                  <option value="">{field.placeholder}</option>
                  {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <button
              className="btn btn-primary"
              disabled={!complaintDraft.vehicleId}
              onClick={() => setComplaintStep(1)}
              style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}
            >
              Devam Et <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 1: Category ===== */}
      {complaintStep === 1 && (
        <div style={s.card}>
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: 'var(--text-1)', marginBottom: 20 }}>
            Arıza Kategorisi
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 }}>
            {CATEGORIES.map(cat => {
              const isSelected = complaintDraft.category === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setComplaintDraft({ category: cat.value, symptoms: [] })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    background: isSelected ? 'var(--accent-light)' : '#fff',
                    transition: 'all var(--ease)', fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  <cat.Icon size={16} style={{ color: isSelected ? 'var(--accent)' : 'var(--text-3)', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: isSelected ? 500 : 400, color: isSelected ? 'var(--accent)' : 'var(--text-1)' }}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => setComplaintStep(0)}>Geri</button>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={!complaintDraft.category} onClick={() => setComplaintStep(2)}>
              Devam Et <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 2: Details ===== */}
      {complaintStep === 2 && (
        <div style={s.card}>
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: 'var(--text-1)', marginBottom: 20 }}>Detaylar</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Symptoms */}
            <div>
              <label style={s.label}>Semptomlar *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(SYMPTOMS_BY_CATEGORY[complaintDraft.category] || []).map(sym => (
                  <button
                    key={sym}
                    onClick={() => toggleSymptom(sym)}
                    style={{
                      padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                      border: `1px solid ${complaintDraft.symptoms.includes(sym) ? 'var(--accent)' : 'var(--border)'}`,
                      background: complaintDraft.symptoms.includes(sym) ? 'var(--accent-light)' : '#fff',
                      color: complaintDraft.symptoms.includes(sym) ? 'var(--accent)' : 'var(--text-2)',
                      fontFamily: 'DM Sans, sans-serif', fontWeight: complaintDraft.symptoms.includes(sym) ? 500 : 400,
                      transition: 'all var(--ease)',
                    }}
                  >{sym}</button>
                ))}
              </div>
            </div>

            {/* KM */}
            <div>
              <label style={s.label}>Km (şikayet anında) *</label>
              <input
                type="number" min={0}
                className="form-input"
                value={complaintDraft.kmAtComplaint ?? ''}
                onChange={e => setComplaintDraft({ kmAtComplaint: parseInt(e.target.value) || null })}
                placeholder="ör: 45000"
              />
            </div>

            {/* Severity */}
            <div>
              <label style={s.label}>Şiddet Derecesi</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setComplaintDraft({ severity: n })}
                    style={{
                      flex: 1, height: 40, borderRadius: 8, cursor: 'pointer',
                      fontSize: 14, fontWeight: 600,
                      border: `1px solid ${complaintDraft.severity === n ? (n >= 4 ? 'var(--chronic)' : n === 3 ? 'var(--recurring)' : 'var(--resolved)') : 'var(--border)'}`,
                      background: complaintDraft.severity === n ? (n >= 4 ? '#FDF0EE' : n === 3 ? '#FEF3C7' : '#F0FDF4') : '#fff',
                      color: complaintDraft.severity === n ? (n >= 4 ? 'var(--chronic)' : n === 3 ? 'var(--recurring)' : 'var(--resolved)') : 'var(--text-3)',
                      fontFamily: 'DM Mono, monospace', transition: 'all var(--ease)',
                    }}
                  >{n}</button>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif', marginTop: 6 }}>1 = Hafif &nbsp; 3 = Orta &nbsp; 5 = Kritik</p>
            </div>

            {/* Recurring */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox" checked={complaintDraft.isRecurring}
                onChange={e => setComplaintDraft({ isRecurring: e.target.checked })}
                style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
              />
              <span style={{ fontSize: 14, color: 'var(--text-2)', fontFamily: 'DM Sans, sans-serif' }}>
                Bu sorun tekrarlıyor / kronik
              </span>
            </label>

            {/* Description */}
            <div>
              <label style={s.label}>
                Açıklama{' '}
                <span style={{ fontWeight: 400, color: 'var(--text-3)' }}>(isteğe bağlı, min 50 karakter)</span>
              </label>
              <textarea
                className="form-textarea"
                rows={4}
                value={complaintDraft.description}
                onChange={e => setComplaintDraft({ description: e.target.value })}
                placeholder="Ne zaman başladı, hangi koşullarda oluyor, servise gittiniz mi?"
              />
              <p style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif', marginTop: 4 }}>
                {complaintDraft.description.length} karakter
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => setComplaintStep(1)}>Geri</button>
              <button
                className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                disabled={!complaintDraft.symptoms.length || !complaintDraft.kmAtComplaint}
                onClick={() => setComplaintStep(3)}
              >
                Özeti Gör <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== STEP 3: Review ===== */}
      {complaintStep === 3 && (
        <div style={s.card}>
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: 'var(--text-1)', marginBottom: 20 }}>Gözden Geçir</h2>
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Araç', value: `${complaintDraft.brand} ${complaintDraft.model} ${complaintDraft.year} — ${complaintDraft.engine}` },
              { label: 'Kategori', value: CATEGORIES.find(c => c.value === complaintDraft.category)?.label },
              { label: 'Semptomlar', value: complaintDraft.symptoms.join(', ') },
              { label: 'Km', value: `${complaintDraft.kmAtComplaint?.toLocaleString('tr-TR')} km` },
              { label: 'Şiddet', value: `${complaintDraft.severity} / 5` },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>
                <span style={{ color: 'var(--text-3)' }}>{row.label}</span>
                <span style={{ color: 'var(--text-1)', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{row.value}</span>
              </div>
            ))}
            {complaintDraft.isRecurring && (
              <span className="pill pill-recurring" style={{ alignSelf: 'flex-start' }}>Tekrarlayan sorun</span>
            )}
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FDF0EE', border: '1px solid var(--chronic)', fontSize: 13, color: 'var(--chronic)', fontFamily: 'DM Sans, sans-serif', marginBottom: 16 }}>
              {error}
            </div>
          )}



          <p style={{ fontSize: 13, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif', marginBottom: 16 }}>
            Şikayetiniz kaydedildikten sonra diğer kullanıcılar tarafından görüntülenebilecektir.
          </p>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => setComplaintStep(2)} disabled={submitting}>Geri</button>
            <button
              className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? (
                <><div className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Kaydediliyor…</>
              ) : (
                <>Şikayeti Gönder <ChevronRight size={16} /></>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
