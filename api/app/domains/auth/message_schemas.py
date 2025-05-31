from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.domains.auth.schemas import UserResponse


class MessageResponse(BaseModel):
    id: int
    room_id: int
    sender: UserResponse
    content: str
    edited_at: datetime | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MessageHistoryResponse(BaseModel):
    messages: list[MessageResponse]
    has_more: bool


# WebSocket message schemas
class WSMessageBase(BaseModel):
    type: str


class WSAuthMessage(WSMessageBase):
    type: Literal["auth"]
    token: str


class WSSubscribeMessage(WSMessageBase):
    type: Literal["subscribe"]
    room_id: int


class WSUnsubscribeMessage(WSMessageBase):
    type: Literal["unsubscribe"]
    room_id: int


class WSSendMessage(WSMessageBase):
    type: Literal["send_message"]
    room_id: int
    content: str


class WSMessageReceived(WSMessageBase):
    type: Literal["message"]
    message: MessageResponse


class WSErrorMessage(WSMessageBase):
    type: Literal["error"]
    error: str


class WSSuccessMessage(WSMessageBase):
    type: Literal["success"]
    message: str 