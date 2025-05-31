"""Test script for authentication endpoints."""
import asyncio
import httpx
from datetime import datetime

BASE_URL = "http://localhost:8000/v1/auth"


async def test_auth():
    async with httpx.AsyncClient() as client:
        # Test registration
        print("1. Testing registration...")
        register_data = {
            "username": f"testuser_{datetime.now().timestamp()}",
            "password": "testpassword123"
        }
        
        try:
            response = await client.post(f"{BASE_URL}/register", json=register_data)
            if response.status_code == 201:
                user = response.json()
                print(f"✓ Registration successful: {user}")
            else:
                print(f"✗ Registration failed: {response.status_code} - {response.text}")
                return
        except Exception as e:
            print(f"✗ Registration error: {e}")
            return
        
        # Test login
        print("\n2. Testing login...")
        login_data = {
            "username": register_data["username"],
            "password": register_data["password"]
        }
        
        try:
            response = await client.post(f"{BASE_URL}/login", json=login_data)
            if response.status_code == 200:
                token_data = response.json()
                print(f"✓ Login successful: {token_data}")
                access_token = token_data["access_token"]
            else:
                print(f"✗ Login failed: {response.status_code} - {response.text}")
                return
        except Exception as e:
            print(f"✗ Login error: {e}")
            return
        
        # Test getting current user
        print("\n3. Testing get current user...")
        headers = {"Authorization": f"Bearer {access_token}"}
        
        try:
            response = await client.get(f"{BASE_URL}/me", headers=headers)
            if response.status_code == 200:
                current_user = response.json()
                print(f"✓ Get current user successful: {current_user}")
            else:
                print(f"✗ Get current user failed: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"✗ Get current user error: {e}")
        
        # Test invalid token
        print("\n4. Testing invalid token...")
        invalid_headers = {"Authorization": "Bearer invalid_token"}
        
        try:
            response = await client.get(f"{BASE_URL}/me", headers=invalid_headers)
            if response.status_code == 401:
                print("✓ Invalid token correctly rejected")
            else:
                print(f"✗ Invalid token test failed: {response.status_code}")
        except Exception as e:
            print(f"✗ Invalid token test error: {e}")


if __name__ == "__main__":
    print("Authentication API Test\n" + "="*50)
    asyncio.run(test_auth()) 