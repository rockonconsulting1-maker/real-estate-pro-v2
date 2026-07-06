import React from 'react';
import { AlertCircle, FileX2, RefreshCcw } from 'lucide-react';
import { Skeleton as BaseSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export function SkeletonRow() {
  return (
    <div className="flex items-center space-x-4 py-3">
      <BaseSkeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <BaseSkeleton className="h-4 w-[200px]" />
        <BaseSkeleton className="h-3 w-[150px]" />
      </div>
      <BaseSkeleton className="h-8 w-16 rounded-md" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="border border-border rounded-lg p-4 space-y-4 bg-surface">
      <div className="flex justify-between items-center">
        <BaseSkeleton className="h-5 w-[120px]" />
        <BaseSkeleton className="h-5 w-5 rounded-full" />
      </div>
      <div className="space-y-2">
        <BaseSkeleton className="h-4 w-full" />
        <BaseSkeleton className="h-4 w-[80%]" />
      </div>
      <div className="pt-2 flex justify-between">
        <BaseSkeleton className="h-8 w-[100px]" />
        <BaseSkeleton className="h-8 w-[80px]" />
      </div>
    </div>
  );
}

export function SkeletonKPI() {
  return (
    <div className="border border-border rounded-lg p-5 bg-surface">
      <BaseSkeleton className="h-4 w-[100px] mb-2" />
      <BaseSkeleton className="h-8 w-[140px] mb-4" />
      <BaseSkeleton className="h-3 w-[180px]" />
    </div>
  );
}

export function EmptyState({ 
  icon: Icon = FileX2, 
  title, 
  description, 
  action 
}: { 
  icon?: any; 
  title: string; 
  description: string; 
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-lg bg-surface/50 min-h-[300px]">
      <div className="w-12 h-12 rounded-full bg-border flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-ink-3" />
      </div>
      <h3 className="text-lg font-medium text-ink mb-1">{title}</h3>
      <p className="text-sm text-ink-3 max-w-[300px] mb-6">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({ 
  message = "Something went wrong loading this data.", 
  onRetry 
}: { 
  message?: string; 
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center border border-destructive/20 rounded-lg bg-destructive-soft">
      <AlertCircle className="w-8 h-8 text-destructive mb-3" />
      <h3 className="text-base font-medium text-ink mb-1">Error Loading Data</h3>
      <p className="text-sm text-ink-2 mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCcw className="w-4 h-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
