import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from structlog import get_logger

from app.core.config import settings
from app.core.db import close_db, init_db
from app.core.redis import redis_service
from app.core.s3 import s3_service
from app.domains.auth.api import router as auth_router
from app.domains.auth.contacts_api import router as contacts_router
from app.domains.auth.messages_api import redis_listener
from app.domains.auth.messages_api import router as messages_router
from app.domains.auth.rooms_api import router as rooms_router
from app.domains.health.api import router as health_router

logger = get_logger()


async def startup_event():
    # Initialize Redis
    redis_service.get_redis()
    await redis_service.get_async_redis()
    logger.info("redis_initialized")

    # Initialize S3
    await s3_service.get_session()
    logger.info("s3_initialized")


async def shutdown_event():
    # Close Redis connection
    await redis_service.close_async_redis()
    logger.info("redis_connection_closed")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await startup_event()

    # Start Redis listener for WebSocket messages
    redis_task = asyncio.create_task(redis_listener())

    yield

    # Cancel Redis listener
    redis_task.cancel()
    try:
        await redis_task
    except asyncio.CancelledError:
        pass

    await close_db()
    await shutdown_event()


app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION, lifespan=lifespan)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include domain routers
app.include_router(health_router, prefix="/v1")
app.include_router(auth_router, prefix="/v1")
app.include_router(contacts_router, prefix="/v1")
app.include_router(rooms_router, prefix="/v1")
app.include_router(messages_router, prefix="/v1")
