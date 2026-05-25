'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Gauge, Wrench, ShoppingCart, StickyNote, Car, TrendingUp, X, Loader } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/appStore';
import Link from 'next/link';

const LOG_TYPES = [
  { value: 'km_record', label: 'Km Kaydı',    icon: Gauge,        color: 'var(--info)'      },
  { value: 'service',   label: 'Servis',       icon: Wrench,       color: 'var(--resolved)'  },
  { value: 'repair',    label: 'Tamir',        icon: Wrench,       color: 'var(--recurring)' },
  { value: 'purchase',  label: 'Satın Alma',   icon: ShoppingCart, color: 'var(--accent)'    },
  { value: 'note',      label: 'Not',          icon: StickyNote,   color: 'var(--text-3)'    },
];

const DEMO_LOGS = [
  { id: 'demo-1', type: 'purchase',  km: 0,     note: 'Araç satın alındı.',                          cost: null, created_at: '2022-03-15T12:00:00Z' },
  { id: 'demo-2', type: 'km_record', km: 15000, note: null,                                            cost: null, created_at: '2022-09-10T12:00:00Z' },
  { id: 'demo-3', type: 'service',   km: 15000, note: 'Periyodik bakım — motor yağı & filtre değişimi', cost: 1800, created_at: '2022-09-10T12:00:00Z' },
  { id: 'demo-4', type: 'km_record', km: 30500, note: null,                                            cost: null, created_at: '2023-04-20T12:00:00Z' },
  { id: 'demo-5', type: 'repair',    km: 31000, note: 'Fren balatası değişimi (ön)',                   cost: 2400, created_at: '2023-05-01T12:00:00Z' },
  { id: 'demo-6', type: 'km_record', km: 47200, note: null,                                            cost: null, created_at: '2024-01-12T12:00:00Z' },
  { id: 'demo-7', type: 'service',   km: 47200, note: 'Periyodik bakım — hava filtresi & buji',        cost: 2100, created_at: '2024-01-12T12:00:00Z' },
];

const PILL_TYPE: Record<string, { bg: string; color: string }> = {
  km_record: { bg: '#EFF6FF', color: 'var(--info)'      },
  service:   { bg: '#F0FDF4', color: 'var(--resolved)'  },
  repair:    { bg: '#FEF3C7', color: 'var(--recurring)' },
  purchase:  { bg: 'var(--accent-light)', color: 'var(--accent)' },
  note:      { bg: 'var(--bg-3)',         color: 'var(--text-2)' },
};

