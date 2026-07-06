import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ghl } from '@/lib/queryKeys';
import { conversationsService } from '@/lib/ghl/services/conversations';
import { Input } from '@/components/ui/input';
import { Search, Mail, MessageSquare, Phone, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/states';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useDebounce } from '@/hooks/use-query-helpers';

interface InboxListProps {
  selectedId?: string;
  isMobile?: boolean;
}

export function InboxList({ selectedId, isMobile }: InboxListProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState<string>('all');
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ghl.conversations({ search: debouncedSearch, channel }),
    queryFn: () => conversationsService.list({ 
      // Add any specific filters here if GHL API supports them, otherwise we might filter client-side
    }),
    refetchInterval: 15000, // Poll every 15s
  });

  const getChannelIcon = (type?: number) => {
    switch (type) {
      case 1: return <MessageSquare className="h-4 w-4" />; // SMS
      case 2: return <Mail className="h-4 w-4" />; // Email
      case 3: return <Phone className="h-4 w-4" />; // Call
      case 4: return <MessageCircle className="h-4 w-4" />; // FB/WhatsApp
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const conversations = data?.conversations || [];

  return (
    <div className="flex flex-col h-full bg-surface border-r">
      <div className="p-4 border-b space-y-4">
        <h2 className="text-page-title-desktop">Inbox</h2>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search conversations..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <ToggleGroup type="single" value={channel} onValueChange={(v) => { if (v) setChannel(v); }} className="justify-start">
          <ToggleGroupItem value="all" className="text-xs px-2 h-7">All</ToggleGroupItem>
          <ToggleGroupItem value="unread" className="text-xs px-2 h-7">Unread</ToggleGroupItem>
          <ToggleGroupItem value="sms" className="text-xs px-2 h-7">SMS</ToggleGroupItem>
          <ToggleGroupItem value="email" className="text-xs px-2 h-7">Email</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4">
            <ErrorState message="Failed to load conversations" onRetry={() => refetch()} />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p>No conversations found</p>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map(conv => (
              <div 
                key={conv.id}
                onClick={() => navigate(`/conversations/${conv.id}`)}
                className={cn(
                  "p-4 cursor-pointer hover:bg-muted/50 transition-colors flex gap-3",
                  selectedId === conv.id && "bg-muted",
                  conv.unreadCount && conv.unreadCount > 0 ? "bg-brand-soft/30" : ""
                )}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarFallback>{conv.id.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-surface rounded-full p-0.5 border">
                    {getChannelIcon(conv.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className={cn("text-sm truncate", conv.unreadCount && conv.unreadCount > 0 ? "font-semibold" : "font-medium")}>
                      {/* Name would ideally come from contact lookup, using ID for now if not populated */}
                      Contact {conv.contactId?.substring(0, 4)}
                    </h4>
                    {conv.lastMessageDate && (
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(conv.lastMessageDate), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <p className={cn(
                    "text-xs truncate", 
                    conv.unreadCount && conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                  )}>
                    {conv.lastMessageBody || 'No message'}
                  </p>
                </div>
                {conv.unreadCount && conv.unreadCount > 0 ? (
                  <Badge variant="default" className="ml-2 h-5 min-w-[20px] justify-center self-center rounded-full px-1">
                    {conv.unreadCount}
                  </Badge>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
