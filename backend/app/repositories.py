import uuid
from typing import Generic, TypeVar

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import (
    Base,
    Culture,
    CultureEvent,
    Location,
    Recipe,
    Role,
    Species,
    User,
)

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Generic async repository. Concrete repos set the `model` class attr
    and may add domain-specific queries."""

    model: type[ModelType]

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, id: uuid.UUID) -> ModelType | None:
        return await self.session.get(self.model, id)

    async def get_one_by(self, **filters) -> ModelType | None:
        stmt = select(self.model).filter_by(**filters)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        order_by: str | None = None,
        **filters,
    ) -> list[ModelType]:
        stmt = select(self.model).filter_by(**filters)
        if order_by and hasattr(self.model, order_by):
            stmt = stmt.order_by(getattr(self.model, order_by))
        elif hasattr(self.model, "created_at"):
            stmt = stmt.order_by(self.model.created_at.desc())
        stmt = stmt.offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count(self, **filters) -> int:
        stmt = select(func.count()).select_from(self.model).filter_by(**filters)
        result = await self.session.execute(stmt)
        return int(result.scalar_one())

    async def create(self, data: dict) -> ModelType:
        obj = self.model(**data)
        self.session.add(obj)
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def update(self, id: uuid.UUID, data: dict) -> ModelType | None:
        obj = await self.get_by_id(id)
        if obj is None:
            return None
        for key, value in data.items():
            setattr(obj, key, value)
        await self.session.flush()
        await self.session.refresh(obj)
        return obj

    async def delete(self, id: uuid.UUID) -> bool:
        obj = await self.get_by_id(id)
        if obj is None:
            return False
        await self.session.delete(obj)
        await self.session.flush()
        return True

    async def exists(self, **filters) -> bool:
        stmt = select(self.model.id).filter_by(**filters).limit(1)
        result = await self.session.execute(stmt)
        return result.first() is not None


class RoleRepository(BaseRepository[Role]):
    model = Role

    async def get_by_name(self, name: str) -> Role | None:
        return await self.get_one_by(name=name)


class UserRepository(BaseRepository[User]):
    model = User

    async def get_by_email(self, email: str) -> User | None:
        return await self.get_one_by(email=email.lower())


class SpeciesRepository(BaseRepository[Species]):
    model = Species


class LocationRepository(BaseRepository[Location]):
    model = Location


class RecipeRepository(BaseRepository[Recipe]):
    model = Recipe


class CultureRepository(BaseRepository[Culture]):
    model = Culture

    async def lineage(self, culture_id: uuid.UUID) -> list[Culture]:
        """Return the parent chain from the given culture up to the root."""
        chain: list[Culture] = []
        current = await self.get_by_id(culture_id)
        seen: set[uuid.UUID] = set()
        while current is not None and current.id not in seen:
            chain.append(current)
            seen.add(current.id)
            if current.parent_culture_id is None:
                break
            current = await self.get_by_id(current.parent_culture_id)
        return chain


class CultureEventRepository(BaseRepository[CultureEvent]):
    model = CultureEvent
