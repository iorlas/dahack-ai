from datetime import datetime

from pydantic import BaseModel, Field

from app.domains.auth.schemas import UserResponse


class RoomCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    member_usernames: list[str] = Field(
        default_factory=list, description="Usernames to add to room"
    )


class RoomAddMembers(BaseModel):
    usernames: list[str] = Field(..., min_length=1, description="Usernames to add to room")


class RoomMemberResponse(BaseModel):
    class Config:
        from_attributes = True

    user: UserResponse
    joined_at: datetime


class RoomResponse(BaseModel):
    class Config:
        from_attributes = True

    id: int
    name: str | None
    owner: UserResponse | None
    is_system: bool
    members: list[RoomMemberResponse]
    created_at: datetime
    updated_at: datetime


class RoomListResponse(BaseModel):
    rooms: list[RoomResponse]
