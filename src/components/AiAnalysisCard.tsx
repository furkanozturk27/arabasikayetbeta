'use client';

import { useState, useEffect } from 'react';
import { Brain, Users, Loader, AlertTriangle, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const VERDICT_CONFIG = {
  chronic:    { label: 'Kronik Sorun',    cls: 'pill pill-chronic',   border: 'var(--chronic)',   bg: '#FDF7F6', icon: '🚨' },
  common:     { label: 'Yaygın Sorun',    cls: 'pill pill-recurring', border: 'var(--recurring)', bg: '#FFFBF0', icon: '⚠️' },
  isolated:   { label: 'İzole Vaka',      cls: 'pill pill-info',      border: 'var(--info)',      bg: '#F0F5FF', icon: '🔍' },
  user_error: { label: 'Kullanım Hatası', cls: 'pill pill-neutral',   border: 'var(--border)',    bg: 'var(--bg-2)', icon: '💡' },
};

interface AiAnalysisCardProps {
  complaintId: string;
  initialAnalysis: any;
}

export function AiAnalysisCard({ complaintId, initialAnalysis }: AiAnalysisCardProps) {
  const [analysis, setAnalysis] = useState<any>(initialAnalysis);
  const [loading, setLoading] = useState(!initialAnalysis);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!initialAnalysis) {
      triggerAnalysis();
    }
  }, [complaintId, initialAnalysis]);

  async function triggerAnalysis() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaintId }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'AI analizi gerçekleştirilemedi.');
      }
      setAnalysis(result.analysis);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Loader className="spinner" size={16} style={{ color: 'var(--accent)' }} />
        <span style={{ fontSize: 14, color: 'var(--text-2)', fontFamily: 'DM Sans, sans-serif' }}>
          AI analizi yapılıyor. Lütfen bekleyin…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ marginBottom: 24, border: '1px solid var(--red)', background: 'var(--red-bg)', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <AlertTriangle size={18} style={{ color: 'var(--red)' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--red)', fontFamily: 'DM Sans, sans-serif' }}>
            AI Analiz Hatası
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: 'DM Sans, sans-serif', marginBottom: 12 }}>
          {error}
        </p>
        <button className="btn btn-secondary btn-sm" onClick={triggerAnalysis} style={{ gap: 6 }}>
          <RotateCcw size={12} /> Yeniden Dene
        </button>
      </div>
    );
  }

  if (!analysis) return null;

  const vc = VERDICT_CONFIG[analysis.verdict as keyof typeof VERDICT_CONFIG] || VERDICT_CONFIG.isolated;
  const similarCount = analysis.similar_complaint_ids?.length ?? 0;

  return (
    <div style={{
      border: `1.5px solid ${vc.border}`,
      borderRadius: 14,
      padding: 20,
      background: vc.bg,
      marginBottom: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: '#fff', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Brain size={18} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', fontFamily: 'DM Sans, sans-serif' }}>
              Claude AI Analizi
            </span>
            <span className={vc.cls}>{vc.icon} {vc.label}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'DM Mono, monospace', marginTop: 2 }}>
            Güven: %{Math.round(analysis.confidence_score * 100)}
          </div>
        </div>
      </div>

      {/* Sosyal kanıt */}
      {similarCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 8,
          background: '#fff', border: '1px solid var(--border)',
          marginBottom: 12,
        }}>
          <Users size={14} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', fontFamily: 'DM Sans, sans-serif' }}>
            {similarCount} kişi daha aynı sorunu yaşadı
          </span>
        </div>
      )}

      <p style={{ fontSize: 15, color: 'var(--text-1)', marginBottom: 12, lineHeight: 1.6, fontFamily: 'DM Sans, sans-serif' }}>
        {analysis.summary}
      </p>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Teknik Analiz
        </p>
        <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, fontFamily: 'DM Sans, sans-serif' }}>
          {analysis.insights}
        </p>
      </div>
    </div>
  );
}
