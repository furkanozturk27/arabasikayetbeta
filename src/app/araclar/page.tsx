'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, AlertTriangle, ChevronRight, Car, Inbox, PlusCircle } from 'lucide-react';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  engine: string;
  trim: string | null;
  transmission: string;
  fuel_type: string;
}

const FUEL_LABELS: Record<string, string> = {
  gasoline: 'Benzin', diesel: 'Dizel', hybrid: 'Hibrit',
  electric: 'Elektrik', lpg: 'LPG',
};
const FUEL_PILL: Record<string, string> = {
  gasoline: 'pill-neutral', diesel: 'pill-info',
  hybrid: 'pill-resolved', electric: 'pill-info', lpg: 'pill-neutral',
};

const BRANDS = ['Audi','BMW','Fiat','Ford','Honda','Hyundai','Kia','Mercedes','Renault','Toyota','Volkswagen'];

export default function AraclarPage() {
  const [vehicles, setVehicles]     = useState<Vehicle[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [query, setQuery]           = useState('');
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    fetch('/api/vehicles')
      .then(r => r.json())
      .then((data: Vehicle[]) => { setVehicles(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = vehicles.filter(v => {
    const matchesBrand = !selectedBrand || v.brand === selectedBrand;
    const matchesQuery = !query || [v.brand, v.model, v.engine].join(' ')
      .toLowerCase().includes(query.toLowerCase());
    return matchesBrand && matchesQuery;
  });

  const grouped = filtered.reduce<Record<string, Vehicle[]>>((acc, v) => {
    const key = `${v.brand} ${v.model}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(v);
    return acc;
  }, {});

  const isEmpty = !loading && Object.keys(grouped).length === 0;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 80px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 30, color: 'var(--text-1)', marginBottom: 6 }}>
            Araç Kataloğu
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif' }}>
            {vehicles.length > 0
              ? `${vehicles.length} araç versiyonu · Türkiye'nin en popüler modelleri`
              : 'Araç veritabanı yükleniyor…'}
          </p>
        </div>
      </div>

      {/* Search + select row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            type="text"
            placeholder="Marka, model veya motor ara…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: 40 }}
          />
        </div>
        <select
          value={selectedBrand}
          onChange={e => setSelectedBrand(e.target.value)}
          className="form-select"
          style={{ minWidth: 180 }}
        >
          <option value="">Tüm Markalar</option>
          {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Brand pill filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {['Tümü', ...BRANDS].map((b, i) => {
          const val = i === 0 ? '' : b;
          const active = selectedBrand === val;
          return (
            <button
              key={b}
              onClick={() => setSelectedBrand(active ? '' : val)}
              style={{
                padding: '5px 14px', borderRadius: 8, cursor: 'pointer',
                fontSize: 13, fontFamily: 'DM Sans, sans-serif',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                background: active ? 'var(--accent-light)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-2)',
                fontWeight: active ? 500 : 400,
                transition: 'all var(--ease)',
              }}
            >{b}</button>
          );
        })}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontSize: 14, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif' }}>Araçlar yükleniyor…</p>
        </div>
      )}

      {/* Empty state — brief: proper empty state required */}
      {isEmpty && (
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Inbox size={24} style={{ color: 'var(--text-3)' }} />
          </div>
          <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: 'var(--text-1)', marginBottom: 8 }}>
            {query || selectedBrand ? 'Bu arama için araç bulunamadı' : 'Araç veritabanı henüz boş'}
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif', maxWidth: 380, margin: '0 auto 24px' }}>
            {query || selectedBrand
              ? `"${query || selectedBrand}" aramanız için sonuç yok. Farklı bir model ya da marka deneyin.`
              : 'Bu araç henüz eklenmedi. Siz de bir şikayet bildirerek yeni araç ekleyebilirsiniz.'}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {(query || selectedBrand) && (
              <button className="btn btn-secondary" onClick={() => { setQuery(''); setSelectedBrand(''); }}>
                Filtreyi Temizle
              </button>
            )}
            <Link href="/sikayet-bildir" className="btn btn-primary">
              <PlusCircle size={15} /> Şikayet Bildir
            </Link>
          </div>
        </div>
      )}

      {/* Vehicle cards */}
      {!loading && !isEmpty && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Object.entries(grouped).map(([name, variants]) => {
            const years = [...new Set(variants.map(v => v.year))].sort((a, b) => b - a);
            const fuels = [...new Set(variants.map(v => v.fuel_type))];
            return (
              <div key={name} className="card card-hover" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  {/* Left: icon + info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: 'var(--bg-2)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Car size={20} style={{ color: 'var(--text-3)' }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h2 style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-1)', fontFamily: 'DM Sans, sans-serif', marginBottom: 4 }}>
                        {name}
                      </h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'DM Mono, monospace' }}>
                          {variants.length} versiyon · {years.slice(0, 3).join(', ')}
                        </span>
                        {fuels.map(f => (
                          <span key={f} className={`pill ${FUEL_PILL[f] || 'pill-neutral'}`}>{FUEL_LABELS[f] || f}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <Link
                      href={`/sikayetler?brand=${encodeURIComponent(variants[0].brand)}&model=${encodeURIComponent(variants[0].model)}`}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: 6 }}
                    >
                      <AlertTriangle size={12} style={{ color: 'var(--recurring)' }} />
                      Şikayetler
                    </Link>
                    <ChevronRight size={15} style={{ color: 'var(--text-3)' }} />
                  </div>
                </div>

                {/* Engine variants accordion */}
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {variants.map(v => (
                    <span key={v.id} className="pill pill-neutral" style={{ fontFamily: 'DM Mono, monospace', fontSize: 11 }}>
                      {v.year} · {v.engine}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
