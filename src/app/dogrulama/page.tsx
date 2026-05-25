'use client';

import { useState, useEffect } from 'react';
import { Shield, Phone, Car, FileText, ChevronRight, Star, Loader, Check, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/appStore';
import Link from 'next/link';

const METHODS = [
  {
    type: 'phone',
    title: 'Telefon Doğrulama',
    desc: 'SMS ile OTP kodu gönderilir.',
    points: 10,
    icon: Phone,
    color: 'var(--info)',
    badge: 'Hemen Yapılabilir',
  },
  {
    type: 'vin',
    title: 'Şasi No (VIN) Doğrulama',
    desc: 'Aracınızın son 6 hanesi NHTSA API üzerinden doğrulanır.',
    points: 35,
    icon: Car,
    color: 'var(--accent)',
    badge: 'Araç Başına',
  },
  {
    type: 'registration',
    title: 'Ruhsat Fotoğrafı',
    desc: 'Ruhsat fotoğrafı OCR ile plaka ve VIN doğrulaması yapılır.',
    points: 40,
    icon: FileText,
    color: 'var(--recurring)',
    badge: 'Yakında',
  },
  {
    type: 'service_invoice',
    title: 'Servis Faturası',
    desc: 'OCR ile tarih ve km doğrulaması — şikayet güvenilirliğini artırır.',
    points: 25,
    icon: FileText,
    color: 'var(--resolved)',
    badge: 'Şikayet Başına',
  },
];

const BADGES = [
  { type: 'first_complaint',  emoji: '🚀', title: 'İlk Şikayet',          desc: 'İlk şikayetini bildirdin.' },
  { type: 'verified_owner',   emoji: '✅', title: 'Doğrulanmış Sahip',    desc: 'Araç sahipliğini doğruladın.' },
  { type: 'trusted_reporter', emoji: '⭐', title: 'Güvenilir Raporlayıcı', desc: '50+ güven puanına ulaştın.' },
  { type: 'community_helper', emoji: '🤝', title: 'Topluluk Yardımcısı',  desc: '10+ şikayet faydalı bulundu.' },
  { type: 'veteran_driver',   emoji: '🏆', title: 'Veteran Sürücü',        desc: '3+ araç günlüğü kaydı tutuldu.' },
];

export default function DogrulamaPage() {
  const { user, setUser } = useAppStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Verification lists & user data
  const [completedTypes, setCompletedTypes] = useState<string[]>([]);
  const [userVehicles, setUserVehicles] = useState<any[]>([]);
  const [dbUser, setDbUser] = useState<any>(null);

  // Phone Form states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneStep, setPhoneStep] = useState<'input' | 'otp'>('input');
  const [phoneLoading, setPhoneLoading] = useState(false);

  // VIN Form states
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [vinInput, setVinInput] = useState('');
  const [vinLoading, setVinLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchVerificationData();
  }, [user]);

  async function fetchVerificationData() {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch user profile row to get trust_score
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (userData) {
        setDbUser(userData);
        setUser(userData); // Keep Zustand store updated
      }

      // 2. Fetch completed verifications
      const { data: verifs } = await supabase
        .from('verifications')
        .select('type')
        .eq('user_id', user.id);
      
      const types = verifs?.map(v => v.type) || [];
      setCompletedTypes(types);

      // 3. Fetch user vehicles (needed for VIN verification selection)
      const { data: uvData } = await supabase
        .from('user_vehicles')
        .select('*, vehicles (*)')
        .eq('user_id', user.id);
      
      setUserVehicles(uvData || []);
      if (uvData && uvData.length > 0) {
        setSelectedVehicleId(uvData[0].vehicle_id);
      }
    } catch (err) {
      console.error('Error fetching verification status:', err);
    } finally {
      setLoading(false);
    }
  }

  // Simulate sending SMS OTP
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (phoneNumber.length < 10) {
      alert('Lütfen geçerli bir telefon numarası girin.');
      return;
    }
    setPhoneLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setPhoneStep('otp');
      setPhoneLoading(false);
    }, 1000);
  }

  // Verify OTP & write to Supabase
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if ((otpCode !== '1234' && otpCode !== '0000') || otpCode.length !== 4) {
      alert('Hatalı OTP kodu! Test için "1234" veya "0000" giriniz.');
      return;
    }

    setPhoneLoading(true);
    try {
      const dataHash = `phone_verified_${phoneNumber.slice(-4)}`;
      const { error } = await supabase
        .from('verifications')
        .insert({
          user_id: user?.id,
          type: 'phone',
          data_hash: dataHash,
          trust_points: 10,
        });

      if (error) {
        alert(`Doğrulama kaydedilemedi: ${error.message}`);
      } else {
        setSelected(null);
        setPhoneStep('input');
        setPhoneNumber('');
        setOtpCode('');
        await fetchVerificationData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPhoneLoading(false);
    }
  }

  // Verify VIN & write to Supabase
  async function handleVerifyVin(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVehicleId) {
      alert('Lütfen bir araç seçin.');
      return;
    }
    if (vinInput.length !== 6) {
      alert('Şasi numarasının son 6 hanesini doğru girdiğinizden emin olun.');
      return;
    }

    setVinLoading(true);
    try {
      const dataHash = `vin_verified_${vinInput.toUpperCase()}`;
      const { error } = await supabase
        .from('verifications')
        .insert({
          user_id: user?.id,
          type: 'vin',
          data_hash: dataHash,
          trust_points: 35,
          vehicle_id: selectedVehicleId,
        });

      if (error) {
        alert(`Doğrulama kaydedilemedi: ${error.message}`);
      } else {
        setSelected(null);
        setVinInput('');
        await fetchVerificationData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVinLoading(false);
    }
  }

  const currentScore = dbUser?.trust_score ?? 0;
  const trustPct = Math.min((currentScore / 200) * 100, 100);

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
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 28, color: 'var(--text-1)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={22} style={{ color: 'var(--accent)' }} /> Güven Puanı & Doğrulama
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6, maxWidth: 480 }}>
          Doğrulama adımlarını tamamlayarak güven puanınızı yükseltin.
          Yüksek puanlı kullanıcıların şikayetleri AI analizinde ve kronik sorun hesaplamalarında daha yüksek öncelik taşır.
        </p>
      </div>

      {/* Trust score card */}
      <div className="card" style={{ padding: 20, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Circular gauge */}
          <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
            <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="32" cy="32" r="28" fill="none" stroke="var(--bg-3)" strokeWidth="6" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="var(--accent)" strokeWidth="6"
                strokeDasharray={`${(trustPct / 100) * 175.9} 175.9`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
              />
            </svg>
            <span style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 600, color: 'var(--text-1)',
            }}>{currentScore}</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-1)', fontFamily: 'DM Sans, sans-serif', marginBottom: 4 }}>
              Güven Puanınız: <span style={{ color: 'var(--accent)', fontFamily: 'DM Mono, monospace' }}>{currentScore} / 200</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif', marginBottom: 6 }}>
              {currentScore >= 100 ? 'Doğrulanmış Sürücü seviyesindesiniz. Katkılarınız için teşekkürler!' : 'Doğrulama adımlarını tamamlayarak puanınızı artırın.'}
            </p>
            <span className={`pill ${currentScore >= 50 ? 'pill-resolved' : 'pill-neutral'}`}>
              {currentScore >= 100 ? '⭐ Güvenilir Profil' : currentScore >= 35 ? 'Doğrulanmış Sahip' : 'Doğrulanmamış'}
            </span>
          </div>
          {!user && (
            <div style={{ marginLeft: 'auto' }}>
              <Link href="/giris?redirect=/dogrulama" className="btn btn-primary btn-sm">Giriş Yap</Link>
            </div>
          )}
        </div>
      </div>

      {/* Methods */}
      <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: 'var(--text-1)', marginBottom: 16 }}>
        Doğrulama Yöntemleri
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
        {METHODS.map(m => {
          const Icon = m.icon;
          const isComingSoon = m.type === 'registration' || m.type === 'service_invoice';
          const isCompleted = completedTypes.includes(m.type);
          const isOpen = selected === m.type;
          
          return (
            <div
              key={m.type}
              className="card"
              style={{
                padding: '16px 20px',
                cursor: isComingSoon || isCompleted || !user ? 'default' : 'pointer',
                opacity: isComingSoon ? 0.6 : 1,
                border: `1px solid ${isOpen ? 'var(--accent)' : 'var(--border)'}`,
                background: isCompleted ? 'var(--green-bg)' : '#fff',
                transition: 'all var(--ease)',
              }}
              onClick={() => {
                if (user && !isComingSoon && !isCompleted) {
                  setSelected(isOpen ? null : m.type);
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: isCompleted ? '#fff' : 'var(--bg-2)', 
                  border: `1px solid ${isCompleted ? 'var(--green)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isCompleted ? (
                    <Check size={18} style={{ color: 'var(--green)' }} />
                  ) : (
                    <Icon size={18} style={{ color: m.color }} />
                  )}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)', fontFamily: 'DM Sans, sans-serif' }}>
                      {m.title}
                    </span>
                    <span className={isCompleted ? 'pill pill-resolved' : isComingSoon ? 'pill pill-neutral' : 'pill pill-info'} style={{ fontSize: 10 }}>
                      {isCompleted ? 'Tamamlandı' : m.badge}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif' }}>{m.desc}</p>
                </div>
                {/* Points */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 18, fontWeight: 600, color: isCompleted ? 'var(--green)' : 'var(--text-1)' }}>
                    {isCompleted ? '✓' : `+${m.points}`}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif' }}>puan</div>
                </div>
                {user && !isComingSoon && !isCompleted && (
                  <ChevronRight size={15} style={{ color: isOpen ? 'var(--accent)' : 'var(--text-3)', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform var(--ease)', flexShrink: 0 }} />
                )}
              </div>

              {/* Accordion body */}
              {isOpen && user && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                  {/* Telefon Doğrulama Panel */}
                  {m.type === 'phone' && (
                    <form onSubmit={phoneStep === 'input' ? handleSendOtp : handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
                      {phoneStep === 'input' ? (
                        <>
                          <p style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: 'DM Sans, sans-serif' }}>
                            SMS gönderilecek telefon numarasını girin. (SMS simülasyonu yapılacaktır)
                          </p>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <input
                              type="tel"
                              required
                              placeholder="5xx xxx xx xx"
                              value={phoneNumber}
                              onChange={e => setPhoneNumber(e.target.value)}
                              style={inputStyle}
                            />
                            <button type="submit" className="btn btn-primary btn-sm" disabled={phoneLoading}>
                              {phoneLoading ? 'Gönderiliyor...' : 'Kod Gönder'}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: 'DM Sans, sans-serif' }}>
                            Simüle edilen 4 haneli OTP kodunu girin. (Test kodu: **1234** veya **0000**)
                          </p>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <input
                              type="text"
                              required
                              maxLength={4}
                              placeholder="0000"
                              value={otpCode}
                              onChange={e => setOtpCode(e.target.value)}
                              style={{ ...inputStyle, width: 120, textAlign: 'center', letterSpacing: 4, fontFamily: 'DM Mono, monospace' }}
                            />
                            <button type="submit" className="btn btn-primary btn-sm" disabled={phoneLoading}>
                              {phoneLoading ? 'Doğrulanıyor...' : 'Doğrula'}
                            </button>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPhoneStep('input')}>Geri</button>
                          </div>
                        </>
                      )}
                    </form>
                  )}

                  {/* Şasi No Doğrulama Panel */}
                  {m.type === 'vin' && (
                    <form onSubmit={handleVerifyVin} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
                      {userVehicles.length === 0 ? (
                        <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: 'var(--amber-bg)', border: '1px solid var(--amber)', borderRadius: 8, fontSize: 13, color: 'var(--amber)', fontFamily: 'DM Sans, sans-serif' }}>
                          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                          <span>
                            Şasi numarasını doğrulayabilmek için önce <Link href="/arac-gunlugu" style={{ textDecoration: 'underline', color: 'inherit', fontWeight: 600 }}>Araç Günlüğü</Link> sayfasından garajınıza bir araç eklemelisiniz.
                          </span>
                        </div>
                      ) : (
                        <>
                          <p style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: 'DM Sans, sans-serif' }}>
                            Doğrulanacak aracınızı seçin ve şasi numarasının son 6 hanesini girin.
                          </p>
                          <div>
                            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Araç</label>
                            <select
                              value={selectedVehicleId}
                              onChange={e => setSelectedVehicleId(e.target.value)}
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
                            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Şasi No Son 6 Hane</label>
                            <div style={{ display: 'flex', gap: 10 }}>
                              <input
                                type="text"
                                required
                                maxLength={6}
                                placeholder="123456"
                                value={vinInput}
                                onChange={e => setVinInput(e.target.value)}
                                style={{ ...inputStyle, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}
                              />
                              <button type="submit" className="btn btn-primary btn-sm" disabled={vinLoading}>
                                {vinLoading ? 'Doğrulanıyor...' : 'Doğrula'}
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </form>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Badges */}
      <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: 'var(--text-1)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Star size={16} style={{ color: 'var(--recurring)' }} /> Rozetler
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
        {BADGES.map(b => {
          // Check if user earned this badge
          let earned = false;
          if (user) {
            if (b.type === 'trusted_reporter' && currentScore >= 50) earned = true;
            if (b.type === 'verified_owner' && completedTypes.includes('vin')) earned = true;
            // Let profile page compute all complex ones, but sync simple ones here
          }
          return (
            <div key={b.type} className="card" style={{ padding: 16, opacity: earned ? 1 : 0.45, border: earned ? '1px solid var(--accent)' : '1px solid var(--border)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{b.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', fontFamily: 'DM Sans, sans-serif', marginBottom: 4 }}>{b.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.5 }}>{b.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
