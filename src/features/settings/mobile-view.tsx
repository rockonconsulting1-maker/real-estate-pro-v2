import React from 'react';
import { MobileShell } from '@/components/mobile/shell';
import { ProfileTab } from './components/profile-tab';
import { NotificationsTab } from './components/notifications-tab';
import { DisplayTab } from './components/display-tab';
import IntegrationsTab from './components/integrations-tab';
import { DataTab } from './components/data-tab';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { User, Bell, Monitor, Key, Database } from 'lucide-react';

export function MobileSettingsView() {
  return (
    <MobileShell>
      <div className="p-4 space-y-6 pb-24">
        <Accordion type="multiple" defaultValue={['profile', 'integrations']} className="w-full space-y-4">
          <AccordionItem value="profile" className="border rounded-lg bg-card px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                  <User className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Profile & Account</div>
                  <div className="text-xs text-muted-foreground font-normal">Avatar, name, password</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <ProfileTab />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="notifications" className="border rounded-lg bg-card px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Notifications</div>
                  <div className="text-xs text-muted-foreground font-normal">Email preferences</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <NotificationsTab />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="display" className="border rounded-lg bg-card px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                  <Monitor className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Display</div>
                  <div className="text-xs text-muted-foreground font-normal">Theme, landing page</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <DisplayTab />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="integrations" className="border rounded-lg bg-card px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                  <Key className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Integrations</div>
                  <div className="text-xs text-muted-foreground font-normal">GHL API Connection</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <IntegrationsTab />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="data" className="border rounded-lg bg-card px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                  <Database className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Data & Account</div>
                  <div className="text-xs text-muted-foreground font-normal">Export, cache, sign out</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <DataTab />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </MobileShell>
  );
}
