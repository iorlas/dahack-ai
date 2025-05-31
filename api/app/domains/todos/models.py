from tortoise import fields

from app.core.models import BaseModel


class Todo(BaseModel):
    title = fields.CharField(max_length=255, db_index=True)
    description = fields.TextField(null=True)
    completed = fields.BooleanField(default=False, db_index=True)
    due_date = fields.DatetimeField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Todo(id={self.id}, title={self.title})"
