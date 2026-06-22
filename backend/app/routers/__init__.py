from fastapi import APIRouter

from . import (
    auth,
    culture_events,
    cultures,
    locations,
    recipes,
    roles,
    species,
    users,
)

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(roles.router)
api_router.include_router(users.router)
api_router.include_router(species.router)
api_router.include_router(locations.router)
api_router.include_router(recipes.router)
api_router.include_router(cultures.router)
api_router.include_router(culture_events.router)
