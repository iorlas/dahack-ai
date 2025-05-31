import pytest
from fastapi.testclient import TestClient
from testcontainers.postgres import PostgresContainer

from app.core.config import settings
from app.main import app


@pytest.fixture(scope="session")
def postgres_container():
    container = PostgresContainer(
        image="postgres:15",
        username=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD,
        dbname=settings.POSTGRES_DB,
    )
    container.start()
    yield (
        container,
        container.get_connection_url(driver=None).replace("postgresql", "postgres"),
    )
    container.stop()


@pytest.fixture(scope="session")
def test_client(postgres_container):
    # Update database URL to use the container
    settings.DATABASE_URL = postgres_container[1]
    with TestClient(app) as client:
        yield client
