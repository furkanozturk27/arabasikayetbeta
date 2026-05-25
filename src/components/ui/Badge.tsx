'use client';

import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'chronic' | 'common' | 'isolated' | 'success' | 'warning' | 'error';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-gray-800 text-gray-300 border-gray-700',
      chronic: 'bg-red-500/15 text-red-400 border-red-500/30',
      common: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      isolated: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      warning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
      error: 'bg-red-500/15 text-red-400 border-red-500/30',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';
