import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..deps import get_current_user, require_admin, require_writer
from ..models import User
from ..repositories import RecipeRepository
from ..schemas import RecipeCreate, RecipeOut, RecipeUpdate

router = APIRouter(prefix="/recipes", tags=["recipes"])


@router.get("", response_model=list[RecipeOut])
async def list_recipes(
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    return await RecipeRepository(session).list(order_by="name", limit=1000)


@router.get("/{recipe_id}", response_model=RecipeOut)
async def get_recipe(
    recipe_id: uuid.UUID,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    obj = await RecipeRepository(session).get_by_id(recipe_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return obj


@router.post("", response_model=RecipeOut, status_code=201)
async def create_recipe(
    payload: RecipeCreate,
    current_user: User = Depends(require_writer),
    session: AsyncSession = Depends(get_session),
):
    data = payload.model_dump()
    data["created_by"] = current_user.id
    return await RecipeRepository(session).create(data)


@router.patch("/{recipe_id}", response_model=RecipeOut)
async def update_recipe(
    recipe_id: uuid.UUID,
    payload: RecipeUpdate,
    _: User = Depends(require_writer),
    session: AsyncSession = Depends(get_session),
):
    obj = await RecipeRepository(session).update(
        recipe_id, payload.model_dump(exclude_unset=True)
    )
    if obj is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return obj


@router.delete("/{recipe_id}", status_code=204)
async def delete_recipe(
    recipe_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
):
    if not await RecipeRepository(session).delete(recipe_id):
        raise HTTPException(status_code=404, detail="Recipe not found")
