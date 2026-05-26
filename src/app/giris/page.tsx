'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/store/appStore';
import { createClient } from '@/lib/supabase/client';
import { Car, Mail, Globe, AlertCircle, LogIn } from 'lucide-react';
import Link from 'next/link';

function GirisPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const setUser = useAppStore((s) => s.setUser);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    const supabase = createClient();

    if (mode === 'login') {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError('E-posta veya şifre hatalı. Lütfen tekrar deneyin.'); setLoading(false); return; }
      if (data.user) {
        const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
        if (profile) {
          setUser(profile);
        } else {
          // Profile row may not exist yet for brand-new users — fall back to auth session data
          setUser({
            id: data.user.id,
            email: data.user.email!,
            full_name: data.user.user_metadata?.full_name || null,
            avatar_url: data.user.user_metadata?.avatar_url || null,
            trust_score: 0,
            verified_at: null,
            created_at: data.user.created_at,
            updated_at: new Date().toISOString(),
          });
        }
        router.push(redirectTo);
      }
    } else {
      if (password.length < 6) {
        setError('Şifre en az 6 karakter olmalıdır.');
        setLoading(false);
        return;
      }
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) { setError('Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.'); setLoading(false); return; }
      setSuccess('Kayıt başarılı! E-posta adresinize bir onay bağlantısı gönderdik.');
    }
    setLoading(false);
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 44, padding: '0 14px',
    background: '#fff', border: '1px solid var(--border)',
    borderRadius: 10, fontSize: 15, fontFamily: 'DM Sans, sans-serif',
    color: 'var(--text-1)', outline: 'none',
    transition: 'border-color var(--ease)',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Redirect context banner */}
        {redirectTo !== '/' && (
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:10, background:'var(--accent-light)', border:'1px solid var(--accent)', marginBottom:20, fontSize:13, color:'var(--accent)', fontFamily:'DM Sans,sans-serif' }}>
            <LogIn size={14} />
            Bu sayfaya erişmek için önce giriş yapmalısın.
          </div>
        )}

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{ width: 48, height: 48, background: 'var(--accent)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Car size={24} color="white" />
            </div>
            <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: 'var(--text-1)' }}>
              araba<span style={{ color: 'var(--accent)' }}>şikayet</span>
            </span>
          </Link>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 24, color: 'var(--text-1)', marginTop: 20, marginBottom: 8 }}>
            {mode === 'login' ? 'Hesabına Giriş Yap' : 'Hesap Oluştur'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif' }}>
            {mode === 'login' ? 'Şikayetleri görüntülemek ve bildirmek için giriş yap.' : 'Ücretsiz hesap oluştur, şikayet bildir.'}
          </p>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 28, boxShadow: 'var(--shadow-sm)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="form-label" htmlFor="email">E-posta</label>
              <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="ornek@mail.com"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="password">Şifre</label>
              <input id="password" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              {mode === 'register' && <p style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif', marginTop: 4 }}>En az 6 karakter</p>}
            </div>

            {/* Errors */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: '#FDF0EE', border: '1px solid #F4C5BB', fontSize: 14, color: 'var(--chronic)', fontFamily: 'DM Sans, sans-serif' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding: '10px 12px', borderRadius: 8, background: '#F0FDF4', border: '1px solid #86EFAC', fontSize: 14, color: 'var(--resolved)', fontFamily: 'DM Sans, sans-serif' }}>
                {success}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center', height: 44, marginTop: 4 }} disabled={loading}>
              {loading ? <><div className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> İşleniyor…</> : <><Mail size={16} />{mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</>}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif' }}>veya</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', height: 44 }} onClick={handleGoogle}>
            <Globe size={16} />
            Google ile devam et
          </button>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif', marginTop: 20 }}>
            {mode === 'login' ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}{' '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              style={{ color: 'var(--accent)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>
              {mode === 'login' ? 'Kayıt ol' : 'Giriş yap'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function GirisPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',background:'var(--bg-2)'}} />}>
      <GirisPageInner />
    </Suspense>
  );
}
