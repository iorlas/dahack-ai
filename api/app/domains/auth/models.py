from tortoise import fields

from app.core.models import BaseModel


class User(BaseModel):
    class Meta:
        table = "users"

    username = fields.CharField(max_length=50, unique=True, index=True)
    hashed_password = fields.CharField(max_length=128)
    is_active = fields.BooleanField(default=True)

    def __str__(self):
        return self.username


class Invitation(BaseModel):
    class Meta:
        table = "invitations"
        unique_together = (("from_user", "to_user"),)

    from_user = fields.ForeignKeyField("models.User", related_name="sent_invitations")
    to_user = fields.ForeignKeyField("models.User", related_name="received_invitations")

    def __str__(self):
        return f"{self.from_user} -> {self.to_user}"


class Contact(BaseModel):
    class Meta:
        table = "contacts"
        unique_together = (("user1", "user2"),)

    # Store contacts with user1_id < user2_id for consistency
    user1 = fields.ForeignKeyField("models.User", related_name="contacts_as_user1")
    user2 = fields.ForeignKeyField("models.User", related_name="contacts_as_user2")

    def __str__(self):
        return f"{self.user1} <-> {self.user2}"


class Room(BaseModel):
    class Meta:
        table = "rooms"

    name = fields.CharField(max_length=255, null=True)
    owner = fields.ForeignKeyField("models.User", related_name="owned_rooms", null=True)
    is_system = fields.BooleanField(default=False)

    def __str__(self):
        return f"Room({self.id}, system={self.is_system})"


class RoomMember(BaseModel):
    class Meta:
        table = "room_members"
        unique_together = (("room", "user"),)

    room = fields.ForeignKeyField("models.Room", related_name="members")
    user = fields.ForeignKeyField("models.User", related_name="room_memberships")
    joined_at = fields.DatetimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} in {self.room}"
