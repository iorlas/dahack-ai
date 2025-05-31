from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from structlog import get_logger

from app.domains.auth.contact_service import contact_service
from app.domains.auth.dependencies import get_current_active_user
from app.domains.auth.models import Invitation, User
from app.domains.auth.schemas import (
    ContactInvite,
    ContactListResponse,
    ContactResponse,
    InvitationResponse,
)

logger = get_logger()

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.post("/invite", response_model=InvitationResponse)
async def send_contact_invitation(
    invite_data: ContactInvite, current_user: Annotated[User, Depends(get_current_active_user)]
) -> Invitation:
    """Send a contact invitation to another user."""
    invitation = await contact_service.send_invitation(current_user, invite_data.username)
    await invitation.fetch_related("from_user", "to_user")
    return invitation


@router.post("/{invitation_id}/accept", response_model=ContactResponse)
async def accept_contact_invitation(
    invitation_id: int, current_user: Annotated[User, Depends(get_current_active_user)]
) -> dict:
    """Accept a contact invitation."""
    contact = await contact_service.accept_invitation(current_user, invitation_id)
    await contact.fetch_related("user1", "user2")


    # Determine the other user for the response
    other_user = contact.user2 if contact.user1_id == current_user.id else contact.user1

    return {
        "id": contact.id,
        "other_user": other_user,
        "created_at": contact.created_at,
        "updated_at": contact.updated_at,
    }


@router.post("/{invitation_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
async def reject_contact_invitation(
    invitation_id: int, current_user: Annotated[User, Depends(get_current_active_user)]
) -> None:
    """Reject a contact invitation."""
    await contact_service.reject_invitation(current_user, invitation_id)


@router.get("", response_model=ContactListResponse)
async def get_contacts(current_user: Annotated[User, Depends(get_current_active_user)]) -> dict:
    """Get all contacts for the current user."""
    return await contact_service.get_user_contacts(current_user)


@router.get("/check/{username}")
async def check_mutual_contact(
    username: str, current_user: Annotated[User, Depends(get_current_active_user)]
) -> dict:
    """Check if the current user and specified user are mutual contacts."""
    other_user = await User.filter(username=username).first()
    if not other_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")


    is_mutual = await contact_service.check_mutual_contact(current_user, other_user)
    return {"is_mutual_contact": is_mutual, "username": username}

    return {"is_mutual_contact": is_mutual, "username": username}
