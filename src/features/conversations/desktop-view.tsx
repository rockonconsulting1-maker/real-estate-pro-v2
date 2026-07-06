import React, { useState, useEffect } from 'react';
import { DesktopShell } from '@/components/desktop/shell';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { InboxList } from './components/inbox-list';
import { ThreadView } from './components/thread-view';
import { useNavigate } from 'react-router-dom';

interface Props {
  selectedId?: string;
}

export function DesktopConversationsView({ selectedId }: Props) {
  const navigate = useNavigate();

  const handleSelect = (id: string) => {
    navigate(`/conversations/${id}`);
  };

  return (
    <DesktopShell>
      <div className="h-full bg-background overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={35} minSize={25} maxSize={45}>
            <InboxList 
              selectedId={selectedId} 
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={65}>
            {selectedId ? (
              <ThreadView conversationId={selectedId} />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/10">
                <div className="text-center">
                  <p className="text-lg font-medium text-foreground">No conversation selected</p>
                  <p className="text-sm">Select a conversation from the inbox to view messages</p>
                </div>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </DesktopShell>
  );
}
