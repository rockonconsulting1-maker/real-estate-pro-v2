import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ghl } from '@/lib/queryKeys';
import { conversationsService } from '@/lib/ghl/services/conversations';
import { contactsService } from '@/lib/ghl/services/contacts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Phone, ArrowLeft, Paperclip, MoreVertical, MessageSquare, Mail, MessageCircle } from 'lucide-react';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/states';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface ThreadViewProps {
  conversationId: string;
  isMobile?: boolean;
}

export function ThreadView({ conversationId, isMobile }: ThreadViewProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [channel, setChannel] = useState<number>(1); // 1=SMS, 2=Email, 4=WhatsApp
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mark as read when opening
  useEffect(() => {
    if (conversationId) {
      conversationsService.markRead(conversationId).then(() => {
        queryClient.invalidateQueries({ queryKey: ghl.conversations() });
      }).catch(console.error);
    }
  }, [conversationId, queryClient]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ghl.messages(conversationId),
    queryFn: () => conversationsService.messages(conversationId),
    refetchInterval: 15000, // Poll every 15s
  });

  const messages = data?.messages || [];
  
  // Try to get contact ID from messages or conversation list
  const { data: convsData } = useQuery({
    queryKey: ghl.conversations(),
    queryFn: () => conversationsService.list(),
    staleTime: 60000,
  });
  
  const conversation = convsData?.conversations?.find(c => c.id === conversationId);
  const contactId = conversation?.contactId || messages[0]?.contactId;

  const { data: contact } = useQuery({
    queryKey: ghl.contact(contactId!),
    queryFn: () => contactsService.get(contactId!),
    enabled: !!contactId,
    staleTime: 60000,
  });

  const sendMutation = useMutation({
    mutationFn: (body: string) => conversationsService.sendMessage(conversationId, {
      type: channel,
      message: body,
      ...(channel === 2 && subject ? { subject } : {})
    }),
    onMutate: async (newBody) => {
      await queryClient.cancelQueries({ queryKey: ghl.messages(conversationId) });
      const previous = queryClient.getQueryData(ghl.messages(conversationId));
      
      const optimisticMsg = {
        id: `temp-${Date.now()}`,
        type: channel,
        messageType: channel === 2 ? 'Email' : 'SMS',
        body: newBody,
        direction: 'outbound',
        status: 'pending',
        dateAdded: new Date().toISOString(),
        contactId: contactId || '',
        conversationId
      };
      
      queryClient.setQueryData(ghl.messages(conversationId), (old: any) => ({
        ...old,
        messages: [...(old?.messages || []), optimisticMsg]
      }));
      
      return { previous };
    },
    onError: (err, newBody, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ghl.messages(conversationId), context.previous);
      }
    },
    onSuccess: () => {
      setNewMessage('');
      setSubject('');
      queryClient.invalidateQueries({ queryKey: ghl.messages(conversationId) });
      queryClient.invalidateQueries({ queryKey: ghl.conversations() });
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMutation.mutate(newMessage);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="h-16 border-b flex items-center px-4">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-16 w-2/3 rounded-xl" />
          <Skeleton className="h-16 w-2/3 rounded-xl ml-auto" />
          <Skeleton className="h-16 w-2/3 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <ErrorState message="Failed to load messages" onRetry={() => refetch()} />
      </div>
    );
  }

  const getDayLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMM d, yyyy');
  };

  const contactName = contact?.firstName 
    ? `${contact.firstName} ${contact.lastName || ''}`
    : 'Unknown Contact';
  
  const contactInitials = contact?.firstName
    ? contact.firstName.substring(0, 2).toUpperCase()
    : '??';

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="h-16 border-b bg-surface flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => navigate('/conversations')} className="-ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Avatar className="cursor-pointer hover:opacity-80" onClick={() => contactId && navigate(`/contacts/${contactId}`)}>
            <AvatarFallback>{contactInitials}</AvatarFallback>
          </Avatar>
          <div className="cursor-pointer hover:underline" onClick={() => contactId && navigate(`/contacts/${contactId}`)}>
            <h3 className="font-semibold text-sm">{contactName}</h3>
            <p className="text-xs text-muted-foreground">{contact?.phone || contact?.email || 'No contact info'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => {
            if (contact?.phone) window.open(`tel:${contact.phone}`);
          }}>
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.reduce((acc: React.ReactNode[], msg, index, arr) => {
            const msgDate = new Date(msg.dateAdded);
            const prevMsg = arr[index - 1];
            
            // Add date divider if it's the first message or a different day than previous
            if (!prevMsg || !isSameDay(new Date(prevMsg.dateAdded), msgDate)) {
              acc.push(
                <div key={`div-${msg.id}`} className="flex justify-center my-4">
                  <span className="text-xs font-medium text-muted-foreground bg-muted/30 px-2 py-1 rounded-full">
                    {getDayLabel(msgDate)}
                  </span>
                </div>
              );
            }

            const isOutbound = msg.direction === 'outbound';
            const isEmail = msg.type === 2 || msg.messageType?.toLowerCase() === 'email';
            const isCall = msg.type === 3 || msg.messageType?.toLowerCase() === 'call';

            acc.push(
              <div 
                key={msg.id} 
                className={cn(
                  "flex flex-col max-w-[85%]",
                  isOutbound ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                {isCall ? (
                  <div className="bg-muted border rounded-xl p-3 flex items-center gap-3 text-sm w-full max-w-sm">
                    <div className="h-8 w-8 rounded-full bg-surface flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Call Logged</p>
                      <p className="text-muted-foreground text-xs">{msg.body}</p>
                    </div>
                  </div>
                ) : (
                  <div 
                    className={cn(
                      "px-4 py-2.5 rounded-2xl text-sm break-words whitespace-pre-wrap shadow-sm",
                      isOutbound 
                        ? "bg-brand text-brand-foreground rounded-tr-sm" 
                        : "bg-surface border text-foreground rounded-tl-sm",
                      isEmail && "w-full min-w-[250px]"
                    )}
                  >
                    {isEmail && msg.subject && (
                      <div className={cn("font-medium mb-1 pb-1 border-b", isOutbound ? "border-brand-foreground/20" : "border-border")}>
                        {msg.subject}
                      </div>
                    )}
                    {msg.body}
                  </div>
                )}
                <div className="flex items-center gap-1.5 mt-1 px-1">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {format(msgDate, 'h:mm a')}
                  </span>
                  {isOutbound && (
                    <span className={cn(
                      "text-[10px] capitalize font-medium",
                      msg.status === 'delivered' ? "text-success" : 
                      msg.status === 'failed' ? "text-destructive" : 
                      "text-muted-foreground"
                    )}>
                      • {msg.status}
                    </span>
                  )}
                  <span className="text-muted-foreground ml-1">
                    {msg.type === 1 ? <MessageSquare className="h-3 w-3" /> : 
                     msg.type === 2 ? <Mail className="h-3 w-3" /> : 
                     msg.type === 4 ? <MessageCircle className="h-3 w-3" /> : null}
                  </span>
                </div>
              </div>
            );
            return acc;
          }, [])
        )}
      </div>

      {/* Composer */}
      <div className="p-3 bg-surface border-t">
        <form onSubmit={handleSend} className="flex flex-col gap-2">
          {channel === 2 && (
            <Input 
              placeholder="Subject..." 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-transparent border-none focus-visible:ring-0 px-2 h-8 text-sm font-medium"
            />
          )}
          <div className="flex items-end gap-2 bg-muted/30 p-1 pl-2 rounded-xl border focus-within:ring-1 focus-within:ring-ring focus-within:border-brand">
            <Select value={channel.toString()} onValueChange={(v) => setChannel(parseInt(v))}>
              <SelectTrigger className="w-auto border-none bg-transparent shadow-none focus:ring-0 px-2 h-9">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  {channel === 1 ? <MessageSquare className="h-4 w-4" /> : 
                   channel === 2 ? <Mail className="h-4 w-4" /> : 
                   <MessageCircle className="h-4 w-4" />}
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1"><div className="flex items-center gap-2"><MessageSquare className="h-4 w-4"/> SMS</div></SelectItem>
                <SelectItem value="2"><div className="flex items-center gap-2"><Mail className="h-4 w-4"/> Email</div></SelectItem>
                <SelectItem value="4"><div className="flex items-center gap-2"><MessageCircle className="h-4 w-4"/> WhatsApp</div></SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex-1 relative py-1">
              <Textarea 
                placeholder={channel === 2 ? "Type an email..." : "Type a message..."} 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (newMessage.trim()) handleSend(e);
                  }
                }}
                className="min-h-[36px] max-h-[120px] resize-none bg-transparent border-none shadow-none focus-visible:ring-0 p-1 text-sm"
                rows={1}
              />
            </div>
            
            <div className="flex items-center gap-1 pb-1 pr-1">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button 
                type="submit" 
                size="icon" 
                className="h-8 w-8 rounded-full shrink-0 bg-brand text-brand-foreground hover:bg-brand/90" 
                disabled={!newMessage.trim() || sendMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

