import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..deps import get_current_user, require_writer
from ..models import User
from ..repositories import CultureRepository, SpeciesRepository
from ..schemas import CultureCreate, CultureOut, CultureUpdate

router = APIRouter(prefix="/cultures", tags=["cultures"])

VALID_STATUSES = {"active", "contaminated", "stored", "discarded"}


@router.get("", response_model=list[CultureOut])
async def list_cultures(
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await CultureRepository(session).list(order_by="created_at", limit=1000)


@router.get("/{culture_id}", response_model=CultureOut)
async def get_culture(
    culture_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    obj = await CultureRepository(session).get_by_id(culture_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Culture not found")
    return obj


@router.get("/{culture_id}/lineage", response_model=list[CultureOut])
async def get_culture_lineage(
    culture_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    repo = CultureRepository(session)
    if await repo.get_by_id(culture_id) is None:
        raise HTTPException(status_code=404, detail="Culture not found")
    return await repo.lineage(culture_id)


@router.post("", response_model=CultureOut, status_code=201)
async def create_culture(
    payload: CultureCreate,
    current_user: User = Depends(require_writer),
    session: AsyncSession = Depends(get_session),
):
    cultures = CultureRepository(session)
    if payload.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {payload.status}")
    if not await SpeciesRepository(session).exists(id=payload.species_id):
        raise HTTPException(status_code=400, detail="species_id does not exist")
    if payload.parent_culture_id and not await cultures.exists(
        id=payload.parent_culture_id
    ):
        raise HTTPException(status_code=400, detail="parent_culture_id does not exist")
    data = payload.model_dump()
    data["created_by"] = current_user.id
    return await cultures.create(data)


@router.patch("/{culture_id}", response_model=CultureOut)
async def update_culture(
    culture_id: uuid.UUID,
    payload: CultureUpdate,
    _: User = Depends(require_writer),
    session: AsyncSession = Depends(get_session),
):
    data = payload.model_dump(exclude_unset=True)
    if "status" in data and data["status"] not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {data['status']}")
    obj = await CultureRepository(session).update(culture_id, data)
    if obj is None:
        raise HTTPException(status_code=404, detail="Culture not found")
    return obj
