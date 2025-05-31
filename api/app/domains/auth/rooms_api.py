from fastapi import APIRouter, Depends, status
from structlog import get_logger

from app.domains.auth.dependencies import get_current_active_user
from app.domains.auth.models import User
from app.domains.auth.room_schemas import (
    RoomAddMembers,
    RoomCreate,
    RoomListResponse,
    RoomMemberResponse,
    RoomResponse,
)
from app.domains.auth.room_service import room_service

logger = get_logger()

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
async def create_room(
    room_data: RoomCreate, current_user: User = Depends(get_current_active_user)
) -> RoomResponse:
    """Create a new user-owned room."""
    room = await room_service.create_user_room(
        owner=current_user, name=room_data.name, member_usernames=room_data.member_usernames
    )

    # Fetch related data for response
    await room.fetch_related("owner", "members", "members__user")

    # Build response
    members = []
    for member in room.members:
        await member.fetch_related("user")
        members.append(RoomMemberResponse(user=member.user, joined_at=member.joined_at))

    return RoomResponse(
        id=room.id,
        name=room.name,
        owner=room.owner,
        is_system=room.is_system,
        members=members,
        created_at=room.created_at,
        updated_at=room.updated_at,
    )


@router.get("", response_model=RoomListResponse)
async def get_rooms(current_user: User = Depends(get_current_active_user)) -> RoomListResponse:
    """Get all rooms where the current user is a member."""
    rooms = await room_service.get_user_rooms(current_user)

    # Build response
    room_responses = []
    for room in rooms:
        members = []
        for member in room.members:
            await member.fetch_related("user")
            members.append(RoomMemberResponse(user=member.user, joined_at=member.joined_at))

        room_responses.append(
            RoomResponse(
                id=room.id,
                name=room.name,
                owner=room.owner,
                is_system=room.is_system,
                members=members,
                created_at=room.created_at,
                updated_at=room.updated_at,
            )
        )

    return RoomListResponse(rooms=room_responses)


@router.get("/{room_id}", response_model=RoomResponse)
async def get_room(
    room_id: int, current_user: User = Depends(get_current_active_user)
) -> RoomResponse:
    """Get a specific room if you are a member."""
    room = await room_service.get_room(room_id, current_user)

    # Build response
    members = []
    for member in room.members:
        await member.fetch_related("user")
        members.append(RoomMemberResponse(user=member.user, joined_at=member.joined_at))

    return RoomResponse(
        id=room.id,
        name=room.name,
        owner=room.owner,
        is_system=room.is_system,
        members=members,
        created_at=room.created_at,
        updated_at=room.updated_at,
    )


@router.post("/{room_id}/members", response_model=RoomResponse)
async def add_members(
    room_id: int,
    members_data: RoomAddMembers,
    current_user: User = Depends(get_current_active_user),
) -> RoomResponse:
    """Add members to a user-owned room (owner only)."""
    room = await room_service.add_members_to_room(
        room_id=room_id, owner=current_user, usernames=members_data.usernames
    )

    # Fetch and build response
    await room.fetch_related("owner", "members", "members__user")

    members = []
    for member in room.members:
        await member.fetch_related("user")
        members.append(RoomMemberResponse(user=member.user, joined_at=member.joined_at))

    return RoomResponse(
        id=room.id,
        name=room.name,
        owner=room.owner,
        is_system=room.is_system,
        members=members,
        created_at=room.created_at,
        updated_at=room.updated_at,
    )


@router.post("/{room_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_room(room_id: int, current_user: User = Depends(get_current_active_user)) -> None:
    """Leave a user-owned room."""
    await room_service.leave_room(room_id, current_user)


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(room_id: int, current_user: User = Depends(get_current_active_user)) -> None:
    """Delete a room (owner only)."""
    await room_service.delete_room(room_id, current_user)
