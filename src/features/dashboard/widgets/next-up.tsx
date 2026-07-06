import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ghl, STALE_TIMES } from '@/lib/queryKeys';
import { calendarsService } from '@/lib/ghl/services/calendars';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Countdown } from '@/components/shared/primitives';
import { format, addDays } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState } from '@/components/shared/states';

export function NextUpWidget() {
  const { data: events, isLoading, error, refetch } = useQuery({
    queryKey: ghl.events({ range: 'next-7d' }),
    queryFn: () => {
      const now = new Date();
      const nextWeek = addDays(now, 7);
      return calendarsService.eventsByRange(now.getTime().toString(), nextWeek.getTime().toString());
    },
    staleTime: STALE_TIMES.LIST,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-card-header">Next Up</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-card-header">Next Up</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState message="Failed to load appointment" onRetry={() => refetch()} />
        </CardContent>
      </Card>
    );
  }

  // Sort by start time ascending and get the first one
  const nextEvent = events?.slice().sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

  if (!nextEvent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-card-header">Next Up</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState 
            icon={CalendarIcon} 
            title="No upcoming appointments" 
            description="You have no appointments scheduled for the next 7 days."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-brand/20 bg-brand-soft/10">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-card-header text-brand">Next Up</CardTitle>
          <span className="px-2 py-1 bg-brand/10 text-brand text-[10px] uppercase tracking-wider font-semibold rounded-full">
            {nextEvent.title ? nextEvent.title.split(' ')[0] : 'Meeting'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-2xl font-bold tracking-tight">
            {String(nextEvent.title || 'Meeting')}
          </div>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <span className="mr-2">{format(new Date(nextEvent.startTime), 'h:mm a')}</span>
            <span>•</span>
            <span className="ml-2">In <Countdown targetDate={nextEvent.startTime} dangerThresholdHours={2} /></span>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          {nextEvent.contactId && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <Link to={`/contacts/${nextEvent.contactId}`} className="hover:underline font-medium bg-brand/5 text-brand px-2 py-0.5 rounded-full text-xs">
                View Client
              </Link>
            </div>
          )}
          {nextEvent.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{String(nextEvent.location)}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          {/* Desktop Actions */}
          <div className="hidden lg:flex gap-2 w-full">
            <Button variant="default" size="sm" className="w-full">Confirm</Button>
            <Button variant="outline" size="sm" className="w-full">Reschedule</Button>
          </div>
          {/* Mobile Actions */}
          <div className="flex lg:hidden gap-2 w-full">
            <Button variant="default" size="sm" className="flex-1" asChild>
              <a href={`tel:${nextEvent.phone || ''}`}>Call</a>
            </Button>
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <a href={`sms:${nextEvent.phone || ''}`}>Text</a>
            </Button>
            {nextEvent.location && (
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <a href={`https://maps.google.com/?q=${encodeURIComponent(String(nextEvent.location))}`} target="_blank" rel="noopener noreferrer">Dir</a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
