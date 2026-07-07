import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { mlsPropertiesService } from '@/lib/ghl/services';
import { cleanCustomObjectFields } from '@/types/ghl';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/states';
import { ArrowLeft, Users } from 'lucide-react';
import { Money } from '@/components/shared/primitives';
import { PropertyTabs } from './property-tabs';
import { Badge } from '@/components/ui/badge';

export function MobilePropertyDetail({ id }: { id: string }) {
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
      <>
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </>
    );
  }

  if (error || !property) {
    return (
      <>
        <div className="p-4">
          <Button variant="ghost" onClick={() => navigate('/mls')} className="mb-4 -ml-4 text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <ErrorState message="Failed to load property details" onRetry={() => refetch()} />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-full pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-surface/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate('/mls')} className="-ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="font-semibold text-sm truncate max-w-[200px]">
            {property.name || 'Property Detail'}
          </div>
          <div className="w-9" /> {/* Spacer */}
        </div>

        {/* Hero Image */}
        <div className="aspect-[4/3] bg-muted relative">
          {property.property_images && property.property_images.length > 0 ? (
            <img src={property.property_images[0]} alt={property.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
          )}
          <div className="absolute top-3 right-3">
            <Badge variant={property.property_status === 'Active' ? 'default' : 'secondary'} className="shadow-sm">
              {property.property_status || 'Active'}
            </Badge>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 border-b bg-surface">
          <div className="text-2xl font-bold mb-1">
            <Money amount={property.property_price || 0} />
          </div>
          <h1 className="text-page-title-mobile leading-tight mb-1">{property.name || 'Unnamed Property'}</h1>
          <p className="text-muted-foreground text-body-mobile mb-4">
            {property.property_city}, {property.property_state} {property.property_zip}
          </p>
          
          <Button className="w-full">
            <Users className="h-4 w-4 mr-2" />
            Match to Buyers
          </Button>
        </div>

        {/* Specs Scroll */}
        <div className="p-4 border-b bg-surface overflow-x-auto">
          <div className="flex space-x-3 min-w-max pb-2">
            <SpecItem label="Beds" value={property.property_beds} />
            <SpecItem label="Baths" value={property.property_baths} />
            <SpecItem label="SqFt" value={property.property_sqft} />
            <SpecItem label="Lot" value={property.property_lot_size} />
            <SpecItem label="Built" value={property.property_year_built} />
            <SpecItem label="DOM" value={property.property_dom} />
            <SpecItem label="MLS#" value={property.property_mls_number} />
          </div>
        </div>

        {/* Tabs */}
        <div className="p-4">
          <PropertyTabs property={property} />
        </div>
      </div>
    </>
  );
}

function SpecItem({ label, value }: { label: string, value: any }) {
  return (
    <div className="bg-muted rounded-lg p-3 flex flex-col items-center justify-center min-w-[80px]">
      <span className="text-eyebrow text-muted-foreground">{label}</span>
      <span className="text-base font-semibold mt-1">{value || '-'}</span>
    </div>
  );
}
