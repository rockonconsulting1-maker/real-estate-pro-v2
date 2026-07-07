import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
} from "@/components/ui/carousel";
import { Badge } from '@/components/ui/badge';

export function MobileListingDetail() {
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
        <div className="p-4 space-y-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-[250px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <div className="p-4">
          <Button variant="ghost" onClick={() => navigate('/listings')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <ErrorState message="Failed to load listing details" onRetry={() => refetch()} />
        </div>
      </>
    );
  }

  const images = data.image_urls || (data.image_url ? [data.image_url] : []);

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden bg-background">
        <div className="flex items-center p-2 border-b shrink-0">
          <Button variant="ghost" size="icon" onClick={() => navigate('/listings')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 text-center font-semibold truncate px-2">
            {data.address || data.name || 'Unnamed Property'}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStageOpen(true)}>
                <ArrowRightLeft className="mr-2 h-4 w-4" /> Change Stage
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriceOpen(true)}>
                <DollarSign className="mr-2 h-4 w-4" /> Change Price
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex-1 overflow-y-auto">
          {images.length > 0 ? (
            <Carousel className="w-full">
              <CarouselContent>
                {images.map((img: string, i: number) => (
                  <CarouselItem key={i}>
                    <div className="aspect-[4/3] relative bg-muted">
                      <img src={img} alt={`Listing image ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          ) : (
            <div className="aspect-[4/3] bg-muted flex flex-col items-center justify-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
              <p>No images available</p>
            </div>
          )}

          <div className="p-4 space-y-4">
            <div className="flex items-center space-x-2">
              <StageDot stageId={data.listing_stage || 'new'} />
              <Badge variant="secondary">{data.listing_stage || 'Active'}</Badge>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-primary">
                <Money amount={data.list_price || 0} />
              </div>
              {data.mls_number && (
                <div className="text-sm text-muted-foreground mt-1">MLS: {data.mls_number}</div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 py-4 border-y">
              <div className="text-center">
                <div className="font-semibold">{data.beds || '-'}</div>
                <div className="text-xs text-muted-foreground uppercase">Beds</div>
              </div>
              <div className="text-center border-l">
                <div className="font-semibold">{data.baths || '-'}</div>
                <div className="text-xs text-muted-foreground uppercase">Baths</div>
              </div>
              <div className="text-center border-l">
                <div className="font-semibold">{data.sqft || '-'}</div>
                <div className="text-xs text-muted-foreground uppercase">Sqft</div>
              </div>
            </div>

            <ListingTabs listing={data} />
          </div>
        </div>
      </div>
      {editOpen && <ListingEditModal listing={data} open={editOpen} onOpenChange={setEditOpen} />}
      {stageOpen && <ChangeStageModal listing={data} open={stageOpen} onOpenChange={setStageOpen} />}
      {priceOpen && <ChangePriceModal listing={data} open={priceOpen} onOpenChange={setPriceOpen} />}
    </>
  );
}
