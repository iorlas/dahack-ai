"""Test script for contact endpoints."""

import asyncio
from datetime import datetime

import httpx

BASE_URL = "http://localhost:8000/v1/auth"


async def register_and_login(client: httpx.AsyncClient, username: str, password: str):
    """Helper to register and login a user."""
    # Register
    await client.post(f"{BASE_URL}/register", json={"username": username, "password": password})

    # Login
    response = await client.post(
        f"{BASE_URL}/login", json={"username": username, "password": password}
    )
    return response.json()["access_token"]


async def test_contacts():
    async with httpx.AsyncClient() as client:
        timestamp = datetime.now().timestamp()

        # Create two test users
        print("1. Creating test users...")
        try:
            token1 = await register_and_login(client, f"user1_{timestamp}", "password123")
            token2 = await register_and_login(client, f"user2_{timestamp}", "password123")
            print("✓ Users created and logged in")
        except Exception as e:
            print(f"✗ User creation failed: {e}")
            return

        headers1 = {"Authorization": f"Bearer {token1}"}
        headers2 = {"Authorization": f"Bearer {token2}"}

        # Test sending invitation
        print("\n2. Testing contact invitation...")
        try:
            response = await client.post(
                f"{BASE_URL}/contacts/invite",
                json={"username": f"user2_{timestamp}"},
                headers=headers1,
            )
            if response.status_code == 200:
                invitation = response.json()
                invitation_id = invitation["id"]
                print(f"✓ Invitation sent: {invitation}")
            else:
                print(f"✗ Invitation failed: {response.status_code} - {response.text}")
                return
        except Exception as e:
            print(f"✗ Invitation error: {e}")
            return

        # Test viewing contacts (user1)
        print("\n3. Testing get contacts for user1...")
        try:
            response = await client.get(f"{BASE_URL}/contacts", headers=headers1)
            if response.status_code == 200:
                contacts = response.json()
                print(
                    f"✓ User1 contacts: sent={len(contacts['sent_invitations'])}, "
                    f"received={len(contacts['received_invitations'])}, "
                    f"contacts={len(contacts['contacts'])}"
                )
            else:
                print(f"✗ Get contacts failed: {response.status_code}")
        except Exception as e:
            print(f"✗ Get contacts error: {e}")

        # Test viewing contacts (user2)
        print("\n4. Testing get contacts for user2...")
        try:
            response = await client.get(f"{BASE_URL}/contacts", headers=headers2)
            if response.status_code == 200:
                contacts = response.json()
                print(
                    f"✓ User2 contacts: sent={len(contacts['sent_invitations'])}, "
                    f"received={len(contacts['received_invitations'])}, "
                    f"contacts={len(contacts['contacts'])}"
                )
            else:
                print(f"✗ Get contacts failed: {response.status_code}")
        except Exception as e:
            print(f"✗ Get contacts error: {e}")

        # Test accepting invitation
        print("\n5. Testing accept invitation...")
        try:
            response = await client.post(
                f"{BASE_URL}/contacts/{invitation_id}/accept", headers=headers2
            )
            if response.status_code == 200:
                contact = response.json()
                print(
                    f"✓ Invitation accepted, contact created with: {contact['other_user']['username']}"
                )
            else:
                print(f"✗ Accept failed: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"✗ Accept error: {e}")

        # Verify mutual contact
        print("\n6. Verifying mutual contact...")
        try:
            response = await client.get(f"{BASE_URL}/contacts", headers=headers1)
            if response.status_code == 200:
                contacts = response.json()
                if contacts["contacts"]:
                    print("✓ Users are now mutual contacts")
                    print(f"   User1 has {len(contacts['contacts'])} contact(s)")
                else:
                    print("✗ No mutual contacts found")
        except Exception as e:
            print(f"✗ Verification error: {e}")

        # Test duplicate invitation
        print("\n7. Testing duplicate invitation (should fail)...")
        try:
            response = await client.post(
                f"{BASE_URL}/contacts/invite",
                json={"username": f"user2_{timestamp}"},
                headers=headers1,
            )
            if response.status_code == 400:
                print("✓ Duplicate invitation correctly rejected")
            else:
                print(f"✗ Duplicate invitation test failed: {response.status_code}")
        except Exception as e:
            print(f"✗ Duplicate test error: {e}")

        # Test check mutual contact endpoint
        print("\n8. Testing check mutual contact...")
        try:
            response = await client.get(
                f"{BASE_URL}/contacts/check/user2_{timestamp}", headers=headers1
            )
            if response.status_code == 200:
                result = response.json()
                print(f"✓ Mutual contact check: {result}")
            else:
                print(f"✗ Check mutual contact failed: {response.status_code}")
        except Exception as e:
            print(f"✗ Check mutual contact error: {e}")


if __name__ == "__main__":
    print("Contact System Test\n" + "=" * 50)
    asyncio.run(test_contacts())
