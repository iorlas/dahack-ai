#!/usr/bin/env python
"""Database migration runner."""

import asyncio
import os
import sys
from pathlib import Path

import asyncpg
from structlog import get_logger

logger = get_logger()


async def wait_for_db(database_url: str, max_retries: int = 30):
    """Wait for database to be ready."""
    for i in range(max_retries):
        try:
            conn = await asyncpg.connect(database_url)
            await conn.close()
            logger.info("database_ready")
            return True
        except Exception:
            logger.info("waiting_for_database", attempt=i + 1, max_retries=max_retries)
            await asyncio.sleep(1)

    logger.error("database_not_ready")
    return False


async def run_sql_migrations(database_url: str):
    """Run SQL migration files."""
    migrations_dir = Path("migrations")
    if not migrations_dir.exists():
        logger.info("no_migrations_directory")
        return True

    sql_files = sorted(migrations_dir.glob("*.sql"))
    if not sql_files:
        logger.info("no_migrations_found")
        return True

    conn = await asyncpg.connect(database_url)

    try:
        # Create migrations tracking table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS _sql_migrations (
                filename VARCHAR(255) PRIMARY KEY,
                applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """)

        for sql_file in sql_files:
            filename = sql_file.name

            # Check if migration was already applied
            result = await conn.fetchval(
                "SELECT COUNT(*) FROM _sql_migrations WHERE filename = $1", filename
            )

            if result > 0:
                logger.info("migration_already_applied", filename=filename)
                continue

            logger.info("applying_migration", filename=filename)

            # Read and execute SQL file
            sql_content = sql_file.read_text()

            # Execute in a transaction
            async with conn.transaction():
                await conn.execute(sql_content)

                # Record migration as applied
                await conn.execute("INSERT INTO _sql_migrations (filename) VALUES ($1)", filename)

            logger.info("migration_applied", filename=filename)

        return True

    except Exception as e:
        logger.error("migration_failed", error=str(e))
        return False
    finally:
        await conn.close()


async def main():
    """Run migrations."""
    # Build database URL from environment variables
    db_user = os.getenv("POSTGRES_USER", "postgres")
    db_pass = os.getenv("POSTGRES_PASSWORD", "postgres")
    db_host = os.getenv("POSTGRES_SERVER", "localhost")
    db_name = os.getenv("POSTGRES_DB", "app")

    database_url = f"postgresql://{db_user}:{db_pass}@{db_host}/{db_name}"

    logger.info("starting_migrations", host=db_host, database=db_name)

    # Wait for database
    if not await wait_for_db(database_url):
        sys.exit(1)

    # Run migrations
    if await run_sql_migrations(database_url):
        logger.info("migrations_completed")
        sys.exit(0)
    else:
        logger.error("migrations_failed")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
