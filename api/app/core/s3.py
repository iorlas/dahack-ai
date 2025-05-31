import os
from contextlib import AbstractAsyncContextManager
from typing import Any, cast

import aioboto3
import aiofiles
import structlog
from aioboto3.session import Session
from mypy_boto3_s3.client import S3Client as BotoS3Client
from mypy_boto3_s3.type_defs import FileobjTypeDef

from app.core.config import settings

logger = structlog.get_logger()


class S3Service:
    _instance: "S3Service | None" = None
    _session: Session | None = None

    def __new__(cls) -> "S3Service":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @classmethod
    async def get_session(cls) -> Session:
        if cls._session is None:
            cls._session = aioboto3.Session()
            logger.info("s3_session_created")
        return cls._session

    @classmethod
    async def get_s3_client(cls) -> AbstractAsyncContextManager[BotoS3Client]:
        session = await cls.get_session()
        return cast(
            AbstractAsyncContextManager[BotoS3Client],
            session.client(  # type: ignore[return-value]
                "s3",
                endpoint_url=settings.S3_ENDPOINT,
                aws_access_key_id=settings.S3_ACCESS_KEY,
                aws_secret_access_key=settings.S3_SECRET_KEY,
                region_name=settings.S3_REGION,
            ),
        )

    @classmethod
    async def upload_file(
        cls, file_path: str, object_name: str | None = None, content_type: str | None = None
    ) -> str:
        """Upload a file to S3 bucket"""
        if object_name is None:
            object_name = os.path.basename(file_path)

        async with await cls.get_s3_client() as s3:  # type: ignore[misc]
            extra_args: dict[str, Any] = {}
            if content_type:
                extra_args["ContentType"] = content_type

            async with aiofiles.open(file_path, "rb") as file:
                file_obj = cast(FileobjTypeDef, file)
                await s3.upload_fileobj(  # type: ignore[misc]
                    file_obj, settings.S3_BUCKET_NAME, object_name, ExtraArgs=extra_args
                )

            logger.info("file_uploaded", object_name=object_name)
            return object_name

    @classmethod
    async def download_file(cls, object_name: str, file_path: str) -> None:
        """Download a file from S3 bucket"""
        async with await cls.get_s3_client() as s3:  # type: ignore[misc]
            async with aiofiles.open(file_path, "wb") as file:
                file_obj = cast(FileobjTypeDef, file)
                await s3.download_fileobj(settings.S3_BUCKET_NAME, object_name, file_obj)  # type: ignore[misc]
            logger.info("file_downloaded", object_name=object_name)

    @classmethod
    async def get_presigned_url(cls, object_name: str, expiration: int = 3600) -> str:
        """Generate a presigned URL for an S3 object"""
        async with await cls.get_s3_client() as s3:  # type: ignore[misc]
            url = await s3.generate_presigned_url(  # type: ignore[misc]
                "get_object",
                Params={"Bucket": settings.S3_BUCKET_NAME, "Key": object_name},
                ExpiresIn=expiration,
            )
            logger.info("presigned_url_generated", object_name=object_name)
            return url

    @classmethod
    async def delete_file(cls, object_name: str) -> None:
        """Delete a file from S3 bucket"""
        async with await cls.get_s3_client() as s3:  # type: ignore[misc]
            await s3.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=object_name)  # type: ignore[misc]
            logger.info("file_deleted", object_name=object_name)


s3_service = S3Service()
