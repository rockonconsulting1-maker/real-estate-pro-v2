import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Avatar as BaseAvatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Typography + Formatting
export function Money({ amount, compact = false, className = '' }: { amount: number; compact?: boolean; className?: string }) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2,
  }).format(amount);

  return <span className={`tabular-nums font-mono ${className}`}>{formatted}</span>;
}

export function Countdown({ targetDate, dangerThresholdHours = 24, className = '' }: { targetDate: Date | string; dangerThresholdHours?: number; className?: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isDanger, setIsDanger] = useState(false);

  useEffect(() => {
    const target = new Date(targetDate).getTime();
    
    const update = () => {
      const now = new Date().getTime();
      const diff = target - now;
      
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        setIsDanger(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      setIsDanger(hours < dangerThresholdHours);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate, dangerThresholdHours]);

  return (
    <span className={`tabular-nums font-mono ${isDanger ? 'text-destructive' : 'text-ink-2'} ${className}`}>
      {timeLeft}
    </span>
  );
}

// Sparkline
export function Spark({ data, color = 'var(--brand)', width = 60, height = 24 }: { data: number[]; color?: string; width?: number; height?: number }) {
  const chartData = data.map((v, i) => ({ value: v, index: i }));
  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Avatar
export function Avatar({ src, name, className = '' }: { src?: string; name: string; className?: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  return (
    <BaseAvatar className={className}>
      <AvatarImage src={src} alt={name} />
      <AvatarFallback className="bg-brand-soft text-brand font-medium">{initials}</AvatarFallback>
    </BaseAvatar>
  );
}

// Badges & Indicators
import { PipelineRegistry } from '@/lib/pipeline-registry';

export function StageDot({ stage, stageId, color, className = '' }: { stage?: 'new' | 'contacted' | 'engaged' | 'nurturing' | 'appt' | 'agreement'; stageId?: string; color?: string; className?: string }) {
  if (color) {
    return <span className={`inline-block w-2.5 h-2.5 rounded-full ${className}`} style={{ backgroundColor: color.startsWith('var') ? color : color }} />;
  }

  let colorClass = 'bg-stage-new'; // Default fallback
  
  if (stageId) {
    const pipelineStage = PipelineRegistry.getStage(stageId);
    // You could map pipelineStage.color here if it's provided, otherwise fallback based on position
    if (pipelineStage) {
      const pos = pipelineStage.position || 0;
      if (pos === 0) colorClass = 'bg-stage-new';
      else if (pos === 1) colorClass = 'bg-stage-contacted';
      else if (pos === 2) colorClass = 'bg-stage-engaged';
      else if (pos === 3) colorClass = 'bg-stage-nurturing';
      else if (pos === 4) colorClass = 'bg-stage-appt';
      else colorClass = 'bg-stage-agreement';
    }
  } else if (stage) {
    const colors = {
      new: 'bg-stage-new',
      contacted: 'bg-stage-contacted',
      engaged: 'bg-stage-engaged',
      nurturing: 'bg-stage-nurturing',
      appt: 'bg-stage-appt',
      agreement: 'bg-stage-agreement',
    };
    colorClass = colors[stage] || colorClass;
  }
  
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${colorClass} ${className}`} />;
}

export function TempBadge({ temp }: { temp: 'hot' | 'warm' | 'cold' }) {
  const styles = {
    hot: 'bg-destructive-soft text-destructive border-destructive/20',
    warm: 'bg-warning-soft text-warning border-warning/20',
    cold: 'bg-info-soft text-info border-info/20',
  };
  return <Badge variant="outline" className={`capitalize font-medium ${styles[temp]}`}>{temp}</Badge>;
}

export function RoleBadge({ role }: { role: 'buyer' | 'seller' | 'investor' | 'vendor' | 'agent' | 'past' | 'soi' }) {
  const styles: Record<string, string> = {
    buyer: 'bg-role-buyer-soft text-role-buyer-ink',
    seller: 'bg-role-seller-soft text-role-seller-ink',
    past: 'bg-role-past-soft text-role-past-ink',
    vendor: 'bg-role-vendor-soft text-role-vendor-ink',
    soi: 'bg-role-soi-soft text-role-soi-ink',
    investor: 'bg-role-buyer-soft text-role-buyer-ink', // fallback
    agent: 'bg-role-vendor-soft text-role-vendor-ink', // fallback
  };
  const style = styles[role.toLowerCase()] || 'bg-surface text-ink-2 border-border';
  
  return (
    <span className={`px-2 py-0.5 text-[10.5px] font-semibold tracking-[0.06em] uppercase rounded-full flex items-center gap-1.5 w-max ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {role}
    </span>
  );
}

export function StatusChip({ status, label }: { status: 'success' | 'warning' | 'destructive' | 'info' | 'neutral'; label: string }) {
  const styles = {
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    destructive: 'bg-destructive-soft text-destructive',
    info: 'bg-info-soft text-info',
    neutral: 'bg-bg-sunk text-ink-2',
  };
  return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status]}`}>{label}</span>;
}
