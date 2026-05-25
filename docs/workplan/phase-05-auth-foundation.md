# Phase 05: Auth Foundation

## Current Status

The backend now has a reusable user database access foundation and password utility layer. This prepares the API for future authentication work without exposing login routes or adding JWT/auth logic yet.

## What Was Implemented

- Added `bcrypt` password utilities:
  - `hashPassword(password: string)`
  - `comparePassword(password: string, hash: string)`
- Added users module structure under `apps/api/src/modules/users`.
- Added `UsersRepository` using raw PostgreSQL queries through `DatabaseService`.
- Added `UsersService` for reusable user creation and lookup behavior.
- Added duplicate email and duplicate phone checks before user creation.
- Added password hashing before insert.
- Returned user objects do not expose `password_hash`.
- Added reusable database error mapping for duplicate key, foreign key, and generic database errors.
- Added `CreateUserDto` with validation rules for full name, phone, email, password, and preferred language.

## Intentionally Not Implemented Yet

- No auth controller.
- No login endpoint.
- No registration endpoint.
- No JWT logic.
- No guards or authentication middleware.
- No sessions or refresh tokens.
- No business, customer, queue, or appointment logic.
- No Prisma, ORM, repositories/entities beyond raw user access foundation.
- No database migrations were changed.