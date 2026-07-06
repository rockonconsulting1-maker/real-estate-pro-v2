import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, UserSquare2, CalendarDays, Menu, Plus } from 'lucide-react';
import { MoreSheet } from './more-sheet';
import { FabPicker } from './fab-picker';

const TAB_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Leads', path: '/leads', icon: Users },
  { name: 'Clients', path: '/clients', icon: UserSquare2 },
  { name: 'Calendar', path: '/calendar', icon: CalendarDays },
];

export function MobileShell({ children }: { children: React.ReactNode }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-background overflow-hidden relative">
      {/* Main Content Area */}
      <main className="flex-1 overflow-auto pb-[calc(60px+env(safe-area-inset-bottom))]">
        {children}
      </main>

      {/* FAB */}
      <div className="absolute bottom-[92px] right-[18px] z-40">
        <button
          onClick={() => setFabOpen(true)}
          className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-foreground text-background shadow-2 active:scale-[0.96] transition-transform touch-target"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* TabBar */}
      <nav className="absolute bottom-0 w-full border-t border-border bg-background/80 backdrop-blur-[14px] pb-[env(safe-area-inset-bottom)] z-50">
        <div className="flex h-[60px] items-center justify-around px-2">
          {TAB_ITEMS.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center justify-center w-16 h-full touch-target ${
                  isActive ? 'text-brand' : 'text-muted-foreground'
                }`}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </NavLink>
            );
          })}
          
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center justify-center w-16 h-full touch-target text-muted-foreground`}
          >
            <Menu className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
      <FabPicker open={fabOpen} onOpenChange={setFabOpen} />
    </div>
  );
}
