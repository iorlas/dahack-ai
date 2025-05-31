from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TodoBase(BaseModel):
    """Base todo schema with common attributes."""

    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    due_date: datetime | None = None


class TodoCreate(TodoBase):
    """Schema for creating a new todo."""

    pass


class TodoUpdate(BaseModel):
    """Schema for updating a todo."""

    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    completed: bool | None = None
    due_date: datetime | None = None


class TodoInDB(TodoBase):
    model_config = ConfigDict(
        extra="ignore",
        str_strip_whitespace=True,
        validate_default=True,
        validate_assignment=True,
        from_attributes=True,
        populate_by_name=True,
    )

    id: int
    completed: bool
    created_at: datetime
    updated_at: datetime


class Todo(TodoInDB):
    """Schema for todo response."""

    pass
