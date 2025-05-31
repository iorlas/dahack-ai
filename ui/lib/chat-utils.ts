import type { ContactResponse, RoomResponse, User } from './api';

/**
 * Find the system room for a contact relationship
 */
export function findSystemRoomForContact(
  contact: ContactResponse,
  currentUser: User,
  rooms: RoomResponse[]
): RoomResponse | null {
  // Find a system room that contains both the current user and the contact's other user
  const systemRoom = rooms.find((room) => {
    if (!room.is_system) return false;

    const memberIds = room.members.map((member) => member.user.id);
    return memberIds.includes(currentUser.id) && memberIds.includes(contact.other_user.id);
  });

  return systemRoom || null;
}

/**
 * Get the room ID for a chat target (contact or room)
 */
export function getChatRoomId(
  target: { type: 'contact'; data: ContactResponse } | { type: 'room'; data: RoomResponse },
  currentUser: User,
  rooms: RoomResponse[]
): number | null {
  if (target.type === 'room') {
    return target.data.id;
  }

  // For contacts, find the system room
  const systemRoom = findSystemRoomForContact(target.data, currentUser, rooms);
  return systemRoom?.id || null;
}
