from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user_id
from app.core.database import get_db
from app.services.user_service import UserService


async def require_admin(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)) -> str:
    """Dependency that ensures the current user is an admin or superuser."""
    service = UserService(db)
    user = await service.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not (user.is_superuser or (hasattr(user, "role") and user.role == "admin")):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Admin privileges required")

    return user_id
