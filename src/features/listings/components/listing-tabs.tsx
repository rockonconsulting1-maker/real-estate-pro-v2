import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { associationsService } from '@/lib/ghl/services';

export function ListingTabs({ listing }: { listing: any }) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto rounded-none border-b bg-transparent p-0 h-auto">
        <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3">Overview</TabsTrigger>
        <TabsTrigger value="offers" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3">Offers</TabsTrigger>
        <TabsTrigger value="showings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3">Showings</TabsTrigger>
        <TabsTrigger value="marketing" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3">Marketing</TabsTrigger>
        <TabsTrigger value="documents" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3">Documents</TabsTrigger>
        <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3">Notes & Tasks</TabsTrigger>
        <TabsTrigger value="seller" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3">Seller</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="pt-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Public Remarks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {listing.public_remarks || 'No public remarks available.'}
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="offers" className="pt-4">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Offers integration pending.
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="showings" className="pt-4">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Showings calendar integration pending.
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="marketing" className="pt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Marketing Stats</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-muted p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold">{listing.views || 0}</div>
                  <div className="text-xs text-muted-foreground uppercase">Views</div>
                </div>
                <div className="bg-muted p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold">{listing.saves || 0}</div>
                  <div className="text-xs text-muted-foreground uppercase">Saves</div>
                </div>
             </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="documents" className="pt-4">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Documents integration pending.
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notes" className="pt-4">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Notes & Tasks integration pending.
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="seller" className="pt-4">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Seller association integration pending.
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
