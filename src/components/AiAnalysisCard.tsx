'use client';

// AI Analysis feature is currently DISABLED.
// To re-enable:
//   1. Restore triggerAnalysis() call in useEffect when !initialAnalysis
//   2. Re-add "Claude AI Analizi" header and confidence score display
//   3. Re-enable the loading/error states
// The infrastructure (API endpoint, data model) remains fully intact.

import { Users, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const VERDICT_CONFIG = {
  chronic:    { label: 'Kronik Sorun',    cls: 'pill pill-chronic',   border: 'var(--chronic)',   bg: '#FDF7F6', Icon: AlertTriangle, iconColor: 'var(--chronic)' },
  common:     { label: 'Yaygın Sorun',    cls: 'pill pill-recurring', border: 'var(--recurring)', bg: '#FFFBF0', Icon: TrendingUp,    iconColor: 'var(--recurring)' },
  isolated:   { label: 'İzole Vaka',      cls: 'pill pill-info',      border: 'var(--info)',      bg: '#F0F5FF', Icon: Info,          iconColor: 'var(--info)' },
  user_error: { label: 'Kullanım Hatası', cls: 'pill pill-neutral',   border: 'var(--border)',    bg: 'var(--bg-2)', Icon: CheckCircle, iconColor: 'var(--text-3)' },
};

interface AiAnalysisCardProps {
  complaintId: string;
  initialAnalysis: any;
}

export function AiAnalysisCard({ complaintId, initialAnalysis }: AiAnalysisCardProps) {
  // Feature disabled: only render if an existing analysis is already stored
  if (!initialAnalysis) return null;

  const vc = VERDICT_CONFIG[initialAnalysis.verdict as keyof typeof VERDICT_CONFIG] || VERDICT_CONFIG.isolated;
  const { Icon } = vc;
  const similarCount = initialAnalysis.similar_complaint_ids?.length ?? 0;

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
          <Icon size={18} style={{ color: vc.iconColor }} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', fontFamily: 'DM Sans, sans-serif' }}>
              Analiz Sonucu
            </span>
            <span className={vc.cls}>{vc.label}</span>
          </div>
        </div>
      </div>

      {/* Social proof */}
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
        {initialAnalysis.summary}
      </p>

      {initialAnalysis.insights && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Teknik Notlar
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, fontFamily: 'DM Sans, sans-serif' }}>
            {initialAnalysis.insights}
          </p>
        </div>
      )}
    </div>
  );
}
