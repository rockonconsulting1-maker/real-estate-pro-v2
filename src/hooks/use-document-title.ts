import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { NAVIGATION_ITEMS } from '@/lib/navigation';

export function useDocumentTitle() {
  const location = useLocation();

  useEffect(() => {
    // Find the current route name from navigation items
    let title = 'Real Estate Pro CRM';
    
    for (const group of NAVIGATION_ITEMS) {
      const item = group.items.find(i => 
        i.path === '/' ? location.pathname === '/' : location.pathname.startsWith(i.path)
      );
      if (item) {
        title = `${item.name} | Real Estate Pro`;
        break;
      }
    }

    document.title = title;
  }, [location]);
}
