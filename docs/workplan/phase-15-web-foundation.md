# Phase 15: Web Foundation

## Architecture

The web app is a standalone Next.js App Router package at `apps/web`. It uses TypeScript, TailwindCSS, Axios, Zustand, React Query, React Hook Form, Zod, clsx, and lucide-react.

Source is organized under:

- `src/app` for App Router routes and layouts
- `src/components` for reusable UI and layout components
- `src/lib` for API/auth helpers
- `src/hooks` for reusable client hooks
- `src/store` for Zustand stores
- `src/providers` for app-level providers
- `src/types` for shared frontend types
- `src/styles` for global styles

## Auth Flow

The login page posts to `POST /api/auth/login` through the Axios API client. On success, the JWT and user object are stored in the persisted Zustand auth store. The dashboard shell redirects unauthenticated users to `/login`.

## Routing Strategy

Current routes:

- `/login`
- `/dashboard`
- placeholder dashboard child routes for businesses, branches, services, customers, queues, appointments, notifications, delays, and settings

The dashboard route uses an authenticated layout with sidebar, topbar, and content area.

## Zustand Usage

`useAuthStore` stores:

- `accessToken`
- `user`
- `setSession()`
- `logout()`

The store persists to localStorage for development convenience.

## React Query Usage

React Query is configured globally in `AppProviders`. The dashboard currently uses it to call `GET /api/health` and show API connectivity status.

## Intentionally Not Implemented Yet

- Full business CRUD screens
- Queue management screens
- Appointment workflows
- Customer management screens
- Notification monitoring tables
- Real-time dashboard updates
- Role-specific navigation filtering
- WhatsApp/SMS/email integrations
