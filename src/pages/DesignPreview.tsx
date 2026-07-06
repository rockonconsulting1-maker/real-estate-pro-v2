import React from 'react';
import { useTheme } from '@/app/theme-provider';
import { Button } from '@/components/ui/button';
import { Money, Countdown, Spark, Avatar, StageDot, TempBadge, RoleBadge, StatusChip } from '@/components/shared/primitives';
import { SkeletonRow, SkeletonCard, SkeletonKPI, EmptyState, ErrorState } from '@/components/shared/states';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

export default function DesignPreview() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground p-8 space-y-12 max-w-6xl mx-auto">
      <header className="flex justify-between items-center pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Design System Preview</h1>
          <p className="text-ink-2 mt-2">Tokens, Typography, and Shared Primitives</p>
        </div>
        <div className="flex gap-2">
          <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}>Light</Button>
          <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}>Dark</Button>
        </div>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold border-b border-border pb-2">Colors (OKLCH)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Background', class: 'bg-background text-foreground border border-border' },
            { label: 'Surface (Card)', class: 'bg-surface text-ink border border-border' },
            { label: 'Brand', class: 'bg-brand text-brand-foreground' },
            { label: 'Brand Soft', class: 'bg-brand-soft text-brand' },
            { label: 'Success', class: 'bg-success text-white' },
            { label: 'Success Soft', class: 'bg-success-soft text-success' },
            { label: 'Warning', class: 'bg-warning text-white' },
            { label: 'Danger', class: 'bg-destructive text-white' },
          ].map(c => (
            <div key={c.label} className={`p-4 rounded-lg flex items-center justify-center font-medium ${c.class}`}>
              {c.label}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold border-b border-border pb-2">Typography & Primitives</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-surface rounded-lg border border-border">
              <span className="text-ink-2 font-medium">Money (Standard)</span>
              <Money amount={1250000} className="text-lg font-bold" />
            </div>
            <div className="flex justify-between items-center p-4 bg-surface rounded-lg border border-border">
              <span className="text-ink-2 font-medium">Money (Compact)</span>
              <Money amount={1250000} compact className="text-lg font-bold" />
            </div>
            <div className="flex justify-between items-center p-4 bg-surface rounded-lg border border-border">
              <span className="text-ink-2 font-medium">Countdown</span>
              <Countdown targetDate={new Date(Date.now() + 86400000).toISOString()} />
            </div>
            <div className="flex justify-between items-center p-4 bg-surface rounded-lg border border-border">
              <span className="text-ink-2 font-medium">Countdown (Danger)</span>
              <Countdown targetDate={new Date(Date.now() + 3600000).toISOString()} />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-surface rounded-lg border border-border">
              <span className="text-ink-2 font-medium">Avatars</span>
              <div className="flex -space-x-2">
                <Avatar name="John Doe" className="border-2 border-surface" />
                <Avatar name="Sarah Smith" className="border-2 border-surface" />
                <Avatar name="Mike Johnson" className="border-2 border-surface" />
              </div>
            </div>
            <div className="flex justify-between items-center p-4 bg-surface rounded-lg border border-border">
              <span className="text-ink-2 font-medium">Sparkline</span>
              <Spark data={[10, 25, 15, 30, 22, 40, 35]} width={100} height={30} />
            </div>
            <div className="flex justify-between items-center p-4 bg-surface rounded-lg border border-border">
              <span className="text-ink-2 font-medium">Touch Target (Mobile)</span>
              <button className="touch-target bg-brand text-brand-foreground rounded-full">
                Tap
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold border-b border-border pb-2">Badges & Indicators</h2>
        <div className="flex flex-wrap gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-ink-3 uppercase tracking-wider">Stage Dots</h3>
            <div className="flex gap-3">
              <StageDot stage="new" />
              <StageDot stage="contacted" />
              <StageDot stage="engaged" />
              <StageDot stage="nurturing" />
              <StageDot stage="appt" />
              <StageDot stage="agreement" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-ink-3 uppercase tracking-wider">Temp Badges</h3>
            <div className="flex gap-3">
              <TempBadge temp="hot" />
              <TempBadge temp="warm" />
              <TempBadge temp="cold" />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-ink-3 uppercase tracking-wider">Roles</h3>
            <div className="flex gap-3">
              <RoleBadge role="buyer" />
              <RoleBadge role="seller" />
              <RoleBadge role="vendor" />
              <RoleBadge role="past" />
              <RoleBadge role="soi" />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-ink-3 uppercase tracking-wider">Status</h3>
            <div className="flex gap-3">
              <StatusChip status="success" label="Active" />
              <StatusChip status="warning" label="Pending" />
              <StatusChip status="destructive" label="Overdue" />
              <StatusChip status="neutral" label="Draft" />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold border-b border-border pb-2">States & Skeletons</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Skeletons</h3>
            <SkeletonKPI />
            <SkeletonCard />
            <div className="bg-surface border border-border rounded-lg p-4">
              <SkeletonRow />
              <SkeletonRow />
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Empty & Error</h3>
            <EmptyState 
              title="No contacts found" 
              description="Get started by adding your first contact or importing a list."
              action={<Button variant="outline">Add Contact</Button>}
            />
            <ErrorState onRetry={() => toast.success('Retried successfully')} />
          </div>
        </div>
      </section>

      <Toaster />
    </div>
  );
}
