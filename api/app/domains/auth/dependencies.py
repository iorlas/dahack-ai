from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.domains.auth.models import User
from app.domains.auth.service import auth_service

security = HTTPBearer()
security_dependency = Depends(security)


async def get_current_user(credentials: HTTPAuthorizationCredentials = security_dependency) -> User:
    """Get the current authenticated user from JWT token."""
    token = credentials.credentials
    token_data = auth_service.verify_token(token)

    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await User.filter(username=token_data.username).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    return user


get_current_user_dependency = Depends(get_current_user)


async def get_current_active_user(current_user: User = get_current_user_dependency) -> User:
    """Get the current active user."""
    return current_user


get_current_active_user_dependency = Depends(get_current_active_user)


# Type aliases for cleaner usage
CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentActiveUser = Annotated[User, Depends(get_current_active_user)]
