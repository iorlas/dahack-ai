from fastapi import APIRouter, HTTPException, status
from structlog import get_logger

from app.domains.auth.contact_service import contact_service
from app.domains.auth.dependencies import get_current_active_user
from app.domains.auth.models import Invitation, User
from app.domains.auth.schemas import (
    ContactInvite,
    ContactListResponse,
    ContactResponse,
    InvitationResponse,
    Token,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.domains.auth.service import auth_service

logger = get_logger()

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister) -> User:
    """Register a new user."""
    # Check if user already exists
    existing_user = await User.filter(username=user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )

    # Create new user
    user = await auth_service.create_user(username=user_data.username, password=user_data.password)

    user = await auth_service.create_user(username=user_data.username, password=user_data.password)

    logger.info("user_registered", username=user.username, user_id=user.id)
    return user


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin) -> dict:
    """Login user and return JWT token."""
    user = await auth_service.authenticate_user(user_data.username, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = auth_service.create_access_token(data={"sub": user.username})

    logger.info("user_logged_in", username=user.username, user_id=user.id)
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_current_user(current_user: CurrentActiveUser) -> User:
    """Get current authenticated user."""
    return current_user


# Contact endpoints
@router.post("/contacts/invite", response_model=InvitationResponse)
async def send_contact_invitation(
    invite_data: ContactInvite, current_user: User = Depends(get_current_active_user)
) -> Invitation:
    """Send a contact invitation to another user."""
    invitation = await contact_service.send_invitation(current_user, invite_data.username)
    await invitation.fetch_related("from_user", "to_user")
    return invitation


@router.post("/contacts/{invitation_id}/accept", response_model=ContactResponse)
async def accept_contact_invitation(
    invitation_id: int, current_user: User = Depends(get_current_active_user)
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


@router.delete("/contacts/{invitation_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
async def reject_contact_invitation(
    invitation_id: int, current_user: User = Depends(get_current_active_user)
) -> None:
    """Reject a contact invitation."""
    await contact_service.reject_invitation(current_user, invitation_id)


@router.get("/contacts", response_model=ContactListResponse)
async def get_contacts(current_user: User = Depends(get_current_active_user)) -> dict:
    """Get all contacts for the current user."""
    return await contact_service.get_user_contacts(current_user)


@router.get("/contacts/check/{username}")
async def check_mutual_contact(
    username: str, current_user: User = Depends(get_current_active_user)
) -> dict:
    """Check if the current user and specified user are mutual contacts."""
    other_user = await User.filter(username=username).first()
    if not other_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    is_mutual = await contact_service.check_mutual_contact(current_user, other_user)
    return {"is_mutual_contact": is_mutual, "username": username}
