# Authentication API

JWT-based authentication system with bcrypt password hashing.

## Endpoints

### Authentication

#### 1. Register User
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

#### 2. Login
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

#### 3. Get Current User
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

### Contacts

#### 4. Send Contact Invitation
```
POST /v1/contacts/invite
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "string"  // Username to invite
}

Response: 200 OK
{
  "id": 1,
  "from_user": { /* user object */ },
  "to_user": { /* user object */ },
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

#### 5. Accept Contact Invitation
```
POST /v1/contacts/{invitation_id}/accept
Authorization: Bearer <token>

Response: 200 OK
{
  "id": 1,
  "other_user": { /* user object */ },
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

#### 6. Reject Contact Invitation
```
POST /v1/contacts/{invitation_id}/reject
Authorization: Bearer <token>

Response: 204 No Content
```

#### 7. Get Contacts
```
GET /v1/contacts
Authorization: Bearer <token>

Response: 200 OK
{
  "sent_invitations": [
    { /* invitation objects */ }
  ],
  "received_invitations": [
    { /* invitation objects */ }
  ],
  "contacts": [
    { /* contact objects with other_user field */ }
  ]
}
```

### Rooms

#### 8. Create Room
```
POST /v1/rooms
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Room Name",
  "member_usernames": ["username1", "username2"]  // optional
}

Response: 201 Created
{
  "id": 1,
  "name": "Room Name",
  "owner": { /* user object */ },
  "is_system": false,
  "members": [{ /* member objects */ }],
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

#### 9. Get All Rooms
```
GET /v1/rooms
Authorization: Bearer <token>

Response: 200 OK
{
  "rooms": [{ /* room objects */ }]
}
```

#### 10. Get Specific Room
```
GET /v1/rooms/{room_id}
Authorization: Bearer <token>

Response: 200 OK
{ /* room object */ }
```

#### 11. Add Members to Room
```
POST /v1/rooms/{room_id}/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "usernames": ["username1", "username2"]
}

Response: 200 OK
{ /* updated room object */ }
```

#### 12. Leave Room
```
POST /v1/rooms/{room_id}/leave
Authorization: Bearer <token>

Response: 204 No Content
```

#### 13. Delete Room
```
DELETE /v1/rooms/{room_id}
Authorization: Bearer <token>

Response: 204 No Content
```

### Messages

#### 14. Get Message History
```
GET /v1/messages/rooms/{room_id}/history?limit=50&before_id=123
Authorization: Bearer <token>

Response: 200 OK
{
  "messages": [
    {
      "id": 1,
      "room_id": 5,
      "sender": { /* user object */ },
      "content": "Hello!",
      "edited_at": null,
      "created_at": "2024-01-01T00:00:00",
      "updated_at": "2024-01-01T00:00:00"
    }
  ],
  "has_more": true
}
```

#### 15. WebSocket for Real-time Messages
```
WS /v1/messages/ws
```

See [MESSAGING_SYSTEM.md](../../MESSAGING_SYSTEM.md) for detailed WebSocket protocol documentation.

## Contact Flow

1. User A sends invitation to User B
2. User B sees the invitation in `received_invitations`
3. User B accepts or rejects the invitation
4. If accepted, both users see each other in `contacts`
5. If User B had already invited User A, the invitation auto-accepts
6. When accepted, a system room is automatically created for the two users

## Room Types

1. **System Rooms**: Auto-created when contacts connect, always 2 users, cannot be modified
2. **User Rooms**: Created manually, owner can add/remove members from contacts

## Messaging System

Real-time messaging using WebSockets and Redis pub/sub:

1. **WebSocket Connection**: Clients connect with JWT authentication
2. **Room Subscriptions**: Clients subscribe to rooms they're members of
3. **Message Flow**: Messages saved to DB and broadcast via Redis
4. **Scalability**: Redis pub/sub enables horizontal scaling

## Security Features

- Passwords salted and hashed with bcrypt
- JWT tokens with configurable expiration (default: 8 days)
- Username validation (alphanumeric only)
- Password minimum length: 8 characters
- Contact invitations require authentication
- Users cannot add themselves as contacts
- WebSocket connections require JWT authentication
- Room membership validated for all message operations

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

# Send contact invitation
response = httpx.post(
    "http://localhost:8000/v1/contacts/invite",
    json={"username": "otheruser"},
    headers={"Authorization": f"Bearer {token}"}
)

# Get contacts
response = httpx.get(
    "http://localhost:8000/v1/contacts",
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
