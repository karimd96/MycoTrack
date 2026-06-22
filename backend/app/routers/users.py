import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..deps import require_admin
from ..models import User
from ..repositories import RoleRepository, UserRepository
from ..schemas import UserCreate, UserOut, UserUpdate
from ..security import hash_password

router = APIRouter(prefix="/users", tags=["users"])


async def _resolve_role_id(session: AsyncSession, role_name: str) -> uuid.UUID:
    role = await RoleRepository(session).get_by_name(role_name)
    if role is None:
        raise HTTPException(status_code=400, detail=f"Unknown role: {role_name}")
    return role.id


@router.get("", response_model=list[UserOut])
async def list_users(
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    return await UserRepository(session).list(order_by="email", limit=500)


@router.get("/{user_id}", response_model=UserOut)
async def get_user(
    user_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    user = await UserRepository(session).get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("", response_model=UserOut, status_code=201)
async def create_user(
    payload: UserCreate,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    users = UserRepository(session)
    if await users.get_by_email(payload.email.lower()):
        raise HTTPException(status_code=400, detail="Email already registered")
    role_id = await _resolve_role_id(session, payload.role_name)
    return await users.create(
        {
            "email": payload.email.lower(),
            "password_hash": hash_password(payload.password),
            "full_name": payload.full_name,
            "role_id": role_id,
            "is_active": True,
        }
    )


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    users = UserRepository(session)
    data = payload.model_dump(exclude_unset=True)
    if "role_name" in data:
        data["role_id"] = await _resolve_role_id(session, data.pop("role_name"))
    user = await users.update(user_id, data)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/{user_id}", response_model=UserOut)
async def deactivate_user(
    user_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    """Soft delete: deactivate the account, never hard-delete (traceability)."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate yourself")
    user = await UserRepository(session).update(user_id, {"is_active": False})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user
