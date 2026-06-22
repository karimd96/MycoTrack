import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..deps import get_current_user, require_admin, require_writer
from ..models import User
from ..repositories import SpeciesRepository
from ..schemas import SpeciesCreate, SpeciesOut, SpeciesUpdate

router = APIRouter(prefix="/species", tags=["species"])


@router.get("", response_model=list[SpeciesOut])
async def list_species(
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await SpeciesRepository(session).list(order_by="scientific_name", limit=1000)


@router.get("/{species_id}", response_model=SpeciesOut)
async def get_species(
    species_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    obj = await SpeciesRepository(session).get_by_id(species_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Species not found")
    return obj


@router.post("", response_model=SpeciesOut, status_code=201)
async def create_species(
    payload: SpeciesCreate,
    _: User = Depends(require_writer),
    session: AsyncSession = Depends(get_session),
):
    return await SpeciesRepository(session).create(payload.model_dump())


@router.patch("/{species_id}", response_model=SpeciesOut)
async def update_species(
    species_id: uuid.UUID,
    payload: SpeciesUpdate,
    _: User = Depends(require_writer),
    session: AsyncSession = Depends(get_session),
):
    obj = await SpeciesRepository(session).update(
        species_id, payload.model_dump(exclude_unset=True)
    )
    if obj is None:
        raise HTTPException(status_code=404, detail="Species not found")
    return obj


@router.delete("/{species_id}", status_code=204)
async def delete_species(
    species_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    if not await SpeciesRepository(session).delete(species_id):
        raise HTTPException(status_code=404, detail="Species not found")
