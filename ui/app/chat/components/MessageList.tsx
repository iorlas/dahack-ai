'use client';

import { useEffect, useRef, useState } from 'react';
import type { MessageResponse, User } from '../../../lib/api';
import { useMessageHistory } from '../../../lib/api';

interface MessageListProps {
  roomId: number;
  currentUser: User;
  messages: MessageResponse[];
  isLoading?: boolean;
}

function MessageBubble({
  message,
  isOwn,
  sender,
}: {
  message: MessageResponse;
  isOwn: boolean;
  sender: User;
}) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwn ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
        }`}
      >
        {!isOwn && <div className="text-xs font-medium mb-1 opacity-75">{sender.username}</div>}
        <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
        <div className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
          {formatTime(message.created_at)}
          {message.edited_at && <span className="ml-1 italic">(edited)</span>}
        </div>
      </div>
    </div>
  );
}

export default function MessageList({ roomId, currentUser, messages, isLoading }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Load message history
  const {
    data: historyData,
    isLoading: historyLoading,
    error,
  } = useMessageHistory(roomId, {
    limit: 50,
  });

  // Combine history messages with real-time messages, removing duplicates
  const allMessages = historyData?.messages || [];
  const messageMap = new Map();

  // Add history messages first
  allMessages.forEach((msg) => messageMap.set(msg.id, msg));

  // Add real-time messages, potentially overwriting history messages
  messages.forEach((msg) => messageMap.set(msg.id, msg));

  const sortedMessages = Array.from(messageMap.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (hasScrolledToBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, hasScrolledToBottom]);

  // Handle scroll events to determine if user is at bottom
  const handleScroll = () => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px tolerance

    setHasScrolledToBottom(isAtBottom);
    setShowScrollButton(!isAtBottom && sortedMessages.length > 0);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setHasScrolledToBottom(true);
      setShowScrollButton(false);
    }
  };

  if (historyLoading || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading messages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-red-500">Failed to load messages</div>
      </div>
    );
  }

  if (sortedMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>No messages yet</p>
          <p className="text-sm mt-1">Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto p-4 space-y-2"
        data-testid="messages-container"
      >
        {sortedMessages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.sender.id === currentUser.id}
            sender={message.sender}
          />
        ))}
      </div>

      {showScrollButton && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-all duration-200"
          data-testid="scroll-to-bottom"
          aria-label="Scroll to bottom"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
    </div>
  );
}
