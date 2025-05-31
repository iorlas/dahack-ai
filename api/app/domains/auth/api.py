from fastapi import APIRouter, Depends, HTTPException, status
from structlog import get_logger

from app.domains.auth.dependencies import get_current_active_user
from app.domains.auth.models import User
from app.domains.auth.schemas import (
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
async def get_current_user(current_user: User = Depends(get_current_active_user)) -> User:
    """Get current authenticated user."""
    return current_user
