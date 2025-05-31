import structlog
from redis import Redis
from redis.asyncio import Redis as AsyncRedis

from app.core.config import settings

logger = structlog.get_logger()


class RedisService:
    _instance = None
    _redis: Redis | None = None
    _async_redis: AsyncRedis | None = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @classmethod
    def get_redis(cls) -> Redis:
        if cls._redis is None:
            cls._redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)
            logger.info("redis_connected", url=settings.REDIS_URL)
        return cls._redis

    @classmethod
    async def get_async_redis(cls) -> AsyncRedis:
        if cls._async_redis is None:
            cls._async_redis = AsyncRedis.from_url(settings.REDIS_URL, decode_responses=True)
            logger.info("async_redis_connected", url=settings.REDIS_URL)
        return cls._async_redis

    @classmethod
    async def close_async_redis(cls):
        if cls._async_redis is not None:
            await cls._async_redis.close()
            cls._async_redis = None
            logger.info("async_redis_disconnected")


redis_service = RedisService()
