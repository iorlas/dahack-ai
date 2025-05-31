from fastapi import APIRouter, HTTPException, Query, status

from app.domains.todos.models import Todo
from app.domains.todos.schemas import Todo as TodoSchema
from app.domains.todos.schemas import TodoCreate, TodoUpdate

router = APIRouter(prefix="/todos", tags=["todos"])


@router.post("", response_model=TodoSchema, status_code=status.HTTP_201_CREATED)
async def create_todo(todo: TodoCreate) -> Todo:
    todo_obj = await Todo.create(**todo.model_dump())
    return todo_obj


@router.get("", response_model=list[TodoSchema])
async def list_todos(
    completed: bool | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
) -> list[Todo]:
    """List todos with optional filtering and pagination."""
    query = Todo.all()
    if completed is not None:
        query = query.filter(completed=completed)
    return await query.offset(skip).limit(limit)


@router.get("/{todo_id}", response_model=TodoSchema)
async def get_todo(todo_id: str) -> Todo:
    """Get a todo by ID."""
    todo = await Todo.get_or_none(id=todo_id)
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found",
        )
    return todo


@router.patch("/{todo_id}", response_model=TodoSchema)
async def update_todo(todo_id: str, todo_update: TodoUpdate) -> Todo:
    """Update a todo."""
    todo = await Todo.get_or_none(id=todo_id)
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found",
        )

    update_data = todo_update.model_dump(exclude_unset=True)
    await todo.update_from_dict(update_data).save()
    return todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(todo_id: str) -> None:
    """Delete a todo."""
    todo = await Todo.get_or_none(id=todo_id)
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found",
        )
    await todo.delete()
