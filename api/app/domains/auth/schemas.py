from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not v.isalnum():
            raise ValueError("Username must contain only alphanumeric characters")
        return v


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: str
    exp: datetime


class UserResponse(BaseModel):

    class Config:
        from_attributes = True
    id: int
    username: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ContactInvite(BaseModel):
    username: str = Field(..., description="Username of the user to invite")


class InvitationResponse(BaseModel):

    class Config:
        from_attributes = True
    id: int
    from_user: UserResponse
    to_user: UserResponse
    created_at: datetime
    updated_at: datetime


class ContactResponse(BaseModel):

    class Config:
        from_attributes = True
    id: int
    other_user: UserResponse  # Will be populated with the other user in the contact
    created_at: datetime
    updated_at: datetime


class ContactListResponse(BaseModel):
    sent_invitations: list[InvitationResponse]
    received_invitations: list[InvitationResponse]
    contacts: list[ContactResponse]
