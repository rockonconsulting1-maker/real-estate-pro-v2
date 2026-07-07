import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { myListingsService } from '@/lib/ghl/services';
import { cleanCustomObjectFields } from '@/types/ghl';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Image as ImageIcon, MoreVertical, DollarSign, ArrowRightLeft } from 'lucide-react';
import { Money, StageDot } from '@/components/shared/primitives';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/states';
import { ListingTabs } from './listing-tabs';
import { ListingEditModal } from './listing-edit-modal';
import { ChangeStageModal, ChangePriceModal } from './listing-actions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from '@/components/ui/badge';

export function DesktopListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = React.useState(false);
  const [stageOpen, setStageOpen] = React.useState(false);
  const [priceOpen, setPriceOpen] = React.useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ghl.record('my_listings', id!),
    queryFn: async () => {
      const res = await myListingsService.get(id!);
      return cleanCustomObjectFields(res, 'my_listings');
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <div className="grid grid-cols-3 gap-6">
            <Skeleton className="h-[300px] col-span-2 rounded-xl" />
            <Skeleton className="h-[300px] rounded-xl" />
          </div>
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <div className="p-6">
          <Button variant="ghost" onClick={() => navigate('/listings')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Listings
          </Button>
          <ErrorState message="Failed to load listing details" onRetry={() => refetch()} />
        </div>
      </>
    );
  }

  const images = data.image_urls || (data.image_url ? [data.image_url] : []);

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden bg-muted/10">
        <div className="flex-none p-6 pb-0">
          <Button variant="ghost" onClick={() => navigate('/listings')} className="mb-4 -ml-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Listings
          </Button>
          
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <StageDot stageId={data.listing_stage || 'new'} />
                <Badge variant="secondary" className="text-sm">{data.listing_stage || 'Active'}</Badge>
                {data.mls_number && (
                  <span className="text-sm text-muted-foreground">MLS: {data.mls_number}</span>
                )}
              </div>
              <h1 className="text-3xl font-bold">{data.address || data.name || 'Unnamed Property'}</h1>
              <div className="text-2xl font-semibold mt-2 text-primary">
                <Money amount={data.list_price || 0} />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setEditOpen(true)}><Edit className="mr-2 h-4 w-4" /> Edit Listing</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setStageOpen(true)}>
                    <ArrowRightLeft className="mr-2 h-4 w-4" /> Change Stage
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriceOpen(true)}>
                    <DollarSign className="mr-2 h-4 w-4" /> Change Price
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-6">
          {/* Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {images.length > 0 ? (
                <Carousel className="w-full">
                  <CarouselContent>
                    {images.map((img: string, i: number) => (
                      <CarouselItem key={i}>
                        <div className="aspect-video relative rounded-xl overflow-hidden bg-muted">
                          <img src={img} alt={`Listing image ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {images.length > 1 && (
                    <>
                      <CarouselPrevious className="left-4" />
                      <CarouselNext className="right-4" />
                    </>
                  )}
                </Carousel>
              ) : (
                <div className="aspect-video bg-muted rounded-xl flex flex-col items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
                  <p>No images available</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-card border rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Property Specs</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <div className="text-sm text-muted-foreground">Bedrooms</div>
                    <div className="font-medium">{data.beds || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Bathrooms</div>
                    <div className="font-medium">{data.baths || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Square Feet</div>
                    <div className="font-medium">{data.sqft || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Property Type</div>
                    <div className="font-medium">{data.property_type || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Days on Market</div>
                    <div className="font-medium">{data.dom || '0'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Year Built</div>
                    <div className="font-medium">{data.year_built || '-'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ListingTabs listing={data} />
        </div>
      </div>
      {editOpen && <ListingEditModal listing={data} open={editOpen} onOpenChange={setEditOpen} />}
      {stageOpen && <ChangeStageModal listing={data} open={stageOpen} onOpenChange={setStageOpen} />}
      {priceOpen && <ChangePriceModal listing={data} open={priceOpen} onOpenChange={setPriceOpen} />}
    </>
  );
}
