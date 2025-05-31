# Authentication API

JWT-based authentication system with bcrypt password hashing.

## Endpoints

### 1. Register User
```
POST /v1/auth/register
Content-Type: application/json

{
  "username": "string",  // 3-50 chars, alphanumeric only
  "password": "string"   // min 8 chars
}

Response: 201 Created
{
  "id": 1,
  "username": "string",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

### 2. Login
```
POST /v1/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}

Response: 200 OK
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

### 3. Get Current User
```
GET /v1/auth/me
Authorization: Bearer <token>

Response: 200 OK
{
  "id": 1,
  "username": "string",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

## Security Features

- Passwords salted and hashed with bcrypt
- JWT tokens with configurable expiration (default: 8 days)
- Username validation (alphanumeric only)
- Password minimum length: 8 characters

## Usage Example

```python
import httpx

# Register
response = httpx.post(
    "http://localhost:8000/v1/auth/register",
    json={"username": "testuser", "password": "securepass123"}
)

# Login
response = httpx.post(
    "http://localhost:8000/v1/auth/login",
    json={"username": "testuser", "password": "securepass123"}
)
token = response.json()["access_token"]

# Use protected endpoint
response = httpx.get(
    "http://localhost:8000/v1/auth/me",
    headers={"Authorization": f"Bearer {token}"}
)
```

## Database Migration

### Automatic (Docker Compose)
Migrations run automatically when using docker-compose:
```bash
docker-compose up
```

### Manual
For manual migration:
```bash
cd api
python run_migrations.py

# Or with Aerich:
aerich init-db  # First time only
aerich migrate --name add_users_table
aerich upgrade
```
