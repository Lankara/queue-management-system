# Phase 17: Customer and Medical Profile UI

## Implemented Customer Flow

The `/dashboard/customers` page now supports listing, searching by partial phone number, selecting, creating, and editing customers for the selected business. The page shows preferred language, primary phone, online booking ban status, and no-show count.

## Linked Client Profile Behavior

After selecting a customer, the UI loads linked client profiles with the query key `['client-profiles', businessId, customerId]`. Users can create, edit, and select active client profiles. This supports one phone number managing multiple clients or patients.

## Medical Profile Conditional Behavior

After selecting a client profile, the UI loads the optional medical profile with `['medical-profile', businessId, clientProfileId]`. Medical details are shown prominently when the business profile mode is `MEDICAL` or `CUSTOM`. In `BASIC` mode, the medical section remains available but is presented as optional.

## Ban Management Flow

If a customer is online-booking banned, the customer details panel shows a warning with the ban reason and no-show count. The reset action calls `PATCH /api/businesses/:businessId/customers/:id/ban-reset`.

## Intentionally Not Implemented Yet

- Queue live UI
- Appointment calendar UI
- WhatsApp UI
- Advanced customer pagination
- Server-side search endpoint for partial phone numbers
- Delete actions
- Medical-field enforcement beyond visible settings hints
