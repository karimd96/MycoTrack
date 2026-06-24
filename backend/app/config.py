import os
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")


def _normalize_async_url(raw: str) -> str:
    """Normalize any Postgres URL to the asyncpg driver and strip libpq-only
    query params (e.g. sslmode) that asyncpg rejects. SSL is handled via
    connect_args in database.py for remote hosts (Supabase)."""
    if raw.startswith("postgresql+asyncpg://"):
        base = raw
    elif raw.startswith("postgres://"):
        base = "postgresql+asyncpg://" + raw[len("postgres://"):]
    elif raw.startswith("postgresql://"):
        base = "postgresql+asyncpg://" + raw[len("postgresql://"):]
    else:
        base = raw
    parts = urlsplit(base)
    return urlunsplit((parts.scheme, parts.netloc, parts.path, "", ""))


class Settings:
    def __init__(self) -> None:
        self.database_url = _normalize_async_url(os.environ["POSTGRES_URL"])
        self.jwt_secret = os.environ["JWT_SECRET"]
        self.access_token_minutes = int(os.environ.get("ACCESS_TOKEN_MINUTES", "15"))
        self.refresh_token_days = int(os.environ.get("REFRESH_TOKEN_DAYS", "7"))
        self.admin_email = os.environ.get("ADMIN_EMAIL", "admin@mycotrack.io").lower()
        self.admin_password = os.environ.get("ADMIN_PASSWORD", "")
        self.frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
        self.cookie_secure = os.environ.get("COOKIE_SECURE", "false").lower() == "true"
        self.cookie_samesite = os.environ.get("COOKIE_SAMESITE", "lax")

    @property
    def db_is_local(self) -> bool:
        return "localhost" in self.database_url or "127.0.0.1" in self.database_url

    @property
    def cors_origins(self) -> list[str]:
        raw = os.environ.get("CORS_ORIGINS", "")
        extra_origins = [o.strip() for o in raw.split(",") if o.strip()]

        origins = {
            self.frontend_url,
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:8080",
            *extra_origins,
        }

        return [o for o in origins if o]


@lru_cache
def get_settings() -> Settings:
    return Settings()
