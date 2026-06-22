from app.config import get_settings  # noqa: E402  (loads .env before anything else)

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import select
from starlette.middleware.cors import CORSMiddleware

from app.database import AsyncSessionLocal
from app.models import User
from app.repositories import RoleRepository, UserRepository
from app.routers import api_router
from app.security import hash_password

settings = get_settings()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("mycotrack")


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Startup: seed default roles + initial admin (idempotent, with retries
    # so a briefly-unavailable DB / cold Supabase connection does not crash boot).
    for attempt in range(1, 6):
        try:
            await seed_roles_and_admin()
            break
        except Exception as exc:  # noqa: BLE001
            logger.warning("Startup seeding attempt %s/5 failed: %s", attempt, exc)
            await asyncio.sleep(2)
    else:
        logger.error("Startup seeding gave up after retries; DB may be unavailable.")
    yield
    # Shutdown: nothing to clean up (NullPool / engine disposes connections).


app = FastAPI(title="MycoTrack API", version="1.0.0", lifespan=lifespan)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "mycotrack", "db": "postgresql"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_ROLES = [
    ("admin", "Full access including user and role management"),
    ("operator", "Read and write access to lab data (no user management)"),
    ("viewer", "Read-only access"),
]


async def seed_roles_and_admin() -> None:
    """Idempotent: ensure default roles exist and create the initial admin
    only when no admin user is present. Never overwrites an existing admin."""
    async with AsyncSessionLocal() as session:
        roles_repo = RoleRepository(session)
        for name, desc in DEFAULT_ROLES:
            if await roles_repo.get_by_name(name) is None:
                await roles_repo.create({"name": name, "description": desc})
        await session.commit()

        admin_role = await roles_repo.get_by_name("admin")
        result = await session.execute(
            select(User).where(User.role_id == admin_role.id).limit(1)
        )
        admin_exists = result.scalar_one_or_none() is not None

        if not admin_exists and settings.admin_password:
            await UserRepository(session).create(
                {
                    "email": settings.admin_email,
                    "password_hash": hash_password(settings.admin_password),
                    "full_name": "MycoTrack Admin",
                    "role_id": admin_role.id,
                    "is_active": True,
                }
            )
            await session.commit()
            logger.info("Seeded initial admin user: %s", settings.admin_email)
            _write_test_credentials()
        elif admin_exists:
            logger.info("Admin user already present; skipping admin seed.")


def _write_test_credentials() -> None:
    content = f"""# Test Credentials

## Admin (seeded on first startup)
- email: {settings.admin_email}
- password: {settings.admin_password}
- role: admin

## Roles
- admin: full access + user/role management
- operator: read + write lab data
- viewer: read-only

## Auth endpoints
- POST /api/auth/register  (creates a viewer)
- POST /api/auth/login
- POST /api/auth/logout
- GET  /api/auth/me
- POST /api/auth/refresh
"""
    try:
        with open("/app/memory/test_credentials.md", "w") as f:
            f.write(content)
    except OSError as exc:
        logger.warning("Could not write test_credentials.md: %s", exc)
