"""Comprehensive test for authentication and contacts."""

import asyncio

# Import test modules
from test_auth import test_auth
from test_contacts import test_contacts


async def main():
    """Run all tests."""
    print("=" * 70)
    print("RUNNING ALL TESTS")
    print("=" * 70)

    # Ensure API is running
    print("\nMake sure the API is running at http://localhost:8000")
    print("You can start it with: docker-compose up\n")

    input("Press Enter to continue...")

    # Run authentication tests
    print("\n" + "=" * 70)
    print("AUTHENTICATION TESTS")
    print("=" * 70)
    await test_auth()

    # Run contact tests
    print("\n" + "=" * 70)
    print("CONTACT TESTS")
    print("=" * 70)
    await test_contacts()

    print("\n" + "=" * 70)
    print("ALL TESTS COMPLETED")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())
