'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCurrentUser } from '../../lib/api';
import ChatSidebar, { type ChatTarget } from './components/ChatSidebar';

export default function ChatPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedChat, setSelectedChat] = useState<ChatTarget | null>(null);

  const router = useRouter();
  const { data: user, isLoading: userLoading, error: userError } = useCurrentUser();

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');

    // Check if user has valid credentials
    if (!storedToken) {
      // No valid credentials, redirect to login
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

  const handleChatSelect = (target: ChatTarget) => {
    setSelectedChat(target);
  };

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
          <div className="flex-1 p-4" data-testid="message-area">
            {selectedChat ? (
              <div className="h-full flex flex-col">
                {/* Chat header */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
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
                <div className="flex-1 flex items-center justify-center" data-testid="messages-container">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <p>
                      Start a conversation{' '}
                      {selectedChat.type === 'contact' ? `with ${getChatTitle()}` : `in ${getChatTitle()}`}
                    </p>
                    <p className="text-sm mt-2">Messages will appear here</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 h-full flex items-center justify-center">
                <div>
                  <h3 className="text-lg font-medium mb-2">Welcome to DAHack AI Chat!</h3>
                  <p>Welcome {user?.username || 'User'}! Select a contact or room to start chatting.</p>
                </div>
              </div>
            )}
          </div>

          {/* Message input */}
          {selectedChat && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder={`Type a message ${selectedChat.type === 'contact' ? `to ${getChatTitle()}` : `in ${getChatTitle()}`}...`}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  data-testid="message-input"
                />
                <button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  data-testid="send-button"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
