'use client';

import { Plus, Search, User } from 'lucide-react';
import { useCallback, useState } from 'react';
import {
  type ContactResponse,
  type InvitationResponse,
  useAcceptInvitation,
  useContacts,
  useRejectInvitation,
  useSendInvitation,
} from '../../../lib/api';

interface ContactListProps {
  onContactSelect?: (contact: ContactResponse) => void;
}

export default function ContactList({ onContactSelect }: ContactListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const [newContactUsername, setNewContactUsername] = useState('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const { data: contactsData, isLoading } = useContacts();
  const sendInvitation = useSendInvitation();
  const acceptInvitation = useAcceptInvitation();
  const rejectInvitation = useRejectInvitation();

  const contacts = contactsData?.contacts || [];
  const receivedInvitations = contactsData?.received_invitations || [];

  const filteredContacts = contacts.filter((contact) =>
    contact.other_user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleAddContact();
      }
    },
    [handleAddContact]
  );

  const closeModal = useCallback(() => {
    setShowAddContact(false);
    setNewContactUsername('');
    setError('');
  }, []);

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

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300">Loading contacts...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contacts</h2>
          <button
            type="button"
            onClick={() => setShowAddContact(true)}
            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
            data-testid="add-contact-button"
            aria-label="Add contact"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="contact-search"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tab buttons */}
        <div className="flex mt-4 space-x-2">
          <button
            type="button"
            onClick={() => setShowPendingRequests(false)}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              !showPendingRequests
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            data-testid="contacts-tab"
          >
            Contacts ({contacts.length})
          </button>
          <button
            type="button"
            onClick={() => setShowPendingRequests(true)}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              showPendingRequests
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Pending Requests ({receivedInvitations.length})
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
      <div className="flex-1 overflow-y-auto" data-testid="contacts-list">
        {!showPendingRequests ? (
          // Contacts List
          <div className="p-4">
            {filteredContacts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No contacts found' : 'No contacts yet. Start by adding some!'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    data-testid={`contact-${contact.other_user.username}`}
                    className="w-full flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                    onClick={() => onContactSelect?.(contact)}
                  >
                    <User className="w-8 h-8 text-gray-400 mr-3" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{contact.other_user.username}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Added {new Date(contact.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Pending Requests
          <div className="p-4">
            {receivedInvitations.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">No pending requests</div>
            ) : (
              <div className="space-y-2">
                {receivedInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    data-testid={`request-${invitation.from_user.username}`}
                    className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <User className="w-8 h-8 text-gray-400 mr-3" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{invitation.from_user.username}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(invitation.created_at).toLocaleDateString()}
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
              onKeyDown={handleKeyPress}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={closeModal}
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
    </div>
  );
}
