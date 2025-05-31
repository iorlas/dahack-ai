from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext
from structlog import get_logger

from app.core.config import settings
from app.domains.auth.models import User
from app.domains.auth.schemas import TokenData

logger = get_logger()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


class AuthService:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a plain password against a hashed password."""
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        """Hash a password using bcrypt."""
        return pwd_context.hash(password)

    @staticmethod
    def create_access_token(data: dict) -> str:
        """Create a JWT access token."""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    @staticmethod
    def verify_token(token: str) -> TokenData | None:
        """Verify and decode a JWT token."""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
            username: str = payload.get("sub")
            exp: datetime = datetime.fromtimestamp(payload.get("exp"), tz=timezone.utc)
            if username is None:
                return None
            return TokenData(username=username, exp=exp)
        except JWTError:
            return None

    @staticmethod
    async def authenticate_user(username: str, password: str) -> User | None:
        """Authenticate a user by username and password."""
        user = await User.filter(username=username).first()
        if not user:
            return None
        if not AuthService.verify_password(password, user.hashed_password):
            return None
        if not user.is_active:
            return None
        return user

    @staticmethod
    async def create_user(username: str, password: str) -> User:
        """Create a new user with hashed password."""
        hashed_password = AuthService.get_password_hash(password)
        user = await User.create(username=username, hashed_password=hashed_password)
        return user


auth_service = AuthService() 