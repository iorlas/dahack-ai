# DAHack AI Backend

FastAPI backend for DAHack AI project.

## Core Functionality

- FastAPI with async support
- PostgreSQL database with Tortoise ORM
- Aerich migrations
- JWT authentication
- CORS middleware
- Structured logging
- Environment-based configuration
- Health check endpoints

## Prerequisites

- Python 3.12+
- PostgreSQL 15+
- UV package manager

## Setup

1. Install UV if you haven't already:
```bash
pip install uv
```

2. Create a virtual environment and install dependencies:
```bash
cd api
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -e .
```

3. Create a `.env` file in the `api` directory with the following variables:
```env
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=dahack
SECRET_KEY=your-secret-key-here
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
```

4. Initialize the database:
```bash
aerich init-db
```

## Development

1. Start the development server:
```bash
uvicorn app.main:app --reload --port 8000
```

2. Access the API documentation:
- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc

## Database Migrations

1. Create a new migration:
```bash
aerich migrate
```

2. Apply migrations:
```bash
aerich upgrade
```

## Testing

Run tests with pytest:
```bash
pytest
```

## Project Structure

```
api/
├── aerich.ini           # Aerich configuration
├── app/
│   ├── core/           # Core functionality
│   │   ├── config.py   # Application configuration
│   │   ├── db.py      # Database configuration
│   │   └── models.py  # Base models
│   ├── domains/        # Domain modules
│   │   ├── auth/      # Authentication domain
│   │   │   ├── api.py
│   │   │   ├── models.py
│   │   │   └── schemas.py
│   │   ├── health/    # Health check domain
│   │   │   └── api.py
│   │   └── users/     # Users domain
│   │       ├── api.py
│   │       ├── models.py
│   │       └── schemas.py
│   └── main.py        # Application entry point
├── tests/             # Test files
├── .env              # Environment variables
├── pyproject.toml    # Project dependencies
├── uv.toml          # UV configuration
└── README.md        # This file
```

## Domain-Driven Design

The project follows Domain-Driven Design (DDD) principles:

1. **Core Domain**: The main business logic and value proposition
2. **Supporting Subdomains**: Supporting functionality
3. **Generic Subdomains**: Common functionality used across domains

### Adding New Domains

To add a new domain:

1. Create a new directory under `app/domains/`
2. Add the following files:
   - `api.py` - API endpoints
   - `models.py` - Domain models
   - `schemas.py` - Pydantic schemas
3. Add the domain's models to `app/core/db.py`
4. Include the domain's router in `app/main.py`

### Domain Structure

Each domain should contain:
- Models: Domain entities and value objects
- Schemas: Data transfer objects (DTOs)
- API: REST endpoints
- Services: Business logic (if needed)
- Repositories: Data access (if needed)
