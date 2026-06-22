import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Auth ----------
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ---------- Role ----------
class RoleOut(ORMModel):
    id: uuid.UUID
    name: str
    description: str | None = None


# ---------- User ----------
class UserOut(ORMModel):
    id: uuid.UUID
    email: str
    full_name: str | None = None
    is_active: bool
    role_id: uuid.UUID
    role: RoleOut | None = None
    created_at: datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str | None = None
    role_name: str = Field(description="admin | operator | viewer")


class UserUpdate(BaseModel):
    full_name: str | None = None
    role_name: str | None = None
    is_active: bool | None = None


# ---------- Species ----------
class SpeciesCreate(BaseModel):
    scientific_name: str
    common_name: str | None = None
    category: str | None = None
    notes: str | None = None


class SpeciesUpdate(BaseModel):
    scientific_name: str | None = None
    common_name: str | None = None
    category: str | None = None
    notes: str | None = None


class SpeciesOut(ORMModel):
    id: uuid.UUID
    scientific_name: str
    common_name: str | None = None
    category: str | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime


# ---------- Location ----------
class LocationCreate(BaseModel):
    name: str
    type: str | None = None
    description: str | None = None


class LocationUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    description: str | None = None


class LocationOut(ORMModel):
    id: uuid.UUID
    name: str
    type: str | None = None
    description: str | None = None
    created_at: datetime
    updated_at: datetime


# ---------- Recipe ----------
class RecipeCreate(BaseModel):
    name: str
    type: str | None = None
    description: str | None = None
    instructions: str | None = None


class RecipeUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    description: str | None = None
    instructions: str | None = None


class RecipeOut(ORMModel):
    id: uuid.UUID
    name: str
    type: str | None = None
    description: str | None = None
    instructions: str | None = None
    created_by: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime


# ---------- Culture ----------
class CultureCreate(BaseModel):
    code: str
    species_id: uuid.UUID
    location_id: uuid.UUID | None = None
    recipe_id: uuid.UUID | None = None
    culture_type: str | None = None
    status: str = "active"
    parent_culture_id: uuid.UUID | None = None
    notes: str | None = None
    started_at: datetime | None = None


class CultureUpdate(BaseModel):
    code: str | None = None
    species_id: uuid.UUID | None = None
    location_id: uuid.UUID | None = None
    recipe_id: uuid.UUID | None = None
    culture_type: str | None = None
    status: str | None = None
    parent_culture_id: uuid.UUID | None = None
    notes: str | None = None
    started_at: datetime | None = None


class CultureOut(ORMModel):
    id: uuid.UUID
    code: str
    species_id: uuid.UUID
    location_id: uuid.UUID | None = None
    recipe_id: uuid.UUID | None = None
    culture_type: str | None = None
    status: str
    parent_culture_id: uuid.UUID | None = None
    created_by: uuid.UUID | None = None
    notes: str | None = None
    started_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


# ---------- Culture Event ----------
class CultureEventCreate(BaseModel):
    event_type: str
    notes: str | None = None
    event_date: datetime | None = None


class CultureEventOut(ORMModel):
    id: uuid.UUID
    culture_id: uuid.UUID
    event_type: str
    notes: str | None = None
    created_by: uuid.UUID | None = None
    event_date: datetime
    created_at: datetime
