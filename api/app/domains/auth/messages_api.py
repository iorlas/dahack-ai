import asyncio
from typing import Optional

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
from structlog import get_logger

from app.domains.auth.dependencies import get_current_active_user
from app.domains.auth.message_schemas import MessageHistoryResponse, MessageResponse
from app.domains.auth.message_service import message_service
from app.domains.auth.models import User
from app.domains.auth.service import auth_service
from app.domains.auth.websocket_manager import manager

logger = get_logger()

router = APIRouter(prefix="/messages", tags=["messages"])


@router.get("/rooms/{room_id}/history", response_model=MessageHistoryResponse)
async def get_message_history(
    room_id: int,
    current_user: User = Depends(get_current_active_user),
    limit: int = Query(50, ge=1, le=100),
    before_id: Optional[int] = Query(None),
) -> MessageHistoryResponse:
    """Get message history for a room."""
    messages, has_more = await message_service.get_room_messages(
        room_id=room_id,
        user=current_user,
        limit=limit,
        before_id=before_id
    )
    
    # Build response
    message_responses = []
    for message in messages:
        message_responses.append(
            MessageResponse(
                id=message.id,
                room_id=message.room_id,
                sender=message.sender,
                content=message.content,
                edited_at=message.edited_at,
                created_at=message.created_at,
                updated_at=message.updated_at,
            )
        )
    
    return MessageHistoryResponse(messages=message_responses, has_more=has_more)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time messaging."""
    user = None
    user_id = None
    
    try:
        await websocket.accept()
        logger.info("websocket_accepted")
        
        # Wait for authentication message
        auth_data = await websocket.receive_json()
        logger.info("websocket_auth_received", data=auth_data)
        
        if auth_data.get("type") != "auth":
            await websocket.send_json({"type": "error", "error": "First message must be auth"})
            await websocket.close()
            return
        
        # Verify token
        token = auth_data.get("token")
        if not token:
            await websocket.send_json({"type": "error", "error": "No token provided"})
            await websocket.close()
            return
        
        try:
            token_data = auth_service.verify_token(token)
            logger.info("token_verified", username=token_data.username if token_data else None)
        except Exception as e:
            logger.error("token_verification_failed", error=str(e))
            await websocket.send_json({"type": "error", "error": "Invalid token"})
            await websocket.close()
            return
            
        if not token_data:
            await websocket.send_json({"type": "error", "error": "Invalid token"})
            await websocket.close()
            return
        
        # Get user
        user = await User.filter(username=token_data.username).first()
        logger.info("user_lookup", username=token_data.username, found=user is not None)
        
        if not user or not user.is_active:
            await websocket.send_json({"type": "error", "error": "User not found or inactive"})
            await websocket.close()
            return
        
        user_id = user.id
        
        # Connect user
        await manager.connect(websocket, user_id)
        await websocket.send_json({"type": "success", "message": "Authenticated successfully"})
        logger.info("websocket_authenticated", user_id=user_id)
        
        # Handle messages
        while True:
            data = await websocket.receive_json()
            await manager.handle_message(user_id, user, data)
    
    except WebSocketDisconnect:
        logger.info("websocket_disconnected", user_id=user_id)
        if user_id:
            await manager.disconnect(user_id)
    except Exception as e:
        logger.error("websocket_error", error=str(e), user_id=user_id, error_type=type(e).__name__)
        if user_id:
            await manager.disconnect(user_id)


# Background task to handle Redis pub/sub
async def redis_listener():
    """Listen to Redis pub/sub and forward messages to WebSocket clients."""
    await manager.initialize()
    
    # Subscribe to a dummy channel to initialize pubsub
    await manager.pubsub.subscribe("dummy_channel")
    
    while True:
        try:
            # Get message from Redis
            message = await manager.pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message and message["type"] == "message" and message["channel"] != b"dummy_channel":
                await manager.handle_redis_message(message)
        except Exception as e:
            logger.error("redis_listener_error", error=str(e))
            await asyncio.sleep(1)  # Wait before retrying 