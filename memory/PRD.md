# MycoTrack — Product Requirements & Architecture

## Original Problem Statement
Refactor MycoTrack to PostgreSQL using Supabase with a BaseRepository abstraction.
Stack: SQLAlchemy 2.0 async, Alembic, asyncpg, FastAPI. Frontend stays JSX (TypeScript later).
Fresh start (no MongoDB migration). JWT custom auth (bcrypt + httpOnly access/refresh cookies).

## Decisions (user-approved)
- POSTGRES_URL provided via /app/backend/.env (no hardcoded secrets). A local Postgres dev
  instance is currently configured; user will swap in their Supabase URL (env-driven, seamless).
- Roles: admin, operator, viewer. viewer=read-only; operator=read+write lab data (no user mgmt,
  no deletes); admin=everything incl. user/role management and deletes.
- Cultures: NO hard delete (status changes only: active/contaminated/stored/discarded).
- CultureEvents: delete is admin-only. Users: soft delete (is_active=false).
- parent_culture_id kept for lineage; advanced genealogy visualization deferred.

## Architecture
- Backend: FastAPI + SQLAlchemy 2.0 async + asyncpg + Alembic.
  - `app/config.py` (env, normalizes any pg URL to asyncpg, strips libpq params, SSL for remote)
  - `app/database.py` (async engine + session-per-request dependency)
  - `app/models.py` (7 ORM tables), `app/schemas.py` (Pydantic v2)
  - `app/repositories.py` (BaseRepository[ModelType] + concrete repos)
  - `app/security.py` (bcrypt, JWT access/refresh, cookie helpers)
  - `app/deps.py` (get_current_user, require_admin, require_writer)
  - `app/routers/*` (auth, roles, users, species, locations, recipes, cultures, culture_events)
  - `server.py` entrypoint: CORS, router include, startup seeding (roles + admin, idempotent)
  - `alembic/` async migrations (initial schema = f6d81037bd18)
- Frontend: React 19 JSX, react-router 7, axios (withCredentials), sonner toasts, Tailwind.
  - AuthContext, ProtectedRoute, Login, Dashboard, CrudPanel (species/locations/recipes),
    CulturesPanel (events drawer + lineage modal), UsersPanel (admin).

## Phase 1 Entities (DONE)
Users, Roles, Species, Locations, Recipes, Cultures, CultureEvents.

## Endpoints (implemented & tested)
- Auth: register, login, logout, me, refresh (refresh re-fetches user + enforces is_active)
- roles: GET (admin)
- users: GET/GET{id}/POST/PATCH/DELETE(soft) (admin)
- species/locations/recipes: GET(all) POST/PATCH(writer) DELETE(admin)
- cultures: GET/GET{id}/POST/PATCH/{id}/lineage (no delete)
- culture events: GET+POST under /cultures/{id}/events; DELETE /culture-events/{id} (admin)

## Status — Implemented (2026-06-22)
- Full PostgreSQL refactor with BaseRepository abstraction. Alembic migration applied.
- JWT cookie auth + RBAC verified. Testing agent: backend 20/20, frontend 16/16, no bugs.
- Env fix applied: patched react-scripts dev-server config for webpack-dev-server v5 compat.

## Status — Frontend redesign (2026-06-22)
- Production-grade, mobile-first UI shipped. Router-based app with shared Layout
  (desktop sidebar + mobile hamburger drawer), role-filtered nav (admin sees Users & Roles;
  operator/viewer do not), Outfit font, charcoal #0d100c + lime #a3e635 theme.
- Screens: Login, Dashboard (stat cards + recent cultures), Culture list (responsive CARD grid,
  search + status filter), Culture detail (meta grid, event timeline, lineage panel), modals for
  Add/Edit/Child culture and Add Event. Actions: Add Culture, Add Event, Print Label (window.print),
  Create Child Culture (pre-fills parent).
- "Made with Emergent" badge removed from public/index.html. Leftover test rows wiped (DB starts clean;
  users/roles retained). Culture codes shown as #code; raw UUID de-emphasized.
- Env fix: patched react-scripts dev-server (start.js + webpackDevServer.config.js) for
  webpack-dev-server v5 (setupMiddlewares / server / stop()).
- Testing agent iteration 2: 100% frontend flows pass, no UI bugs.

## Status — Supabase readiness (2026-06-22)
- Supabase-compat done in code (NOT yet connected): remote connections use SSL +
  statement_cache_size=0 + prepared_statement_cache_size=0 + NullPool (compatible with
  Supabase session pooler :5432, transaction pooler :6543, and direct connection).
  Applied in app/database.py and alembic/env.py. Local dev path unchanged.
- Replaced deprecated @app.on_event("startup") with FastAPI lifespan handler.
- BLOCKED on user action: real Supabase POSTGRES_URL not yet provided. To switch:
  edit ONLY the POSTGRES_URL line in /app/backend/.env, then run
  `cd /app/backend && alembic upgrade head` and restart backend. App currently runs on
  local dev Postgres (postgresql+asyncpg://mycotrack:...@localhost:5432/mycotrack).

## Deferred / Backlog (P1/P2)
- Migrate to Supabase URL (user action) + verify SSL connection.
- Deferred entities: Ingredients, Inventory, Batches, Attachments, EnvironmentalLogs.
- Advanced genealogy visualization (tree/graph), ESP32 environmental integration.
- TypeScript conversion of frontend.
- Brute-force login lockout, FastAPI lifespan handlers (replace deprecated on_event).
