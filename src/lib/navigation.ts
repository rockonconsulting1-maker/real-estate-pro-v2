import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  Contact, 
  Home, 
  FileText, 
  ArrowRightLeft, 
  Building, 
  MessageSquare, 
  CalendarDays, 
  CheckSquare, 
  StickyNote, 
  Files, 
  BarChart3, 
  Users2, 
  Settings 
} from 'lucide-react';

export const NAVIGATION_ITEMS = [
  {
    group: 'Core',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Leads', path: '/leads', icon: Users },
      { name: 'Clients', path: '/clients', icon: UserSquare2 },
      { name: 'Contacts', path: '/contacts', icon: Contact },
    ]
  },
  {
    group: 'Properties',
    items: [
      { name: 'My Listings', path: '/listings', icon: Home },
      { name: 'Offers', path: '/offers', icon: FileText },
      { name: 'Transactions', path: '/transactions', icon: ArrowRightLeft },
      { name: 'MLS Properties', path: '/mls', icon: Building },
    ]
  },
  {
    group: 'Workspace',
    items: [
      { name: 'Conversations', path: '/conversations', icon: MessageSquare },
      { name: 'Calendar', path: '/calendar', icon: CalendarDays },
      { name: 'Tasks', path: '/tasks', icon: CheckSquare },
      { name: 'Notes', path: '/notes', icon: StickyNote },
      { name: 'Docs', path: '/docs', icon: Files },
    ]
  },
  {
    group: 'Management',
    items: [
      { name: 'Reports', path: '/reports', icon: BarChart3 },
      { name: 'Team', path: '/team', icon: Users2 },
      { name: 'Settings', path: '/settings', icon: Settings },
    ]
  }
];
