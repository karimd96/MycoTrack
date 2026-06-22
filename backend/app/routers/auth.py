from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..deps import get_current_user
from ..models import User
from ..repositories import RoleRepository, UserRepository
from ..schemas import LoginRequest, RegisterRequest, UserOut
from ..security import (
    clear_auth_cookies,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    set_auth_cookies,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut)
async def register(
    payload: RegisterRequest,
    response: Response,
    session: AsyncSession = Depends(get_session),
):
    users = UserRepository(session)
    roles = RoleRepository(session)
    email = payload.email.lower()
    if await users.get_by_email(email):
        raise HTTPException(status_code=400, detail="Email already registered")
    viewer_role = await roles.get_by_name("viewer")
    if viewer_role is None:
        raise HTTPException(status_code=500, detail="Default role not configured")
    user = await users.create(
        {
            "email": email,
            "password_hash": hash_password(payload.password),
            "full_name": payload.full_name,
            "role_id": viewer_role.id,
            "is_active": True,
        }
    )
    set_auth_cookies(
        response,
        create_access_token(str(user.id), user.email),
        create_refresh_token(str(user.id)),
    )
    return user


@router.post("/login", response_model=UserOut)
async def login(
    payload: LoginRequest,
    response: Response,
    session: AsyncSession = Depends(get_session),
):
    users = UserRepository(session)
    user = await users.get_by_email(payload.email.lower())
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    set_auth_cookies(
        response,
        create_access_token(str(user.id), user.email),
        create_refresh_token(str(user.id)),
    )
    return user


@router.post("/logout")
async def logout(response: Response, _: User = Depends(get_current_user)):
    clear_auth_cookies(response)
    return {"message": "Logged out"}


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")
    access = create_access_token(payload["sub"], payload.get("email", ""))
    from ..config import get_settings

    settings = get_settings()
    response.set_cookie(
        key="access_token",
        value=access,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.access_token_minutes * 60,
        path="/",
    )
    return {"message": "Token refreshed"}
