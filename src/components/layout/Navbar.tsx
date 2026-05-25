'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/appStore';
import { createClient } from '@/lib/supabase/client';
import { AlertTriangle, Home, Search, PlusCircle, BookOpen, Shield, User, Menu, X, Car, ChevronRight } from 'lucide-react';

const navLinks = [
  { href: '/',             label: 'Ana Sayfa',     icon: Home },
  { href: '/sikayetler',   label: 'Şikayetler',    icon: AlertTriangle },
  { href: '/araclar',      label: 'Araç Ara',       icon: Search },
  { href: '/arac-gunlugu', label: 'Araç Günlüğü',  icon: BookOpen },
  { href: '/dogrulama',    label: 'Doğrulama',     icon: Shield },
  { href: '/profil',       label: 'Profilim',      icon: User },
];

export function Navbar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, setUser } = useAppStore();

  useEffect(() => {
    const supabase = createClient();
    
    // Initial sync
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from('users').select('*').eq('id', session.user.id).single().then(({ data: profile }) => {
          if (profile) {
            setUser(profile);
          } else {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              full_name: session.user.user_metadata?.full_name || null,
              avatar_url: session.user.user_metadata?.avatar_url || null,
              trust_score: 0,
              verified_at: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        });
      } else {
        setUser(null);
      }
    });

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
        if (profile) {
          setUser(profile);
        } else {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            full_name: session.user.user_metadata?.full_name || null,
            avatar_url: session.user.user_metadata?.avatar_url || null,
            trust_score: 0,
            verified_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser]);

  return (
    <>
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: 64,
        background: 'rgba(250,248,245,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 24px',
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: 10,
            textDecoration: 'none',
          }}>
            <div style={{
              width: 32, height: 32,
              background: 'var(--accent)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Car size={16} color="white" />
            </div>
            <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: 'var(--text-1)', fontWeight: 400 }}>
              araba<span style={{ color: 'var(--accent)' }}>şikayet</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desktop-nav">
            {navLinks.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? 'var(--text-1)' : 'var(--text-2)',
                  background: isActive ? 'var(--bg-2)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'background var(--ease), color var(--ease)',
                  fontFamily: 'DM Sans, sans-serif',
                }}
                onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'var(--bg-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-1)'; } }}
                onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; } }}
                >
                  <item.icon size={15} />
                  {item.label}
                </Link>
              );
            })}
            <Link href="/sikayet-bildir" className="btn btn-primary btn-sm" style={{ marginLeft: 8 }}>
              <PlusCircle size={14} />
              Şikayet Bildir
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn btn-ghost btn-sm mobile-menu-btn"
            aria-label="Menüyü aç/kapat"
            style={{ padding: '0 8px' }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(28,25,23,0.4)',
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Mobile sidebar */}
      <aside style={{
        position: 'fixed', top: 64, left: 0, bottom: 0, zIndex: 40,
        width: 288,
        background: 'var(--bg-1)',
        borderRight: '1px solid var(--border)',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 200ms ease',
        padding: 16,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {navLinks.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--text-1)' : 'var(--text-2)',
              background: isActive ? 'var(--bg-2)' : 'transparent',
              textDecoration: 'none',
              transition: 'background var(--ease)',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              <item.icon size={18} />
              {item.label}
              <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-3)' }} />
            </Link>
          );
        })}
        <Link href="/sikayet-bildir" className="btn btn-primary" style={{ marginTop: 16, justifyContent: 'center' }} onClick={() => setSidebarOpen(false)}>
          <PlusCircle size={16} />
          Şikayet Bildir
        </Link>
      </aside>

      <style>{`
        @media (max-width: 768px) { .desktop-nav { display: none !important; } }
        @media (min-width: 769px) { .mobile-menu-btn { display: none !important; } }
      `}</style>
    </>
  );
}
