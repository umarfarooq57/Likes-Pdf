"""Admin endpoints: user management and basic site stats."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.permissions import require_admin
from app.services.user_service import UserService
from app.schemas.user import UserResponse, UserUpdate
from app.models.user import User


router = APIRouter()


@router.get("/users", response_model=List[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    stmt = select(User).limit(100)
    result = await db.execute(stmt)
    users = result.scalars().all()
    return users


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    service = UserService(db)
    user = await service.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.patch("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(user_id: str, payload: UserUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    service = UserService(db)
    updated = await service.update(user_id, payload)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return updated
