"""Idempotent mock-data seed for MycoTrack (local Postgres / preview).

Run: cd /app/backend && python seed_mock.py
Safe to run multiple times — it upserts by natural keys.
"""
import asyncio

from app.config import get_settings  # loads .env
from app.database import AsyncSessionLocal
from app.models import Culture, Location, Recipe, Role, Species, User
from app.repositories import (
    CultureRepository,
    LocationRepository,
    RecipeRepository,
    RoleRepository,
    SpeciesRepository,
    UserRepository,
)
from app.security import hash_password

SPECIES = [
    {"scientific_name": "Pleurotus djamor", "common_name": "Pink Oyster", "category": "Gourmet"},
    {"scientific_name": "Pleurotus ostreatus", "common_name": "Oyster", "category": "Gourmet"},
    {"scientific_name": "Hericium erinaceus", "common_name": "Lion's Mane", "category": "Gourmet / Medicinal"},
    {"scientific_name": "Trametes versicolor", "common_name": "Turkey Tail", "category": "Medicinal"},
]
LOCATIONS = [
    {"name": "Laboratory", "type": "lab"},
    {"name": "Incubator Shelf A", "type": "incubator"},
    {"name": "Fridge", "type": "storage"},
    {"name": "Fruiting Tent A", "type": "fruiting_chamber"},
]
RECIPES = [
    {"name": "PDA Agar", "type": "agar", "description": "Potato Dextrose Agar"},
    {"name": "Rye Grain Spawn", "type": "grain", "description": "Hydrated rye berries"},
    {"name": "Masters Mix Block", "type": "bulk", "description": "50/50 hardwood + soy hull"},
]
# Pink Oyster lineage chain (parent -> child)
CHAIN = [
    {"code": "Pink Oyster Mycelium Syringe", "culture_type": "liquid", "location": "Laboratory"},
    {"code": "Pink Oyster Agar Plate", "culture_type": "agar", "location": "Laboratory"},
    {"code": "Pink Oyster Liquid Culture", "culture_type": "liquid", "location": "Incubator Shelf A"},
    {"code": "Pink Oyster Grain Spawn", "culture_type": "grain", "location": "Incubator Shelf A"},
    {"code": "Pink Oyster Fruiting Block", "culture_type": "bulk", "location": "Fruiting Tent A"},
]

USERS = [
    {"email": "karim.dabbousi@gmail.com", "full_name": "Admin", "role": "admin", "password": "Admin#2026"},
    {"email": "operator@mycotrack.io", "full_name": "Op User", "role": "operator", "password": "Operator#2026"},
    {"email": "admin@mycotrack.io", "full_name": "MycoTrack Admin", "role": "admin", "password": "MycoAdmin#2026"},
]


async def main():
    async with AsyncSessionLocal() as session:
        roles = RoleRepository(session)
        users = UserRepository(session)
        sp_repo = SpeciesRepository(session)
        loc_repo = LocationRepository(session)
        rec_repo = RecipeRepository(session)
        cul_repo = CultureRepository(session)

        # Users
        for u in USERS:
            role = await roles.get_by_name(u["role"])
            existing = await users.get_by_email(u["email"])
            if existing is None:
                await users.create({
                    "email": u["email"],
                    "password_hash": hash_password(u["password"]),
                    "full_name": u["full_name"],
                    "role_id": role.id,
                    "is_active": True,
                })
            else:
                existing.full_name = u["full_name"]
                existing.role_id = role.id
                existing.is_active = True
                existing.password_hash = hash_password(u["password"])
        await session.commit()

        # Species
        species_by_common = {}
        for s in SPECIES:
            obj = await sp_repo.get_one_by(scientific_name=s["scientific_name"])
            if obj is None:
                obj = await sp_repo.create(s)
            species_by_common[s["common_name"]] = obj
        await session.commit()

        # Locations
        loc_by_name = {}
        for l in LOCATIONS:
            obj = await loc_repo.get_one_by(name=l["name"])
            if obj is None:
                obj = await loc_repo.create(l)
            loc_by_name[l["name"]] = obj
        await session.commit()

        # Recipes
        for r in RECIPES:
            if await rec_repo.get_one_by(name=r["name"]) is None:
                await rec_repo.create(r)
        await session.commit()

        # Cultures chain (Pink Oyster)
        pink = species_by_common["Pink Oyster"]
        parent_id = None
        for step in CHAIN:
            existing = await cul_repo.get_one_by(code=step["code"])
            if existing is None:
                created = await cul_repo.create({
                    "code": step["code"],
                    "species_id": pink.id,
                    "location_id": loc_by_name[step["location"]].id,
                    "culture_type": step["culture_type"],
                    "status": "active",
                    "parent_culture_id": parent_id,
                })
                parent_id = created.id
            else:
                existing.parent_culture_id = parent_id
                await session.flush()
                parent_id = existing.id
        await session.commit()

        print("Seed complete:",
              len(SPECIES), "species,",
              len(LOCATIONS), "locations,",
              len(CHAIN), "cultures,",
              len(USERS), "users ensured.")


if __name__ == "__main__":
    asyncio.run(main())
