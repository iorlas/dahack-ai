from tortoise import Tortoise

from app.core.config import settings

TORTOISE_ORM = {
    "connections": {"default": settings.DATABASE_URL},
    "apps": {
        "models": {
            "models": ["app.domains.todos.models", "aerich.models"],
            "default_connection": "default",
        }
    },
}


async def init_db():
    """Initialize database connection."""
    await Tortoise.init(config=TORTOISE_ORM)
    await Tortoise.generate_schemas()


async def close_db():
    """Close database connections."""
    await Tortoise.close_connections()
