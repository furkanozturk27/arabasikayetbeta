import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatKm(km: number): string {
  return new Intl.NumberFormat('tr-TR').format(km) + ' km';
}

export function getTrustLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Çok Güvenilir', color: 'text-emerald-400' };
  if (score >= 50) return { label: 'Güvenilir', color: 'text-blue-400' };
  if (score >= 20) return { label: 'Orta', color: 'text-amber-400' };
  return { label: 'Düşük', color: 'text-red-400' };
}

export function getSeverityColor(severity: number): string {
  if (severity >= 4) return 'text-red-400 bg-red-400/10 border-red-400/20';
  if (severity >= 3) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
  if (severity >= 2) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
  return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
}

export function getSeverityLabel(severity: number): string {
  if (severity >= 4) return 'Kritik';
  if (severity >= 3) return 'Ciddi';
  if (severity >= 2) return 'Orta';
  return 'Hafif';
}
