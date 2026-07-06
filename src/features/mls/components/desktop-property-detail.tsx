import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { mlsPropertiesService } from '@/lib/ghl/services';
import { cleanCustomObjectFields } from '@/types/ghl';
import { DesktopShell } from '@/components/desktop/shell';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/states';
import { ArrowLeft, Users } from 'lucide-react';
import { Money } from '@/components/shared/primitives';
import { PropertyTabs } from './property-tabs';
import { Badge } from '@/components/ui/badge';

export function DesktopPropertyDetail({ id }: { id: string }) {
  const navigate = useNavigate();

  const { data: property, isLoading, error, refetch } = useQuery({
    queryKey: ghl.record('properties', id),
    queryFn: async () => {
      const res = await mlsPropertiesService.get(id);
      return cleanCustomObjectFields(res, 'properties');
    }
  });

  if (isLoading) {
    return (
      <DesktopShell>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
      </DesktopShell>
    );
  }

  if (error || !property) {
    return (
      <DesktopShell>
        <div className="p-6">
          <Button variant="ghost" onClick={() => navigate('/mls')} className="mb-4 -ml-4 text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to MLS
          </Button>
          <ErrorState message="Failed to load property details" onRetry={() => refetch()} />
        </div>
      </DesktopShell>
    );
  }

  return (
    <DesktopShell>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b bg-surface px-6 py-4 flex-shrink-0">
          <Button variant="ghost" onClick={() => navigate('/mls')} className="mb-4 -ml-4 text-muted-foreground h-8">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to MLS
          </Button>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-1">
                <h1 className="text-page-title-desktop truncate">{property.name || 'Unnamed Property'}</h1>
                <Badge variant={property.property_status === 'Active' ? 'default' : 'secondary'}>
                  {property.property_status || 'Active'}
                </Badge>
              </div>
              <p className="text-muted-foreground text-body-desktop">
                {property.property_city}, {property.property_state} {property.property_zip}
              </p>
              <div className="text-2xl font-bold mt-2">
                <Money amount={property.property_price || 0} />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button>
                <Users className="h-4 w-4 mr-2" />
                Match to Buyers
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Hero Image */}
            <div className="aspect-[21/9] bg-muted rounded-xl overflow-hidden border">
              {property.property_images && property.property_images.length > 0 ? (
                <img src={property.property_images[0]} alt={property.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image Available</div>
              )}
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <SpecItem label="Beds" value={property.property_beds} />
              <SpecItem label="Baths" value={property.property_baths} />
              <SpecItem label="SqFt" value={property.property_sqft} />
              <SpecItem label="Lot Size" value={property.property_lot_size} />
              <SpecItem label="Year Built" value={property.property_year_built} />
              <SpecItem label="DOM" value={property.property_dom} />
              <SpecItem label="MLS#" value={property.property_mls_number} />
            </div>

            {/* Tabs */}
            <PropertyTabs property={property} />
          </div>
        </div>
      </div>
    </DesktopShell>
  );
}

function SpecItem({ label, value }: { label: string, value: any }) {
  return (
    <div className="bg-surface border rounded-lg p-4 flex flex-col items-center justify-center text-center">
      <span className="text-meta uppercase">{label}</span>
      <span className="text-lg font-semibold mt-1">{value || '-'}</span>
    </div>
  );
}
