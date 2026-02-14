"""
Direct Test - runs within the same process to see actual errors
"""
import asyncio
from app.core.database import AsyncSessionLocal, create_tables
from app.services.user_service import UserService
from app.schemas.user import UserCreate


async def test_register():
    """Test user registration directly"""
    print("Testing direct registration...")

    # Create tables first
    print("Creating tables...")
    await create_tables()

    async with AsyncSessionLocal() as session:
        try:
            service = UserService(session)

            # Check if exists
            existing = await service.get_by_email("direct_test@example.com")
            print(f"Existing user: {existing}")

            if not existing:
                # Create user data
                user_data = UserCreate(
                    email="direct_test@example.com",
                    password="TestPass123!",
                    full_name="Direct Test User"
                )

                # Create user
                print("Creating user...")
                user = await service.create(user_data)
                await session.commit()

                print(f"User created: {user.id}, {user.email}")
            else:
                print("User already exists")

        except Exception as e:
            print(f"Error: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_register())
