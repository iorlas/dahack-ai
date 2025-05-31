from fastapi import HTTPException, status
from structlog import get_logger
from tortoise.exceptions import IntegrityError
from tortoise.expressions import Q

from app.domains.auth.models import Contact, Invitation, User

logger = get_logger()


class ContactService:
    @staticmethod
    async def send_invitation(from_user: User, to_username: str) -> Invitation:
        """Send a contact invitation to another user."""
        # Check if target user exists
        to_user = await User.filter(username=to_username).first()
        if not to_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        # Check if trying to add self
        if from_user.id == to_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot add yourself as a contact"
            )

        # Check if already contacts
        is_contact = await ContactService.check_mutual_contact(from_user, to_user)
        if is_contact:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Already connected with this user"
            )

        # Check if invitation already exists (in either direction)
        existing_invitation = await Invitation.filter(
            Q(from_user=from_user, to_user=to_user) | Q(from_user=to_user, to_user=from_user)
        ).first()

        if existing_invitation:
            if existing_invitation.from_user.id == from_user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation already sent"
                )
            else:
                # The other user has already invited us, auto-accept
                await ContactService._create_contact(from_user, to_user)
                await existing_invitation.delete()

                logger.info(
                    "contact_auto_accepted", from_user_id=to_user.id, to_user_id=from_user.id
                )

                # Return the original invitation for consistency
                return existing_invitation

        # Create new invitation
        try:
            invitation = await Invitation.create(from_user=from_user, to_user=to_user)
            logger.info("contact_invitation_sent", from_user_id=from_user.id, to_user_id=to_user.id)
            return invitation
        except IntegrityError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Contact invitation already exists"
            ) from None

    @staticmethod
    async def accept_invitation(user: User, invitation_id: int) -> Contact:
        """Accept a contact invitation."""
        # Get the invitation
        invitation = await Invitation.filter(id=invitation_id, to_user=user).first()

        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found"
            )

        # Create the contact
        await invitation.fetch_related("from_user")
        contact = await ContactService._create_contact(invitation.from_user, user)

        # Delete the invitation
        await invitation.delete()

        logger.info(
            "contact_invitation_accepted",
            invitation_id=invitation_id,
            from_user_id=invitation.from_user.id,
            to_user_id=user.id,
        )

        return contact

    @staticmethod
    async def reject_invitation(user: User, invitation_id: int) -> None:
        """Reject a contact invitation."""
        # Get the invitation
        invitation = await Invitation.filter(id=invitation_id, to_user=user).first()

        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found"
            )

        # Delete the invitation
        await invitation.delete()

        logger.info(
            "contact_invitation_rejected",
            invitation_id=invitation_id,
            from_user_id=invitation.from_user.id,
            to_user_id=invitation.to_user.id,
        )

    @staticmethod
    async def get_user_contacts(user: User) -> dict:
        """Get all contacts and invitations for a user."""
        # Get sent invitations
        sent_invitations = await Invitation.filter(from_user=user).prefetch_related(
            "from_user", "to_user"
        )

        # Get received invitations
        received_invitations = await Invitation.filter(to_user=user).prefetch_related(
            "from_user", "to_user"
        )

        # Get contacts (user can be either user1 or user2)
        contacts_raw = await Contact.filter(Q(user1=user) | Q(user2=user)).prefetch_related(
            "user1", "user2"
        )

        # Transform contacts to include "other_user" for easier frontend handling
        contacts = []
        for contact in contacts_raw:
            other_user = contact.user2 if contact.user1.id == user.id else contact.user1
            contacts.append(
                {
                    "id": contact.id,
                    "other_user": other_user,
                    "created_at": contact.created_at,
                    "updated_at": contact.updated_at,
                }
            )

        return {
            "sent_invitations": sent_invitations,
            "received_invitations": received_invitations,
            "contacts": contacts,
        }

    @staticmethod
    async def check_mutual_contact(user1: User, user2: User) -> bool:
        """Check if two users are mutual contacts."""
        # Ensure consistent ordering
        if user1.id > user2.id:
            user1, user2 = user2, user1

        contact = await Contact.filter(user1=user1, user2=user2).first()

        return contact is not None

    @staticmethod
    async def _create_contact(user1: User, user2: User) -> Contact:
        """Create a contact between two users (internal helper)."""
        # Ensure consistent ordering (user1_id < user2_id)
        if user1.id > user2.id:
            user1, user2 = user2, user1

        try:
            contact = await Contact.create(user1=user1, user2=user2)

            # Create system room for the new contacts
            from app.domains.auth.room_service import room_service

            await room_service.get_or_create_system_room(user1, user2)

            return contact
        except IntegrityError:
            # Contact already exists (shouldn't happen, but handle gracefully)
            existing_contact = await Contact.filter(user1=user1, user2=user2).first()
            if existing_contact:
                return existing_contact
            # If we still can't find it, re-raise the error
            raise


contact_service = ContactService()
