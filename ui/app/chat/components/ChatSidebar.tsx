'use client';

import { MessageSquare, Plus, Search, User, UserPlus, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  type ContactResponse,
  type InvitationResponse,
  type RoomResponse,
  useAcceptInvitation,
  useContacts,
  useCreateRoom,
  useRejectInvitation,
  useRooms,
  useSendInvitation,
} from '../../../lib/api';

export type ChatTarget = { type: 'contact'; data: ContactResponse } | { type: 'room'; data: RoomResponse };

interface ChatSidebarProps {
  onChatSelect?: (target: ChatTarget) => void;
  selectedChat?: ChatTarget | null;
}

export default function ChatSidebar({ onChatSelect, selectedChat }: ChatSidebarProps) {
  const [activeTab, setActiveTab] = useState<'contacts' | 'rooms'>('contacts');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newContactUsername, setNewContactUsername] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [roomMembers, setRoomMembers] = useState('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const { data: contactsData, isLoading: contactsLoading, error: contactsError } = useContacts();
  const { data: roomsData, isLoading: roomsLoading } = useRooms();
  const sendInvitation = useSendInvitation();
  const acceptInvitation = useAcceptInvitation();
  const rejectInvitation = useRejectInvitation();
  const createRoom = useCreateRoom();

  const contacts = contactsData?.contacts || [];
  const receivedInvitations = contactsData?.received_invitations || [];
  const rooms = roomsData?.rooms || [];

  // Debug logging
  useEffect(() => {
    console.log('Contacts data:', contactsData);
    console.log('Received invitations:', receivedInvitations);
    console.log('Contacts error:', contactsError);
  }, [contactsData, receivedInvitations, contactsError]);

  const filteredContacts = contacts.filter((contact) =>
    contact.other_user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInvitations = receivedInvitations.filter((invitation) =>
    invitation.from_user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRooms = rooms.filter((room) => room.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddContact = useCallback(async () => {
    if (!newContactUsername.trim()) {
      setError('Please enter a username');
      return;
    }

    setError('');
    setSuccess('');

    try {
      await sendInvitation.mutateAsync({ username: newContactUsername });
      setSuccess(`Contact invitation sent to ${newContactUsername}`);
      setNewContactUsername('');
      setShowAddContact(false);
    } catch (error: any) {
      if (error.message.includes('yourself')) {
        setError('You cannot add yourself as a contact');
      } else if (error.message.includes('not found')) {
        setError('User not found');
      } else if (error.message.includes('already')) {
        setError('User is already in your contacts');
      } else {
        setError(error.message || 'Failed to send contact invitation');
      }
    }
  }, [newContactUsername, sendInvitation]);

  const handleCreateRoom = useCallback(async () => {
    if (!newRoomName.trim()) {
      setError('Please enter a room name');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const memberUsernames = roomMembers
        .split(',')
        .map((u) => u.trim())
        .filter((u) => u.length > 0);

      await createRoom.mutateAsync({
        name: newRoomName,
        member_usernames: memberUsernames.length > 0 ? memberUsernames : undefined,
      });

      setSuccess(`Room "${newRoomName}" created successfully`);
      setNewRoomName('');
      setRoomMembers('');
      setShowCreateRoom(false);
    } catch (error: any) {
      setError(error.message || 'Failed to create room');
    }
  }, [newRoomName, roomMembers, createRoom]);

  const handleAcceptInvitation = useCallback(
    async (invitation: InvitationResponse) => {
      try {
        await acceptInvitation.mutateAsync(invitation.id);
      } catch (error: any) {
        setError(error.message || 'Failed to accept invitation');
      }
    },
    [acceptInvitation]
  );

  const handleRejectInvitation = useCallback(
    async (invitation: InvitationResponse) => {
      try {
        await rejectInvitation.mutateAsync(invitation.id);
      } catch (error: any) {
        setError(error.message || 'Failed to reject invitation');
      }
    },
    [rejectInvitation]
  );

  // Clear messages after 3 seconds
  useState(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  });

  if (contactsLoading || roomsLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    );
  }

  const isSelected = (target: ChatTarget) => {
    if (!selectedChat) return false;
    if (selectedChat.type !== target.type) return false;
    return selectedChat.type === 'contact'
      ? selectedChat.data.id === target.data.id
      : selectedChat.data.id === target.data.id;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chats</h2>
          <button
            type="button"
            onClick={() => (activeTab === 'contacts' ? setShowAddContact(true) : setShowCreateRoom(true))}
            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
            data-testid={activeTab === 'contacts' ? 'add-contact-button' : 'create-room-button'}
            aria-label={activeTab === 'contacts' ? 'Add contact' : 'Create room'}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="chat-search"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tab buttons */}
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('contacts');
            }}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'contacts'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            data-testid="contacts-tab"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Contacts ({contacts.length})
            {receivedInvitations.length > 0 && (
              <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                {receivedInvitations.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rooms')}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'rooms'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            data-testid="rooms-tab"
          >
            <Users className="w-4 h-4 mr-1" />
            Rooms ({rooms.length})
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mx-4 mt-2 p-2 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">{error}</div>
      )}
      {success && (
        <div className="mx-4 mt-2 p-2 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto" data-testid="chat-list">
        {activeTab === 'contacts' ? (
          // Contacts List with integrated invitations
          <div className="p-4">
            <div className="space-y-2">
              {/* Pending Invitations Section */}
              {filteredInvitations.length > 0 && (
                <>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Pending Invitations
                  </div>
                  {filteredInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      data-testid={`request-${invitation.from_user.username}`}
                      className="flex items-center p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg"
                    >
                      <UserPlus className="w-8 h-8 text-orange-500 mr-3" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{invitation.from_user.username}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Wants to connect • {new Date(invitation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleAcceptInvitation(invitation)}
                          data-testid={`accept-${invitation.from_user.username}`}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          disabled={acceptInvitation.isPending}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectInvitation(invitation)}
                          data-testid={`decline-${invitation.from_user.username}`}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                          disabled={rejectInvitation.isPending}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredContacts.length > 0 && (
                    <div className="border-b border-gray-200 dark:border-gray-700 my-4" />
                  )}
                </>
              )}

              {/* Contacts Section */}
              {filteredContacts.length > 0 && (
                <>
                  {filteredInvitations.length > 0 && (
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Contacts
                    </div>
                  )}
                  {filteredContacts.map((contact) => {
                    const target: ChatTarget = { type: 'contact', data: contact };
                    return (
                      <button
                        key={contact.id}
                        type="button"
                        data-testid={`contact-${contact.other_user.username}`}
                        className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${
                          isSelected(target)
                            ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                            : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => onChatSelect?.(target)}
                      >
                        <User className="w-8 h-8 text-gray-400 mr-3" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{contact.other_user.username}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Added {new Date(contact.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </>
              )}

              {/* Empty state */}
              {filteredContacts.length === 0 && filteredInvitations.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No contacts or invitations found' : 'No contacts yet. Start by adding some!'}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Rooms List
          <div className="p-4">
            {filteredRooms.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No rooms found' : 'No rooms yet. Create your first one!'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRooms.map((room) => {
                  const target: ChatTarget = { type: 'room', data: room };
                  return (
                    <button
                      key={room.id}
                      type="button"
                      data-testid={`room-${room.id}`}
                      className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${
                        isSelected(target)
                          ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                          : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => onChatSelect?.(target)}
                    >
                      <Users className="w-8 h-8 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{room.name || `Room ${room.id}`}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{room.members.length} members</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Contact</h3>
            <input
              type="text"
              placeholder="Enter username"
              value={newContactUsername}
              onChange={(e) => setNewContactUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddContact()}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddContact(false);
                  setNewContactUsername('');
                  setError('');
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddContact}
                disabled={sendInvitation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {sendInvitation.isPending ? 'Sending...' : 'Send Contact Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Room</h3>
            <input
              type="text"
              placeholder="Room name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <input
              type="text"
              placeholder="Members (comma separated usernames, optional)"
              value={roomMembers}
              onChange={(e) => setRoomMembers(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreateRoom(false);
                  setNewRoomName('');
                  setRoomMembers('');
                  setError('');
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateRoom}
                disabled={createRoom.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {createRoom.isPending ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
