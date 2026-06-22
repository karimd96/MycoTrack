import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..deps import get_current_user, require_admin, require_writer
from ..models import User
from ..repositories import LocationRepository
from ..schemas import LocationCreate, LocationOut, LocationUpdate

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("", response_model=list[LocationOut])
async def list_locations(
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await LocationRepository(session).list(order_by="name", limit=1000)


@router.get("/{location_id}", response_model=LocationOut)
async def get_location(
    location_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    obj = await LocationRepository(session).get_by_id(location_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Location not found")
    return obj


@router.post("", response_model=LocationOut, status_code=201)
async def create_location(
    payload: LocationCreate,
    _: User = Depends(require_writer),
    session: AsyncSession = Depends(get_session),
):
    return await LocationRepository(session).create(payload.model_dump())


@router.patch("/{location_id}", response_model=LocationOut)
async def update_location(
    location_id: uuid.UUID,
    payload: LocationUpdate,
    _: User = Depends(require_writer),
    session: AsyncSession = Depends(get_session),
):
    obj = await LocationRepository(session).update(
        location_id, payload.model_dump(exclude_unset=True)
    )
    if obj is None:
        raise HTTPException(status_code=404, detail="Location not found")
    return obj


@router.delete("/{location_id}", status_code=204)
async def delete_location(
    location_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    if not await LocationRepository(session).delete(location_id):
        raise HTTPException(status_code=404, detail="Location not found")
