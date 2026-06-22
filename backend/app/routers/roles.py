from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..deps import require_admin
from ..models import User
from ..repositories import RoleRepository
from ..schemas import RoleOut

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("", response_model=list[RoleOut])
async def list_roles(
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    return await RoleRepository(session).list(order_by="name")
