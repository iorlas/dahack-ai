# Contact System Flow Diagram

## Database Structure

```
┌─────────────────┐       ┌─────────────────┐
│   INVITATIONS   │       │    CONTACTS     │
├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │
│ from_user_id ───┼──┐    │ user1_id ───────┼──┐
│ to_user_id ─────┼──┤    │ user2_id ───────┼──┤
│ created_at      │  │    │ created_at      │  │
│ updated_at      │  │    │ updated_at      │  │
└─────────────────┘  │    └─────────────────┘  │
                     │                          │
                     └──────────┬───────────────┘
                                │
                         ┌──────▼──────┐
                         │    USERS    │
                         ├─────────────┤
                         │ id          │
                         │ username    │
                         │ ...         │
                         └─────────────┘
```

## Flow Example

### 1. Alice invites Bob
```
INVITATIONS table:
┌────┬──────────────┬────────────┐
│ id │ from_user_id │ to_user_id │
├────┼──────────────┼────────────┤
│ 1  │ 1 (Alice)    │ 2 (Bob)    │
└────┴──────────────┴────────────┘

CONTACTS table: (empty)
```

### 2. Bob accepts invitation
```
INVITATIONS table: (record deleted)

CONTACTS table:
┌────┬───────────┬───────────┐
│ id │ user1_id  │ user2_id  │
├────┼───────────┼───────────┤
│ 1  │ 1 (Alice) │ 2 (Bob)   │
└────┴───────────┴───────────┘

Note: Always stored with lower ID first (user1_id < user2_id)
```

## API Flow

```
User A                          Server                          User B
  │                               │                               │
  ├──POST /contacts/invite────────►                               │
  │  {"username": "userB"}        │                               │
  │                               ├──Create INVITATION record──►  │
  │◄──200 OK (invitation)─────────┤                               │
  │                               │                               │
  │                               │◄──GET /contacts───────────────┤
  │                               ├──Return received_invitations──►│
  │                               │                               │
  │                               │◄──POST /contacts/{id}/accept──┤
  │                               ├──Delete INVITATION─────────►  │
  │                               ├──Create CONTACT record────►   │
  │                               ├──200 OK (contact)─────────────►│
  │                               │                               │
  │──GET /contacts────────────────►                               │
  │◄──Return contacts─────────────┤                               │
  │  (both users see each other)  │                               │
```

## Key Design Decisions

1. **Invitations are directional**: from_user → to_user
2. **Contacts are symmetric**: stored once with consistent ordering
3. **Auto-accept**: If both users invite each other, second invitation triggers acceptance
4. **Clean separation**: Pending vs accepted states in different tables
