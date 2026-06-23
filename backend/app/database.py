from collections.abc import AsyncGenerator
import os
import ssl

import certifi

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from .config import get_settings

settings = get_settings()

ssl_context = ssl.create_default_context()
if os.environ.get("DB_SSL_INSECURE", "false").lower() == "true":
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE


if settings.db_is_local:
    # Local dev Postgres: normal pooling, no SSL.
    engine = create_async_engine(
        settings.database_url,
        echo=False,
        pool_pre_ping=True,
    )
else:
    # Supabase / remote: SSL required. Disable asyncpg + SQLAlchemy prepared
    # statement caching and use NullPool so we are compatible with the
    # transaction pooler (PgBouncer) on port 6543, while remaining correct for
    # the session pooler (5432) and direct connections.
    engine = create_async_engine(
        settings.database_url,
        echo=False,
        poolclass=NullPool,
        connect_args={
        "ssl": ssl_context,
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
 },
    )

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """One session per request. Commit on success, rollback on error."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
