import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Search, Bell, Plus, Menu, ChevronLeft, ChevronRight, LogOut, User, Settings as SettingsIcon } from 'lucide-react';
import { NAVIGATION_ITEMS } from '@/lib/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { GlobalSearch } from '@/components/shared/global-search';
import { NotificationsFeed } from '@/components/shared/notifications-feed';
import { useQuickAdd } from '@/components/shared/quick-add';

export function DesktopShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('rc-crm-sidebar-collapsed');
    return saved === 'true';
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const { openModal } = useQuickAdd();

  useEffect(() => {
    localStorage.setItem('rc-crm-sidebar-collapsed', isCollapsed.toString());
  }, [isCollapsed]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-border bg-surface transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          {!isCollapsed && <span className="font-bold text-lg text-brand">Real Estate Pro</span>}
          {isCollapsed && <span className="font-bold text-lg text-brand mx-auto">RE</span>}
        </div>

        <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
          {NAVIGATION_ITEMS.map((group, i) => (
            <div key={i} className="mb-6 px-2">
              {!isCollapsed && (
                <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.group}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-brand/10 text-brand'
                          : 'text-foreground hover:bg-muted hover:text-foreground'
                      } ${isCollapsed ? 'justify-center' : ''}`
                    }
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-2 border-t border-border flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex justify-center"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
          <div className="flex flex-1 items-center gap-6">
            <div className="flex items-center text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {NAVIGATION_ITEMS.flatMap(g => g.items).find(i => 
                  i.path === '/' ? location.pathname === '/' : location.pathname.startsWith(i.path)
                )?.name || 'Dashboard'}
              </span>
            </div>
            <div className="relative w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search everywhere..."
                className="w-full bg-background pl-9"
                onFocus={() => setSearchOpen(true)}
                readOnly
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Quick Add</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => openModal('lead')}>New Lead</DropdownMenuItem>
                <DropdownMenuItem onClick={() => openModal('client')}>New Client</DropdownMenuItem>
                <DropdownMenuItem onClick={() => openModal('contact')}>New Contact</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openModal('listing')}>New Listing</DropdownMenuItem>
                <DropdownMenuItem onClick={() => openModal('offer')}>New Offer</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openModal('task')}>New Task</DropdownMenuItem>
                <DropdownMenuItem onClick={() => openModal('note')}>New Note</DropdownMenuItem>
                <DropdownMenuItem onClick={() => openModal('event')}>New Event</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0 h-[400px] flex flex-col">
                <NotificationsFeed />
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt="User" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive-soft">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-background p-6">
          {children}
        </div>
      </main>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
