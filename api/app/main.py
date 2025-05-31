from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from structlog import get_logger

from app.core.config import settings
from app.domains.health.api import router as health_router
from app.domains.todos.api import router as todos_router

logger = get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.core.db import close_db, init_db

    await init_db()
    yield
    await close_db()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
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
