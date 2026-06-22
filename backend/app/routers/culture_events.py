import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..deps import get_current_user, require_admin, require_writer
from ..models import User
from ..repositories import CultureEventRepository, CultureRepository
from ..schemas import CultureEventCreate, CultureEventOut

router = APIRouter(tags=["culture-events"])


@router.get("/cultures/{culture_id}/events", response_model=list[CultureEventOut])
async def list_culture_events(
    culture_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if not await CultureRepository(session).exists(id=culture_id):
        raise HTTPException(status_code=404, detail="Culture not found")
    return await CultureEventRepository(session).list(
        culture_id=culture_id, order_by="event_date", limit=1000
    )


@router.post(
    "/cultures/{culture_id}/events", response_model=CultureEventOut, status_code=201
)
async def create_culture_event(
    culture_id: uuid.UUID,
    payload: CultureEventCreate,
    current_user: User = Depends(require_writer),
    session: AsyncSession = Depends(get_session),
):
    if not await CultureRepository(session).exists(id=culture_id):
        raise HTTPException(status_code=404, detail="Culture not found")
    data = payload.model_dump(exclude_unset=True)
    data["culture_id"] = culture_id
    data["created_by"] = current_user.id
    return await CultureEventRepository(session).create(data)


@router.delete("/culture-events/{event_id}", status_code=204)
async def delete_culture_event(
    event_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    """Admin-only intentional removal of a traceability event."""
    if not await CultureEventRepository(session).delete(event_id):
        raise HTTPException(status_code=404, detail="Culture event not found")
