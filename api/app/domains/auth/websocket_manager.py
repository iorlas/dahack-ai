import json
from typing import Dict, Set

from fastapi import WebSocket, WebSocketDisconnect
from structlog import get_logger

from app.core.redis import redis_service
from app.domains.auth.message_schemas import (
    MessageResponse,
    WSAuthMessage,
    WSErrorMessage,
    WSSendMessage,
    WSSubscribeMessage,
    WSSuccessMessage,
    WSUnsubscribeMessage,
)
from app.domains.auth.message_service import message_service
from app.domains.auth.models import User
from app.domains.auth.service import auth_service

logger = get_logger()


class ConnectionManager:
    def __init__(self):
        # WebSocket connections by user_id
        self.active_connections: Dict[int, WebSocket] = {}
        # Room subscriptions by user_id
        self.user_subscriptions: Dict[int, Set[int]] = {}
        # Redis pubsub for cross-server communication
        self.redis_client = None
        self.pubsub = None
    
    async def initialize(self):
        """Initialize Redis pub/sub."""
        self.redis_client = await redis_service.get_async_redis()
        self.pubsub = self.redis_client.pubsub()
    
    async def connect(self, websocket: WebSocket, user_id: int):
        """Connect a user's WebSocket."""
        # WebSocket should already be accepted by the endpoint handler
        self.active_connections[user_id] = websocket
        self.user_subscriptions[user_id] = set()
        logger.info("websocket_connected", user_id=user_id)
    
    async def disconnect(self, user_id: int):
        """Disconnect a user's WebSocket."""
        # Unsubscribe from all rooms
        if user_id in self.user_subscriptions:
            for room_id in self.user_subscriptions[user_id]:
                await self.unsubscribe_from_room(user_id, room_id)
            del self.user_subscriptions[user_id]
        
        # Remove connection
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        
        logger.info("websocket_disconnected", user_id=user_id)
    
    async def subscribe_to_room(self, user_id: int, room_id: int):
        """Subscribe a user to a room."""
        if user_id not in self.user_subscriptions:
            self.user_subscriptions[user_id] = set()
        
        self.user_subscriptions[user_id].add(room_id)
        
        # Subscribe to Redis channel
        channel_name = f"room:{room_id}"
        await self.pubsub.subscribe(channel_name)
        
        logger.info("user_subscribed_to_room", user_id=user_id, room_id=room_id)
    
    async def unsubscribe_from_room(self, user_id: int, room_id: int):
        """Unsubscribe a user from a room."""
        if user_id in self.user_subscriptions:
            self.user_subscriptions[user_id].discard(room_id)
        
        # Check if any other users are subscribed
        any_subscribed = any(
            room_id in subs 
            for uid, subs in self.user_subscriptions.items() 
            if uid != user_id
        )
        
        # Unsubscribe from Redis channel if no one else is subscribed
        if not any_subscribed:
            channel_name = f"room:{room_id}"
            await self.pubsub.unsubscribe(channel_name)
        
        logger.info("user_unsubscribed_from_room", user_id=user_id, room_id=room_id)
    
    async def send_to_user(self, user_id: int, message: dict):
        """Send a message to a specific user."""
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error("failed_to_send_to_user", user_id=user_id, error=str(e))
                await self.disconnect(user_id)
    
    async def broadcast_to_room(self, room_id: int, message: dict, exclude_user_id: int = None):
        """Broadcast a message to all users in a room."""
        # Publish to Redis for cross-server communication
        channel_name = f"room:{room_id}"
        message_data = {
            "room_id": room_id,
            "message": message,
            "exclude_user_id": exclude_user_id
        }
        await self.redis_client.publish(channel_name, json.dumps(message_data))
    
    async def handle_redis_message(self, message):
        """Handle a message from Redis pub/sub."""
        try:
            # Decode bytes to string if necessary
            data_str = message["data"]
            if isinstance(data_str, bytes):
                data_str = data_str.decode('utf-8')
            
            data = json.loads(data_str)
            room_id = data["room_id"]
            msg = data["message"]
            exclude_user_id = data.get("exclude_user_id")
            
            # Send to all subscribed users on this server
            for user_id, subscriptions in self.user_subscriptions.items():
                if room_id in subscriptions and user_id != exclude_user_id:
                    await self.send_to_user(user_id, msg)
        except Exception as e:
            logger.error("failed_to_handle_redis_message", error=str(e))
    
    async def handle_message(self, user_id: int, user: User, data: dict):
        """Handle incoming WebSocket message."""
        message_type = data.get("type")
        
        try:
            if message_type == "subscribe":
                msg = WSSubscribeMessage(**data)
                # Check if user is a member of the room
                user_rooms = await message_service.get_user_rooms(user)
                if msg.room_id not in user_rooms:
                    await self.send_to_user(user_id, WSErrorMessage(
                        type="error",
                        error="You are not a member of this room"
                    ).dict())
                    return
                
                await self.subscribe_to_room(user_id, msg.room_id)
                await self.send_to_user(user_id, WSSuccessMessage(
                    type="success",
                    message=f"Subscribed to room {msg.room_id}"
                ).dict())
            
            elif message_type == "unsubscribe":
                msg = WSUnsubscribeMessage(**data)
                await self.unsubscribe_from_room(user_id, msg.room_id)
                await self.send_to_user(user_id, WSSuccessMessage(
                    type="success",
                    message=f"Unsubscribed from room {msg.room_id}"
                ).dict())
            
            elif message_type == "send_message":
                msg = WSSendMessage(**data)
                
                # Save message to database
                message = await message_service.save_message(
                    room_id=msg.room_id,
                    sender=user,
                    content=msg.content
                )
                
                # Prepare message for broadcast
                await message.fetch_related("sender")
                message_response = MessageResponse.from_orm(message)
                # Convert to JSON and back to ensure datetime serialization
                message_dict = json.loads(message_response.json())
                broadcast_msg = {
                    "type": "message",
                    "message": message_dict
                }
                
                # Broadcast to room
                await self.broadcast_to_room(msg.room_id, broadcast_msg)
            
            else:
                await self.send_to_user(user_id, WSErrorMessage(
                    type="error",
                    error=f"Unknown message type: {message_type}"
                ).dict())
        
        except Exception as e:
            logger.error("failed_to_handle_message", user_id=user_id, error=str(e))
            await self.send_to_user(user_id, WSErrorMessage(
                type="error",
                error=str(e)
            ).dict())


# Global connection manager instance
manager = ConnectionManager() 