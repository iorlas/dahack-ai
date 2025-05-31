"""Test script for contact endpoints."""

import asyncio
from datetime import datetime
from http import HTTPStatus

import httpx

BASE_URL = "http://localhost:8000/v1/auth"
HTTP_OK = HTTPStatus.OK
HTTP_BAD_REQUEST = HTTPStatus.BAD_REQUEST


async def register_and_login(client: httpx.AsyncClient, username: str, password: str) -> str:
    """Helper to register and login a user."""
    # Register
    await client.post(f"{BASE_URL}/register", json={"username": username, "password": password})

    # Login
    response = await client.post(
        f"{BASE_URL}/login", json={"username": username, "password": password}
    )
    return response.json()["access_token"]


async def create_test_users(client: httpx.AsyncClient, timestamp: float) -> tuple[str, str]:
    """Create and login two test users."""
    print("1. Creating test users...")
    try:
        token1 = await register_and_login(client, f"user1_{timestamp}", "password123")
        token2 = await register_and_login(client, f"user2_{timestamp}", "password123")
        print("✓ Users created and logged in")
        return token1, token2
    except Exception as e:
        print(f"✗ User creation failed: {e}")
        raise


async def send_contact_invitation(client: httpx.AsyncClient, headers: dict, username: str) -> int:
    """Send a contact invitation and return invitation ID."""
    print("\n2. Testing contact invitation...")
    try:
        response = await client.post(
            f"{BASE_URL}/contacts/invite",
            json={"username": username},
            headers=headers,
        )
        if response.status_code == HTTP_OK:
            invitation = response.json()
            invitation_id = invitation["id"]
            print(f"✓ Invitation sent: {invitation}")
            return invitation_id
        else:
            print(f"✗ Invitation failed: {response.status_code} - {response.text}")
            raise RuntimeError("Invitation failed")
    except Exception as e:
        print(f"✗ Invitation error: {e}")
        raise


async def check_user_contacts(client: httpx.AsyncClient, headers: dict, user_name: str) -> dict:
    """Check user contacts and return the response."""
    print(f"\n3. Testing get contacts for {user_name}...")
    try:
        response = await client.get(f"{BASE_URL}/contacts", headers=headers)
        if response.status_code == HTTP_OK:
            contacts = response.json()
            print(
                f"✓ {user_name} contacts: sent={len(contacts['sent_invitations'])}, "
                f"received={len(contacts['received_invitations'])}, "
                f"contacts={len(contacts['contacts'])}"
            )
            return contacts
        else:
            print(f"✗ Get contacts failed: {response.status_code}")
            raise RuntimeError("Get contacts failed")
    except Exception as e:
        print(f"✗ Get contacts error: {e}")
        raise


async def accept_invitation(client: httpx.AsyncClient, headers: dict, invitation_id: int) -> dict:
    """Accept a contact invitation."""
    print("\n4. Testing accept invitation...")
    try:
        response = await client.post(f"{BASE_URL}/contacts/{invitation_id}/accept", headers=headers)
        if response.status_code == HTTP_OK:
            contact = response.json()
            username = contact["other_user"]["username"]
            print(f"✓ Invitation accepted, contact created with: {username}")
            return contact
        else:
            print(f"✗ Accept failed: {response.status_code} - {response.text}")
            raise RuntimeError("Accept invitation failed")
    except Exception as e:
        print(f"✗ Accept error: {e}")
        raise


async def verify_mutual_contact(client: httpx.AsyncClient, headers: dict) -> None:
    """Verify that users are mutual contacts."""
    print("\n5. Verifying mutual contact...")
    try:
        response = await client.get(f"{BASE_URL}/contacts", headers=headers)
        if response.status_code == HTTP_OK:
            contacts = response.json()
            if contacts["contacts"]:
                print("✓ Users are now mutual contacts")
                print(f"   User1 has {len(contacts['contacts'])} contact(s)")
            else:
                print("✗ No mutual contacts found")
        else:
            print(f"✗ Verification failed: {response.status_code}")
    except Exception as e:
        print(f"✗ Verification error: {e}")


async def test_duplicate_invitation(
    client: httpx.AsyncClient, headers: dict, username: str
) -> None:
    """Test that duplicate invitations are rejected."""
    print("\n6. Testing duplicate invitation (should fail)...")
    try:
        response = await client.post(
            f"{BASE_URL}/contacts/invite",
            json={"username": username},
            headers=headers,
        )
        if response.status_code == HTTP_BAD_REQUEST:
            print("✓ Duplicate invitation correctly rejected")
        else:
            print(f"✗ Duplicate invitation test failed: {response.status_code}")
    except Exception as e:
        print(f"✗ Duplicate test error: {e}")


async def test_mutual_contact_check(
    client: httpx.AsyncClient, headers: dict, username: str
) -> None:
    """Test the mutual contact check endpoint."""
    print("\n7. Testing check mutual contact...")
    try:
        response = await client.get(f"{BASE_URL}/contacts/check/{username}", headers=headers)
        if response.status_code == HTTP_OK:
            result = response.json()
            print(f"✓ Mutual contact check: {result}")
        else:
            print(f"✗ Check mutual contact failed: {response.status_code}")
    except Exception as e:
        print(f"✗ Check mutual contact error: {e}")


async def test_contacts() -> None:
    """Main test function for contact system."""
    async with httpx.AsyncClient() as client:
        timestamp = datetime.now().timestamp()
        user2_username = f"user2_{timestamp}"

        # Create test users
        token1, token2 = await create_test_users(client, timestamp)
        headers1 = {"Authorization": f"Bearer {token1}"}
        headers2 = {"Authorization": f"Bearer {token2}"}

        # Send invitation
        invitation_id = await send_contact_invitation(client, headers1, user2_username)

        # Check contacts for both users
        await check_user_contacts(client, headers1, "user1")
        await check_user_contacts(client, headers2, "user2")

        # Accept invitation
        await accept_invitation(client, headers2, invitation_id)

        # Verify mutual contact
        await verify_mutual_contact(client, headers1)

        # Test duplicate invitation
        await test_duplicate_invitation(client, headers1, user2_username)

        # Test mutual contact check
        await test_mutual_contact_check(client, headers1, user2_username)


if __name__ == "__main__":
    print("Contact System Test\n" + "=" * 50)
    asyncio.run(test_contacts())
