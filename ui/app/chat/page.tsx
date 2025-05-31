'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { type MessageResponse, useCurrentUser, useRooms } from '../../lib/api';
import { getChatRoomId } from '../../lib/chat-utils';
import { type WSIncomingMessage, useWebSocket } from '../../lib/websocket';
import ChatSidebar, { type ChatTarget } from './components/ChatSidebar';
import MessageInput from './components/MessageInput';
import MessageList from './components/MessageList';

export default function ChatPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedChat, setSelectedChat] = useState<ChatTarget | null>(null);
  const [realtimeMessages, setRealtimeMessages] = useState<MessageResponse[]>([]);
  const [wsError, setWsError] = useState<string | null>(null);

  const router = useRouter();
  const { data: user, isLoading: userLoading, error: userError } = useCurrentUser();
  const { data: roomsData } = useRooms();

  // WebSocket connection
  const handleWebSocketMessage = useCallback((message: WSIncomingMessage) => {
    if (message.type === 'message') {
      setRealtimeMessages((prev) => {
        // Check if message already exists to avoid duplicates
        const exists = prev.some((msg) => msg.id === message.message.id);
        if (exists) return prev;

        return [...prev, message.message];
      });
    } else if (message.type === 'error') {
      setWsError(message.error);
    } else if (message.type === 'success') {
      setWsError(null);
    }
  }, []);

  const handleWebSocketError = useCallback((error: string) => {
    setWsError(error);
  }, []);

  const {
    isConnected,
    isConnecting,
    error: wsConnectionError,
    subscribe,
    unsubscribe,
    sendChatMessage,
  } = useWebSocket(handleWebSocketMessage, handleWebSocketError);

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');

    // Check if user has valid credentials
    if (!storedToken) {
      router.push('/login');
      return;
    }

    setIsAuthenticated(true);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    // If we get an auth error, redirect to login
    if (userError?.message?.includes('401')) {
      localStorage.removeItem('username');
      localStorage.removeItem('access_token');
      router.push('/login');
    }
  }, [userError, router]);

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('access_token');
    router.push('/');
  };

  const handleChatSelect = useCallback(
    (target: ChatTarget) => {
      if (!user || !roomsData?.rooms) return;

      // Unsubscribe from previous room if any
      if (selectedChat) {
        const prevRoomId = getChatRoomId(selectedChat, user, roomsData.rooms);
        if (prevRoomId) {
          unsubscribe(prevRoomId);
        }
      }

      setSelectedChat(target);
      setRealtimeMessages([]); // Clear real-time messages when switching chats
      setWsError(null);

      // Subscribe to new room
      if (isConnected) {
        const roomId = getChatRoomId(target, user, roomsData.rooms);
        if (roomId) {
          subscribe(roomId);
        }
      }
    },
    [selectedChat, unsubscribe, subscribe, isConnected, user, roomsData?.rooms]
  );

  // Subscribe to room when WebSocket connects and we have a selected chat
  useEffect(() => {
    if (isConnected && selectedChat && user && roomsData?.rooms) {
      const roomId = getChatRoomId(selectedChat, user, roomsData.rooms);
      if (roomId) {
        subscribe(roomId);
      }
    }
  }, [isConnected, selectedChat, subscribe, user, roomsData?.rooms]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedChat || !isConnected || !user || !roomsData?.rooms) return;

      const roomId = getChatRoomId(selectedChat, user, roomsData.rooms);
      if (roomId) {
        sendChatMessage(roomId, content);
      }
    },
    [selectedChat, isConnected, sendChatMessage, user, roomsData?.rooms]
  );

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  const getChatTitle = () => {
    if (!selectedChat) return '';
    return selectedChat.type === 'contact'
      ? selectedChat.data.other_user.username
      : selectedChat.data.name || `Room ${selectedChat.data.id}`;
  };

  const getChatSubtitle = () => {
    if (!selectedChat) return '';
    return selectedChat.type === 'contact'
      ? `Contact since ${new Date(selectedChat.data.created_at).toLocaleDateString()}`
      : `${selectedChat.data.members.length} members`;
  };

  const getRoomId = () => {
    if (!selectedChat || !user || !roomsData?.rooms) return 0;
    return getChatRoomId(selectedChat, user, roomsData.rooms) || 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">DAHack AI Chat</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Connection status */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
                </span>
              </div>

              <span className="text-gray-700 dark:text-gray-300">Welcome, {user?.username || 'User'}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Error messages */}
      {(wsError || wsConnectionError) && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4">
          <div className="text-red-700 dark:text-red-300 text-sm">WebSocket Error: {wsError || wsConnectionError}</div>
        </div>
      )}

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar with Chat List */}
        <div
          className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
          data-testid="chat-sidebar"
        >
          <ChatSidebar onChatSelect={handleChatSelect} selectedChat={selectedChat} />
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col" data-testid="chat-interface">
          {selectedChat ? (
            <>
              {/* Chat header */}
              <div className="border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{getChatTitle()}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{getChatSubtitle()}</p>
                  </div>

                  {/* Room actions for multi-user rooms */}
                  {selectedChat.type === 'room' && (
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                        data-testid="room-info-button"
                      >
                        Room Info
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
                        data-testid="leave-room-button"
                      >
                        Leave Room
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages area */}
              {user && getRoomId() > 0 && (
                <MessageList roomId={getRoomId()} currentUser={user} messages={realtimeMessages} />
              )}

              {/* Message input */}
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={!isConnected || getRoomId() === 0}
                placeholder={`Type a message ${selectedChat.type === 'contact' ? `to ${getChatTitle()}` : `in ${getChatTitle()}`}...`}
              />
            </>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 h-full flex items-center justify-center">
              <div>
                <h3 className="text-lg font-medium mb-2">Welcome to DAHack AI Chat!</h3>
                <p>Welcome {user?.username || 'User'}! Select a contact or room to start chatting.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