export default function AracGunluguPage() {
  const { user } = useAppStore();
  const [activeType, setActiveType] = useState('all');
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Database states
  const [logs, setLogs] = useState<any[]>([]);
  const [userVehicles, setUserVehicles] = useState<any[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);

  // Add Vehicle Form State
  const [selectedVehicleModelId, setSelectedVehicleModelId] = useState('');
  const [vinLast6, setVinLast6] = useState('');
  const [purchaseYear, setPurchaseYear] = useState('');
  const [addVehicleLoading, setAddVehicleLoading] = useState(false);

  // Add Log Form State
  const [logType, setLogType] = useState('km_record');
  const [logKm, setLogKm] = useState('');
  const [logCost, setLogCost] = useState('');
  const [logNote, setLogNote] = useState('');
  const [selectedLogVehicleId, setSelectedLogVehicleId] = useState('');
  const [addLogLoading, setAddLogLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    // Always load vehicle catalog for dropdowns
    supabase.from('vehicles').select('*').order('brand').then(({ data }) => {
      if (data) setAvailableVehicles(data);
    });

    if (!user) {
      setLoading(false);
      return;
    }

    fetchUserData();
  }, [user]);

  async function fetchUserData() {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch user vehicles
      const { data: uvData } = await supabase
        .from('user_vehicles')
        .select('*, vehicles (*)')
        .eq('user_id', user.id);

      setUserVehicles(uvData || []);
      if (uvData && uvData.length > 0) {
        setSelectedLogVehicleId(uvData[0].vehicle_id);
      }

      // 2. Fetch logs
      const { data: logsData } = await supabase
        .from('vehicle_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setLogs(logsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddVehicle(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !selectedVehicleModelId) return;

    setAddVehicleLoading(true);
    const { data, error } = await supabase
      .from('user_vehicles')
      .insert({
        user_id: user.id,
        vehicle_id: selectedVehicleModelId,
        vin_last6: vinLast6.length === 6 ? vinLast6 : null,
        purchase_year: purchaseYear ? Number(purchaseYear) : null,
        is_current: true
      })
      .select();

    if (error) {
      alert(`Araç eklenemedi: ${error.message}`);
    } else {
      setSelectedVehicleModelId('');
      setVinLast6('');
      setPurchaseYear('');
      await fetchUserData();
    }
    setAddVehicleLoading(false);
  }

  async function handleAddLog(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !selectedLogVehicleId) return;

    setAddLogLoading(true);
    const { data, error } = await supabase
      .from('vehicle_logs')
      .insert({
        user_id: user.id,
        vehicle_id: selectedLogVehicleId,
        type: logType,
        km: logKm ? Number(logKm) : null,
        cost: logCost ? Number(logCost) : null,
        note: logNote || null,
      })
      .select();

    if (error) {
      alert(`Kayıt eklenemedi: ${error.message}`);
    } else {
      setLogKm('');
      setLogCost('');
      setLogNote('');
      setShowAddLogModal(false);
      await fetchUserData();
    }
    setAddLogLoading(false);
  }

  const activeLogs = user ? logs : DEMO_LOGS;

  const filtered = activeType === 'all'
    ? activeLogs
    : activeLogs.filter(l => l.type === activeType);

  const totalCost = activeLogs.reduce((s, l) => s + (Number(l.cost) || 0), 0);
  const maxKm     = activeLogs.length > 0 ? Math.max(...activeLogs.filter(l => l.km).map(l => Number(l.km)), 0) : 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <Loader className="spinner" size={24} style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 40, padding: '0 12px',
    background: '#fff', border: '1px solid var(--border)',
    borderRadius: 8, fontSize: 14, fontFamily: 'DM Sans, sans-serif',
    color: 'var(--text-1)', outline: 'none',
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>

      {/* Demo/Preview Banner for Guest Users */}
      {!user && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', borderRadius: 10, marginBottom: 24,
          background: '#FFFBF0', border: '1px solid #FDE68A',
          fontSize: 13, fontFamily: 'DM Sans, sans-serif',
        }}>
          <Car size={16} style={{ color: 'var(--recurring)', flexShrink: 0 }} />
          <span style={{ color: 'var(--text-2)' }}>
            <strong style={{ color: 'var(--text-1)' }}>Önizleme Modu</strong> — Kendi araç günlüğünüzü oluşturmak için{' '}
            <Link href="/giris?redirect=/arac-gunlugu" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>giriş yapın</Link>.
            Aşağıdaki kayıtlar demo amaçlıdır.
          </span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 28, color: 'var(--text-1)', marginBottom: 6 }}>
            Araç Günlüğü
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif' }}>
            Aracınızın tüm bakım, yakıt, muayene ve tamir geçmişi tek yerde.
          </p>
        </div>
        {user && userVehicles.length > 0 && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddLogModal(true)}>
            <Plus size={14} /> Kayıt Ekle
          </button>
        )}
      </div>

      {/* Database Integration Setup Step for Authenticated Users with No Registered Vehicle */}
      {user && userVehicles.length === 0 && (
        <div className="card" style={{ padding: 28, marginBottom: 32, border: '1px dashed var(--accent)' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <Car size={36} style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
            <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: 'var(--text-1)', marginBottom: 6 }}>
              Garajınız Henüz Boş
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', fontFamily: 'DM Sans, sans-serif', maxWidth: 460, margin: '0 auto' }}>
              Günlük kaydı tutabilmek için önce garajınıza bir araç eklemelisiniz.
            </p>
          </div>

          <form onSubmit={handleAddVehicle} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 420, margin: '0 auto' }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Araç Modeli Seçin</label>
              <select
                required
                value={selectedVehicleModelId}
                onChange={e => setSelectedVehicleModelId(e.target.value)}
                style={inputStyle}
              >
                <option value="">Seçin...</option>
                {availableVehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.model} ({v.year} - {v.engine})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Satın Alma Yılı</label>
                <input
                  type="number"
                  placeholder="Örn: 2022"
                  value={purchaseYear}
                  onChange={e => setPurchaseYear(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Şasi No Son 6 Hane</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Örn: 123456"
                  value={vinLast6}
                  onChange={e => setVinLast6(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={addVehicleLoading}>
              {addVehicleLoading ? 'Ekleniyor...' : 'Aracı Garaja Ekle'}
            </button>
          </form>
        </div>
      )}

      {/* Garaj Araç Listesi (Eğer araç varsa göster) */}
      {user && userVehicles.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16, marginBottom: 16 }}>
          {userVehicles.map(uv => {
            const v = uv.vehicles;
            return (
              <div key={uv.id} className="card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: 'var(--bg-2)', border: '1px solid var(--accent)' }}>
                <Car size={16} style={{ color: 'var(--accent)' }} />
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', fontFamily: 'DM Sans, sans-serif' }}>
                    {v.brand} {v.model}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', fontFamily: 'DM Mono, monospace' }}>
                    {v.year} · {v.engine}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      {(!user || userVehicles.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
          {[
            { label: 'Güncel Km', value: maxKm.toLocaleString('tr-TR') + ' km', icon: Gauge },
            { label: 'Toplam Kayıt', value: String(activeLogs.length), icon: BookOpen },
            { label: 'Toplam Harcama', value: totalCost.toLocaleString('tr-TR') + ' ₺', icon: TrendingUp },
          ].map(stat => (
            <div key={stat.label} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <stat.icon size={14} style={{ color: 'var(--text-3)' }} />
                <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>{stat.label}</span>
              </div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 18, fontWeight: 600, color: 'var(--text-1)' }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Type filters */}
      {(!user || userVehicles.length > 0) && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {[{ value: 'all', label: 'Tümü' }, ...LOG_TYPES].map(t => {
            const active = activeType === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setActiveType(t.value)}
                style={{
                  padding: '5px 14px', borderRadius: 8, cursor: 'pointer',
                  fontSize: 13, fontFamily: 'DM Sans, sans-serif',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  background: active ? 'var(--accent-light)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-2)',
                  fontWeight: active ? 500 : 400,
                  transition: 'all var(--ease)',
                }}
              >{t.label}</button>
            );
          })}
        </div>
      )}

      {/* Timeline */}
      {(!user || userVehicles.length > 0) && (
        <div style={{ position: 'relative', paddingLeft: 40 }}>
          {/* Vertical track */}
          <div style={{ position: 'absolute', left: 15, top: 8, bottom: 8, width: 2, background: 'var(--bg-3)' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(log => {
              const t = LOG_TYPES.find(x => x.value === log.type);
              const Icon = t?.icon || Car;
              const pill = PILL_TYPE[log.type];
              return (
                <div key={log.id} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', position: 'relative' }}>
                  {/* Icon dot */}
                  <div style={{
                    position: 'absolute', left: -29,
                    width: 30, height: 30, borderRadius: '50%',
                    background: '#fff', border: '1.5px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, zIndex: 1,
                  }}>
                    <Icon size={13} style={{ color: t?.color || 'var(--text-3)' }} />
                  </div>

                  {/* Card */}
                  <div className="card" style={{ flex: 1, padding: '14px 18px', minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)', fontFamily: 'DM Sans, sans-serif' }}>
                            {t?.label || log.type}
                          </span>
                          {log.km > 0 && (
                            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--text-3)' }}>
                              {Number(log.km).toLocaleString('tr-TR')} km
                            </span>
                          )}
                          {log.cost && (
                            <span style={{ ...pill, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500 }}>
                              {Number(log.cost).toLocaleString('tr-TR')} ₺
                            </span>
                          )}
                        </div>
                        {log.note && (
                          <p style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: 'DM Sans, sans-serif' }}>{log.note}</p>
                        )}
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'DM Mono, monospace', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif' }}>
                Seçilen filtreye ait kayıt bulunamadı.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Log Modal */}
      {showAddLogModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, background: 'rgba(28,25,23,0.4)', backdropFilter: 'blur(4px)',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 440, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: 'var(--text-1)' }}>Kayıt Ekle</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddLogModal(false)} style={{ padding: '0 8px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddLog} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Araç Seçin</label>
                <select
                  required
                  value={selectedLogVehicleId}
                  onChange={e => setSelectedLogVehicleId(e.target.value)}
                  style={inputStyle}
                >
                  {userVehicles.map(uv => (
                    <option key={uv.vehicles.id} value={uv.vehicles.id}>
                      {uv.vehicles.brand} {uv.vehicles.model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Kayıt Türü</label>
                <select
                  value={logType}
                  onChange={e => setLogType(e.target.value)}
                  style={inputStyle}
                >
                  {LOG_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Kilometre (Km)</label>
                  <input
                    type="number"
                    placeholder="Örn: 47200"
                    value={logKm}
                    onChange={e => setLogKm(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Maliyet (₺)</label>
                  <input
                    type="number"
                    placeholder="Örn: 2100"
                    value={logCost}
                    onChange={e => setLogCost(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Açıklama / Not</label>
                <textarea
                  placeholder="Bakım içeriği, parça bilgisi veya özel notlar..."
                  value={logNote}
                  onChange={e => setLogNote(e.target.value)}
                  style={{ ...inputStyle, height: 80, padding: '10px 12px', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowAddLogModal(false)}>
                  İptal
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={addLogLoading}>
                  {addLogLoading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
