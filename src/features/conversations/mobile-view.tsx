import React from 'react';

import { InboxList } from './components/inbox-list';
import { ThreadView } from './components/thread-view';

interface Props {
  selectedId?: string;
}

export function MobileConversationsView({ selectedId }: Props) {
  if (selectedId) {
    return (
      <div className="h-screen w-full bg-background fixed inset-0 z-50 flex flex-col">
        <ThreadView conversationId={selectedId} isMobile />
      </div>
    );
  }

  return (
    <>
      <div className="h-[calc(100vh-80px)]">
        <InboxList selectedId={selectedId} isMobile />
      </div>
    </>
  );
}
