# Staff dashboard activation

The `/staff` page is deployed locked by default. Its demo uses fictitious records in browser memory only. Existing restaurant requests continue through the existing Telegram channel while the dashboard is disabled. No live database or notification destination has been verified at this stage.

## Activate after staff details are supplied

1. Connect the restaurant's Supabase project. Apply `001-orders.sql` in its SQL editor. This creates server-only order tables, audit events and transactional RPCs. Anonymous and ordinary authenticated clients have no table or RPC access.
2. Disable public email signup in Supabase Auth. Create/invite each approved staff user through Supabase; staff set their own password through the provider. Never share passwords in chat. For each confirmed user, insert the matching `auth.users.id`, lowercase email, display name and role into `public.staff_members`. Access requires both a confirmed identity and an active matching staff record. Deactivate the record to revoke access.
3. Configure production environment variables in Vercel's project settings (secrets must not be committed):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only)
   - `STAFF_APP_ORIGIN=https://tashkent-caravan.vercel.app`
4. For email alerts, configure `RESEND_API_KEY`, a verified-domain `ORDER_EMAIL_FROM` and comma-separated approved `ORDER_NOTIFICATION_EMAILS`. Delivery status is displayed per order. A failed email never reverses a saved order. Email is best-effort; the order queue is the source of truth. There is no automatic email retry yet.
5. Set `ORDER_DASHBOARD_ENABLED=true` only after the schema, accounts and email recipients have been verified. Redeploy and perform one clearly labelled, owner-authorized end-to-end test order. Verify the saved request, totals, phone/address, staff access, status audit, duplicate request behavior and email delivery. Remove test data only with authorization. Verify logged-out users cannot read or update requests.

## Maintenance

- Run `node scripts/sync-menu-catalog.cjs` whenever changing `menuData` in `app.js`, then `node scripts/sync-menu-catalog.cjs --check` and `npm test` before deployment.
- The dashboard uses secure, HttpOnly, SameSite cookies and rechecks staff membership on every API request. It refreshes while visible every 15 seconds. Each status update locks the row and checks its version to avoid one employee overwriting another's update.
- The old `/api/send-telegram` endpoint remains for cached clients. Before live dashboard activation, either migrate that endpoint into the stored-order pipeline or block its use and require cached clients to reload. It must not silently bypass order storage after activation.
- Database migration has not yet been applied or verified against a managed Supabase project. Test transactional SQL and RLS permissions during provisioning before enabling the production feature flag.
- Customer information is never included in public API responses, the demo, logs or localStorage. Define the restaurant's retention policy and backup plan before handling live dashboard orders.
