import { Lock, Unlock, WifiOff, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OwnershipStatus } from '@/hooks/useSongOwnership';

interface OwnershipBadgeProps {
  status: OwnershipStatus;
  offlinePlays?: number;
  previewSecondsRemaining?: number;
  className?: string;
  size?: 'sm' | 'md';
}

export function OwnershipBadge({ 
  status, 
  offlinePlays = 0, 
  previewSecondsRemaining = 0,
  className,
  size = 'sm'
}: OwnershipBadgeProps) {
  if (status === 'free') return null;

  const sizeClasses = size === 'sm' 
    ? 'text-[10px] px-1.5 py-0.5 gap-0.5' 
    : 'text-xs px-2 py-1 gap-1';

  const iconSize = size === 'sm' ? 10 : 12;

  const badges: Record<OwnershipStatus, { label: string; icon: React.ReactNode; color: string } | null> = {
    free: null,
    preview: {
      label: previewSecondsRemaining > 0 ? `${previewSecondsRemaining}s preview` : 'Preview',
      icon: <Clock size={iconSize} />,
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    },
    preview_used: {
      label: 'Locked',
      icon: <Lock size={iconSize} />,
      color: 'bg-destructive/20 text-destructive border-destructive/30'
    },
    owned: {
      label: 'Owned',
      icon: <Unlock size={iconSize} />,
      color: 'bg-green-500/20 text-green-400 border-green-500/30'
    },
    offline_ready: {
      label: `Offline (${offlinePlays})`,
      icon: <WifiOff size={iconSize} />,
      color: 'bg-primary/20 text-primary border-primary/30'
    }
  };

  const badge = badges[status];
  if (!badge) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        sizeClasses,
        badge.color,
        className
      )}
    >
      {badge.icon}
      {badge.label}
    </span>
  );
}
