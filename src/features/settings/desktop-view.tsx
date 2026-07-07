import React from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';

import { ProfileTab } from './components/profile-tab';
import { NotificationsTab } from './components/notifications-tab';
import { DisplayTab } from './components/display-tab';
import IntegrationsTab from './components/integrations-tab';
import { DataTab } from './components/data-tab';
import { User, Bell, Monitor, Key, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: 'profile', label: 'Profile & Account', icon: User },
  { path: 'notifications', label: 'Notifications', icon: Bell },
  { path: 'display', label: 'Display', icon: Monitor },
  { path: 'integrations', label: 'Integrations', icon: Key },
  { path: 'data', label: 'Data', icon: Database },
];

export function DesktopSettingsView() {
  const location = useLocation();

  return (
    <>
      <div className="p-8 max-w-7xl mx-auto flex gap-12">
        <aside className="w-64 shrink-0">
          <div className="sticky top-8 space-y-6">
            <div>
              <h1 className="text-page-title-desktop">Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage your account settings and preferences.</p>
            </div>
            
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname.includes(`/settings/${item.path}`);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="flex-1 min-w-0 pb-12">
          <Routes>
            <Route path="profile" element={<ProfileTab />} />
            <Route path="notifications" element={<NotificationsTab />} />
            <Route path="display" element={<DisplayTab />} />
            <Route path="integrations" element={<IntegrationsTab />} />
            <Route path="data" element={<DataTab />} />
            <Route path="*" element={<Navigate to="profile" replace />} />
          </Routes>
        </main>
      </div>
    </>
  );
}
