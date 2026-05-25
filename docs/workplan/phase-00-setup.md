# Phase 00: Initial Monorepo Setup

## Current Setup Status

The project has been scaffolded as a pnpm + Turborepo monorepo for the Queue Management System platform.

Created structure includes placeholder folders for future applications, shared packages, database assets, and documentation. The root monorepo configuration files now define workspace boundaries and common task entry points, but no application code or dependencies have been added yet.

## Next Steps

- Confirm the planned application boundaries for `apps/api`, `apps/web`, `apps/admin`, `apps/mobile`, and `apps/worker`.
- Confirm the shared package responsibilities for `packages/db`, `packages/shared`, `packages/validation`, `packages/config`, and `packages/ui`.
- Decide the initial development tooling versions for pnpm, Turborepo, TypeScript, NestJS, Next.js, and Flutter.
- Add package manifests for individual apps and packages only when their implementation phase begins.
- Add database migration tooling and PostgreSQL scripts only during the database setup phase.

## Must Not Be Done Yet

- Do not install dependencies.
- Do not create backend, frontend, mobile, worker, or shared package code.
- Do not create database tables, migrations, seeds, or production SQL scripts.
- Do not add environment-specific secrets.
- Do not configure WhatsApp, hardware display, or deployment integrations yet.
