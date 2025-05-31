from tortoise import fields

from app.core.models import BaseModel


class User(BaseModel):
    username = fields.CharField(max_length=50, unique=True, index=True)
    hashed_password = fields.CharField(max_length=128)
    is_active = fields.BooleanField(default=True)

    def __str__(self):
        return self.username
