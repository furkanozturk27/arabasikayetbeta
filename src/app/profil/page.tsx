'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/appStore';
import { getTrustLabel } from '@/lib/utils';
import { User, Shield, AlertTriangle, BookOpen, LogOut, Star, ChevronRight, Loader, ArrowRight, Rocket, CheckCircle, Award, Handshake, Trophy } from 'lucide-react';
import Link from 'next/link';

const BADGE_INFO: Record<string, { Icon: any; label: string; desc: string }> = {
  first_complaint:  { Icon: Rocket,      label: 'İlk Şikayet',          desc: 'En az 1 Şikayet bildirdin.' },
  verified_owner:   { Icon: CheckCircle, label: 'Doğrulanmış Sahip',    desc: 'Bir aracın şasisisini doğruladın.' },
  trusted_reporter: { Icon: Star,        label: 'Güvenilir Profil',     desc: '50+ güven puanına ulaştın.' },
  community_helper: { Icon: Handshake,   label: 'Topluluk Yardımcısı', desc: 'Şikayetin faydalı bulundu.' },
  veteran_driver:   { Icon: Trophy,      label: 'Veteran Sürücu',       desc: '3+ araç günlüğü kaydı tuttun.' },
};

const CATEGORY_LABELS: Record<string, string> = {
  engine: 'Motor', transmission: 'Şanzıman', brakes: 'Frenler',
  suspension: 'Süspansiyon', electrical: 'Elektrik', ac_heating: 'Klima/Isıtma',
  fuel_system: 'Yakıt', exhaust: 'Egzoz', body_paint: 'Kaporta/Boya',
  interior: 'İç Mekan', safety_systems: 'Güvenlik', steering: 'Direksiyon',
  tires_wheels: 'Lastik/Jant', other: 'Diğer',
};

const VERDICT_PILL: Record<string, { label: string; cls: string }> = {
  chronic:    { label: 'Kronik',          cls: 'pill pill-chronic'   },
  common:     { label: 'Yaşgın',          cls: 'pill pill-recurring' },
  isolated:   { label: 'İzole',            cls: 'pill pill-info'      },
  user_error: { label: 'Kullanım Hatası', cls: 'pill pill-neutral'   },
};

