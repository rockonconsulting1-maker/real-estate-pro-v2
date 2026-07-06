import React from 'react';
import { useTheme } from '@/app/theme-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function DisplayTab() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how Real Estate Pro looks on your device.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label>Theme</Label>
            <RadioGroup defaultValue={theme} onValueChange={(v: any) => setTheme(v)} className="grid grid-cols-3 gap-4">
              <div>
                <RadioGroupItem value="light" id="light" className="peer sr-only" />
                <Label
                  htmlFor="light"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <div className="w-full h-20 bg-white rounded border mb-3 flex flex-col gap-2 p-2">
                    <div className="h-2 w-1/3 bg-gray-200 rounded" />
                    <div className="h-2 w-full bg-gray-100 rounded" />
                    <div className="h-2 w-full bg-gray-100 rounded" />
                  </div>
                  Light
                </Label>
              </div>
              <div>
                <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                <Label
                  htmlFor="dark"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <div className="w-full h-20 bg-slate-950 rounded border border-slate-800 mb-3 flex flex-col gap-2 p-2">
                    <div className="h-2 w-1/3 bg-slate-800 rounded" />
                    <div className="h-2 w-full bg-slate-900 rounded" />
                    <div className="h-2 w-full bg-slate-900 rounded" />
                  </div>
                  Dark
                </Label>
              </div>
              <div>
                <RadioGroupItem value="system" id="system" className="peer sr-only" />
                <Label
                  htmlFor="system"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <div className="w-full h-20 bg-gradient-to-br from-white to-slate-950 rounded border mb-3 flex flex-col gap-2 p-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/50 mix-blend-multiply" />
                  </div>
                  System
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Default Landing Page</Label>
            <Select defaultValue="dashboard">
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Select page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dashboard">Dashboard</SelectItem>
                <SelectItem value="leads">Leads</SelectItem>
                <SelectItem value="clients">Clients</SelectItem>
                <SelectItem value="calendar">Calendar</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">The page that loads when you first sign in.</p>
          </div>

          <div className="space-y-2">
            <Label>Default Calendar View</Label>
            <Select defaultValue="week">
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="agenda">Agenda</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
