from fastapi import HTTPException, status
from structlog import get_logger
from tortoise.exceptions import IntegrityError

from app.domains.auth.models import Room, RoomMember, User

logger = get_logger()


class RoomService:
    @staticmethod
    async def create_user_room(owner: User, name: str, member_usernames: list[str] | None = None) -> Room:
        """Create a user-owned room."""
        # Create the room
        room = await Room.create(name=name, owner=owner, is_system=False)

        # Add owner as first member
        await RoomMember.create(room=room, user=owner)

        # Add other members if specified
        if member_usernames:
            await RoomService._add_members_to_room(room, owner, member_usernames)

        logger.info("user_room_created", room_id=room.id, owner_id=owner.id)
        return room

    @staticmethod
    async def create_system_room(user1: User, user2: User) -> Room:
        """Create a system-owned room for two users."""
        # Create the room (no owner for system rooms)
        room = await Room.create(name=None, owner=None, is_system=True)

        # Add both users as members
        await RoomMember.create(room=room, user=user1)
        await RoomMember.create(room=room, user=user2)

        logger.info("system_room_created", room_id=room.id, user1_id=user1.id, user2_id=user2.id)
        return room

    @staticmethod
    async def add_members_to_room(room_id: int, owner: User, usernames: list[str]) -> Room:
        """Add members to a user-owned room (only owner can do this)."""
        # Get the room
        room = await Room.filter(id=room_id).prefetch_related("owner").first()
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

        # Check if system room
        if room.is_system:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Cannot add members to system room"
            )

        # Check if user is the owner
        if not room.owner or room.owner.id != owner.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Only room owner can add members"
            )

        await RoomService._add_members_to_room(room, owner, usernames)
        return room

    @staticmethod
    async def _add_members_to_room(room: Room, adding_user: User, usernames: list[str]) -> None:
        """Internal method to add members to a room."""
        # Import inside function to avoid circular dependency
        from app.domains.auth.contact_service import contact_service

        for username in usernames:
            # Get the user
            user = await User.filter(username=username).first()
            if not user:
                logger.warning("user_not_found", username=username)
                continue

            # Check if they are contacts
            is_contact = await contact_service.check_mutual_contact(adding_user, user)
            if not is_contact:
                logger.warning("not_a_contact", username=username)
                continue

            # Check if already a member
            existing = await RoomMember.filter(room=room, user=user).exists()
            if existing:
                logger.warning("already_member", username=username, room_id=room.id)
                continue

            # Add to room
            try:
                await RoomMember.create(room=room, user=user)
                logger.info("member_added_to_room", room_id=room.id, user_id=user.id)
            except IntegrityError:
                logger.warning("failed_to_add_member", username=username, room_id=room.id)

    @staticmethod
    async def get_room(room_id: int, user: User) -> Room:
        """Get a room if the user is a member or owner."""
        room = (
            await Room.filter(id=room_id)
            .prefetch_related("owner", "members", "members__user")
            .first()
        )

        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

        # Check if user is a member or owner
        is_member = await RoomMember.filter(room=room, user=user).exists()
        is_owner = room.owner and room.owner.id == user.id

        if not is_member and not is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this room"
            )

        return room

    @staticmethod
    async def get_user_rooms(user: User) -> list[Room]:
        """Get all rooms where the user is a member."""
        # Get room IDs where user is a member
        room_memberships = await RoomMember.filter(user=user).values_list("room_id", flat=True)

        # Get the rooms with all related data
        rooms = await Room.filter(id__in=room_memberships).prefetch_related(
            "owner", "members", "members__user"
        )

        return list(rooms)

    @staticmethod
    async def leave_room(room_id: int, user: User) -> None:
        """Leave a user-owned room."""
        room = await Room.filter(id=room_id).prefetch_related("owner").first()
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

        # Cannot leave system rooms
        if room.is_system:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Cannot leave system room"
            )

        # Cannot leave if you're the owner
        if room.owner and room.owner.id == user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Owner cannot leave the room. Delete it instead.",
            )

        # Remove membership
        membership = await RoomMember.filter(room=room, user=user).first()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="You are not a member of this room"
            )

        await membership.delete()
        logger.info("user_left_room", room_id=room_id, user_id=user.id)

    @staticmethod
    async def delete_room(room_id: int, user: User) -> None:
        """Delete a room (only owner can do this)."""
        room = await Room.filter(id=room_id).prefetch_related("owner").first()
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")

        # Check if user is the owner
        if not room.owner or room.owner.id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Only room owner can delete the room"
            )

        # Delete all memberships first (due to foreign key)
        await RoomMember.filter(room=room).delete()

        # Delete the room
        await room.delete()
        logger.info("room_deleted", room_id=room_id, owner_id=user.id)

    @staticmethod
    async def get_or_create_system_room(user1: User, user2: User) -> Room:
        """Get existing system room for two users or create a new one."""
        # Check if system room already exists for these users
        room_ids_user1 = await RoomMember.filter(user=user1).values_list("room_id", flat=True)
        room_ids_user2 = await RoomMember.filter(user=user2).values_list("room_id", flat=True)

        # Find common room IDs
        common_room_ids = set(room_ids_user1) & set(room_ids_user2)

        if common_room_ids:
            # Check if any of these are system rooms
            system_room = await Room.filter(id__in=common_room_ids, is_system=True).first()

            if system_room:
                return system_room

        # No existing system room, create one
        return await RoomService.create_system_room(user1, user2)


room_service = RoomService()
