from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from structlog import get_logger

from app.core.config import settings
from app.core.redis import redis_service
from app.core.s3 import s3_service
from app.domains.health.api import router as health_router
from app.domains.todos.api import router as todos_router

logger = get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.core.db import close_db, init_db

    await init_db()
    await startup_event()
    yield
    await close_db()
    await shutdown_event()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

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
app.include_router(todos_router, prefix="/v1")


@app.on_event("startup")
async def startup_event():
    # Initialize Redis
    redis_service.get_redis()
    await redis_service.get_async_redis()
    logger.info("redis_initialized")

    # Initialize S3
    await s3_service.get_session()
    logger.info("s3_initialized")


@app.on_event("shutdown")
async def shutdown_event():
    # Close Redis connection
    await redis_service.close_async_redis()
    logger.info("redis_connection_closed")


@app.get("/v1/healthz")
async def health_check():
    return {"status": "healthy"}
