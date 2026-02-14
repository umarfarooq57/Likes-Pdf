"""
User Schemas
Pydantic models for user data validation
"""

from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


# ============== Auth Schemas ==============

class UserRegister(BaseModel):
    """User registration request"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    full_name: Optional[str] = Field(None, max_length=255)


class UserLogin(BaseModel):
    """User login request"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenRefresh(BaseModel):
    """Token refresh request"""
    refresh_token: str


# ============== User Schemas ==============

class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """Create user schema"""
    password: str


class UserUpdate(BaseModel):
    """Update user schema"""
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None


class UserResponse(UserBase):
    """User response schema"""
    id: UUID
    role: str = "free"
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    storage_used: int = 0
    conversions_today: int = 0
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserProfile(BaseModel):
    """User profile for dashboard"""
    id: UUID
    email: str
    full_name: Optional[str]
    role: str = "free"
    avatar_url: Optional[str]
    storage_used: int = 0
    conversions_today: int = 0
    created_at: datetime

    class Config:
        from_attributes = True