export default function ProfilPage() {
  const router = useRouter();
  const { user, setUser } = useAppStore();
  
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [vinVerified, setVinVerified] = useState(false);
  const [logCount, setLogCount] = useState(0);
  const [hasHelpfulVotes, setHasHelpfulVotes] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/giris?redirect=/profil');
      } else {
        fetchProfileStats(session.user.id);
      }
    });
  }, [router]);

  async function fetchProfileStats(userId: string) {
    setLoading(true);
    try {
      // 1. Refresh user details
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profile) {
        setUser(profile);
      }

      // 2. Fetch user's complaints
      const { data: complaintsData } = await supabase
        .from('complaints')
        .select(`*, vehicles (brand, model, year, engine), ai_analyses (verdict, summary)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      setComplaints(complaintsData || []);

      // Check if any complaint has helpful votes
      const hasHelpful = complaintsData?.some((c: any) => c.helpful_count > 0) || false;
      setHasHelpfulVotes(hasHelpful);

      // 3. Fetch log count
      const { count: logsSize } = await supabase
        .from('vehicle_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      setLogCount(logsSize || 0);

      // 4. Fetch verifications to check for VIN verification
      const { data: verifs } = await supabase
        .from('verifications')
        .select('type')
        .eq('user_id', userId)
        .eq('type', 'vin');
      
      setVinVerified(verifs && verifs.length > 0 ? true : false);
    } catch (err) {
      console.error('Error loading profile details:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <Loader className="spinner" size={24} style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  const trustScore = user?.trust_score ?? 0;
  const trust    = getTrustLabel(trustScore);
  const trustPct = Math.min((trustScore / 200) * 100, 100);
  const initials = user
    ? (user.full_name?.[0] || user.email[0]).toUpperCase()
    : '?';

  // Compute dynamic badge unlock statuses
  const earnedBadges = {
    first_complaint: complaints.length >= 1,
    verified_owner: vinVerified,
    trusted_reporter: trustScore >= 50,
    community_helper: hasHelpfulVotes,
    veteran_driver: logCount >= 3,
  };

  const badgeCount = Object.values(earnedBadges).filter(Boolean).length;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
      
      {/* Header Profile Info */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          {/* Avatar */}
          <div style={{
            width: 56, height: 56, borderRadius: 14, flexShrink: 0,
            background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'DM Serif Display, serif', fontSize: 22, color: '#fff',
          }}>
            {initials}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: 'var(--text-1)', marginBottom: 2 }}>
              {user?.full_name || 'Kullanıcı'}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif', marginBottom: 6 }}>
              {user?.email || '…'}
            </p>
            {trust && (
              <span className="pill" style={{ background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 500 }}>
                {trust.label}
              </span>
            )}
          </div>

          {/* Logout */}
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ flexShrink: 0 }}>
            <LogOut size={14} /> Çıkış
          </button>
        </div>

        {/* Trust bar */}
        {user && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)', fontFamily: 'DM Mono, monospace', marginBottom: 6 }}>
              <span>Güven Puanı</span>
              <span>{trustScore} / 200</span>
            </div>
            <div style={{ height: 6, background: 'var(--bg-3)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${trustPct}%`,
                background: 'var(--accent)', borderRadius: 3,
                transition: 'width 700ms ease-out',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
        {[
          { href: '/sikayet-bildir', icon: AlertTriangle, label: 'Şikayet Bildir',  desc: 'Yeni şikayet ekle',    color: 'var(--chronic)'   },
          { href: '/arac-gunlugu',   icon: BookOpen,     label: 'Araç Günlüğüm',   desc: 'Bakım geçmişi',       color: 'var(--info)'      },
          { href: '/dogrulama',      icon: Shield,       label: 'Doğrulama',       desc: 'Güven puanı kazan',   color: 'var(--resolved)'  },
        ].map(item => (
          <Link key={item.href} href={item.href} className="card card-hover" style={{ textDecoration: 'none', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <item.icon size={16} style={{ color: item.color }} />
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)', fontFamily: 'DM Sans, sans-serif' }}>{item.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif' }}>{item.desc}</div>
          </Link>
        ))}
      </div>

      {/* Dynamic Badges Showcase */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'DM Serif Display, serif', fontSize: 18, color: 'var(--text-1)' }}>
            <Star size={16} style={{ color: 'var(--recurring)' }} /> Rozetler
          </h2>
          <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif' }}>
            {badgeCount} / {Object.keys(BADGE_INFO).length} kazanıldı
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {Object.entries(BADGE_INFO).map(([type, info]) => {
            const isUnlocked = (earnedBadges as any)[type];
            const { Icon } = info;
            return (
              <div
                key={type}
                title={`${info.label}: ${info.desc}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '10px 6px',
                  borderRadius: 10,
                  background: isUnlocked ? 'var(--accent-bg)' : 'var(--bg-2)',
                  border: `1px solid ${isUnlocked ? 'var(--accent)' : 'var(--border)'}`,
                  opacity: isUnlocked ? 1 : 0.4,
                  transition: 'all var(--ease)',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: isUnlocked ? 'var(--accent-light)' : 'var(--bg-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={16} style={{ color: isUnlocked ? 'var(--accent)' : 'var(--text-3)' }} />
                </div>
                <span style={{ fontSize: 10, color: isUnlocked ? 'var(--accent-text)' : 'var(--text-3)', fontFamily: 'DM Sans, sans-serif', textAlign: 'center', fontWeight: isUnlocked ? 500 : 400, lineHeight: 1.3 }}>
                  {info.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Benim Şikayetlerim (My Complaints Section) */}
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: 'var(--text-1)', marginBottom: 16 }}>
          Benim Şikayetlerim
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {complaints.map((c: any) => {
            const v = c.vehicles;
            const ai = c.ai_analyses?.[0];
            const vp = ai ? VERDICT_PILL[ai.verdict] : null;

            return (
              <Link
                key={c.id}
                href={`/sikayetler/${c.id}`}
                className="card card-hover"
                style={{
                  textDecoration: 'none',
                  padding: '14px 16px',
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                  display: 'block'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', fontFamily: 'DM Sans, sans-serif' }}>
                        {v?.brand} {v?.model} · {v?.year}
                      </span>
                      <span className="pill pill-neutral">{CATEGORY_LABELS[c.category] || c.category}</span>
                      {c.is_chronic && <span className="pill pill-chronic">Kronik</span>}
                      {vp && !c.is_chronic && <span className={vp.cls}>{vp.label}</span>}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: 'DM Sans, sans-serif', marginBottom: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {c.symptoms?.join(', ')}
                    </p>
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--text-3)', flexShrink: 0, marginTop: 3 }} />
                </div>
              </Link>
            );
          })}

          {complaints.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <AlertTriangle size={24} style={{ color: 'var(--text-3)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, color: 'var(--text-2)', fontFamily: 'DM Sans, sans-serif', marginBottom: 12 }}>
                Henüz bildirdiğiniz bir şikayet yok.
              </p>
              <Link href="/sikayet-bildir" className="btn btn-primary btn-sm">
                Şikayet Bildir
              </Link>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
