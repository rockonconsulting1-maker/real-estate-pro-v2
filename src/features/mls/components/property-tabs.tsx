import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Info, Users, File } from 'lucide-react';

export function PropertyTabs({ property }: { property: any }) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="mb-4 flex flex-wrap h-auto gap-1">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="showing">Showing</TabsTrigger>
        <TabsTrigger value="offers">Offers</TabsTrigger>
        <TabsTrigger value="buyers">Related Buyers</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-card-header flex items-center">
              <Info className="h-4 w-4 mr-2" />
              Public Remarks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-body-desktop whitespace-pre-wrap">
              {property.property_description || 'No description provided.'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-card-header">Features</CardTitle>
          </CardHeader>
          <CardContent>
            {property.property_features ? (
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(property.property_features) 
                  ? property.property_features 
                  : property.property_features.split(',')).map((feature: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-muted rounded text-sm">
                    {feature.trim()}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No features listed.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="showing">
        <Card>
          <CardHeader>
            <CardTitle className="text-card-header flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Showing Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-body-desktop whitespace-pre-wrap">
              {property.property_showing_instructions || 'No showing instructions provided.'}
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="offers">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <p>Associated offers will appear here.</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="buyers">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Matched buyers will appear here.</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="documents">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Property documents will appear here.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
