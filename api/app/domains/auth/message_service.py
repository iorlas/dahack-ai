from fastapi import HTTPException, status
from structlog import get_logger

from app.domains.auth.models import Message, Room, RoomMember, User

logger = get_logger()


class MessageService:
    @staticmethod
    async def save_message(room_id: int, sender: User, content: str) -> Message:
        """Save a message to the database."""
        # Check if user is a member of the room
        is_member = await RoomMember.filter(room_id=room_id, user=sender).exists()
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this room"
            )
        
        # Create the message
        message = await Message.create(
            room_id=room_id,
            sender=sender,
            content=content
        )
        
        logger.info("message_saved", message_id=message.id, room_id=room_id, sender_id=sender.id)
        return message
    
    @staticmethod
    async def get_room_messages(
        room_id: int, 
        user: User, 
        limit: int = 50, 
        before_id: int | None = None
    ) -> tuple[list[Message], bool]:
        """Get messages for a room with pagination."""
        # Check if user is a member of the room
        is_member = await RoomMember.filter(room_id=room_id, user=user).exists()
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this room"
            )
        
        # Build query
        query = Message.filter(room_id=room_id)
        
        # Add pagination
        if before_id:
            query = query.filter(id__lt=before_id)
        
        # Get messages ordered by newest first
        messages = await query.order_by("-id").limit(limit + 1).prefetch_related("sender")
        
        # Check if there are more messages
        has_more = len(messages) > limit
        if has_more:
            messages = messages[:limit]
        
        # Reverse to get chronological order
        messages.reverse()
        
        return messages, has_more
    
    @staticmethod
    async def get_user_rooms(user: User) -> list[int]:
        """Get all room IDs where the user is a member."""
        room_ids = await RoomMember.filter(user=user).values_list("room_id", flat=True)
        return list(room_ids)


message_service = MessageService() 