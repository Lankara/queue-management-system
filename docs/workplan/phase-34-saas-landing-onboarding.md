# Phase 34 - SaaS Landing Page and Business Onboarding

## Scope
This phase turns the platform into a single-host SaaS entry point. Businesses share one central application, then operate inside isolated dashboard context selected by `business_id` and user role.

## Public Landing Page
The root route `/` now presents the Queue Management System as one platform for doctors, medical centers, barber shops, beauty parlours, salons, and service shops. It explains QR queue joining, appointment booking, WhatsApp support, analytics, and future hardware display support, with calls to log in or register a business.

## Registration and Onboarding Flow
`/register` creates an owner account and business in one guided flow:
- owner account details
- business profile details
- optional first branch and service

The API endpoint `POST /api/auth/register-owner-business` runs the operation in a database transaction. It creates the user, hashes the password, creates the business, links the user as `BUSINESS_OWNER`, creates default profile settings, and optionally creates the first branch/service.

Default profile settings are business-type aware:
- medical, doctor, clinic, and hospital businesses start in `MEDICAL` profile mode
- barber, salon, beauty, service, and other businesses start in `BASIC` profile mode

## Login and Business Selection
The existing `/login` route remains in place and now routes after authentication based on linked businesses:
- one active business selects automatically and opens `/dashboard`
- multiple businesses open `/select-business`
- no linked businesses show a prompt to create the first business

The selected tenant stores the business id, name, type, and role locally. The dashboard topbar displays the active business context so users can see which tenant they are operating in.

## Tenant Separation
The system remains a single application and API deployment. Separate websites or servers are not required. Business data separation continues through `business_id` scoping in protected API routes, RBAC, and the selected business context in the admin dashboard.

## Current Limitations
- Registration is public and protected by validation, but email/phone verification is not implemented yet.
- Plans, billing, trials, and subscription enforcement are placeholders for a future phase.
- Custom domains and branded per-business landing pages are not implemented yet.
- The optional branch/service quick setup is intentionally minimal.

## Future Options
Future SaaS phases can add email/phone verification, subscription plans, trial limits, custom domains, richer onboarding checklists, and guided demo data creation.