# SANAÉRA — Backend Architecture & Roadmap

This tracks the phased build described in the project brief. Phase 1 (this
commit) is the foundation everything else sits on. Nothing below Phase 1 is
implemented yet — this file is the plan, not a changelog.

## Phase 1 — Foundation (done)

- `prisma/schema.prisma` — full normalized schema: auth (User/Account/Session/
  VerificationToken), RBAC (Role/Permission/RolePermission), catalog (Category/
  Collection/Product/ProductVariant/ProductImage/Inventory), cart/wishlist/
  recently-viewed, orders/payments/coupons/returns, reviews (+ replies/reports),
  marketing/content (Banner/HomepageSection/NewsletterSubscriber/
  ContactMessage), notifications, and AuditLog.
- `.env.example` — every credential the later phases need, documented.
- `lib/prisma.ts` — Prisma client singleton (hot-reload safe).
- `prisma/seed.ts` — roles + permissions, a super-admin account, categories,
  collections, and a handful of real products with variants + inventory.
- `package.json` — all backend dependencies pinned (Auth.js, bcrypt, zod,
  Cloudinary, Razorpay, Nodemailer, react-hook-form, @react-pdf/renderer for
  invoices, recharts for admin analytics charts).

**To actually run this phase:**
```bash
cp .env.example .env        # fill in a real Postgres URL at minimum
npm install
npx prisma migrate dev --name init
npm run db:seed
```

## Phase 2 — Auth.js (done)

- `lib/auth.ts` — Auth.js v5 config: Credentials provider (bcrypt-checked,
  rate-limited), Google provider, Prisma adapter, JWT sessions. "Remember me"
  is implemented via a custom `effectiveExp` claim checked in the `session`
  callback, since Auth.js's `session.maxAge` is a single static ceiling (30
  days) and can't vary per sign-in — unchecking "remember me" gives an
  effective 1-day session even though the cookie itself lives longer.
- `lib/password.ts` — bcrypt hash/verify (cost factor 12).
- `lib/otp.ts` — generates 6-digit OTP codes and long reset tokens, both
  backed by the `VerificationToken` table; tokens are single-use (deleted on
  any consumption attempt, valid or not) and old tokens for the same
  identifier+type are invalidated when a new one is requested.
- `lib/email.ts` — Nodemailer sender for welcome / OTP / password-reset /
  password-changed emails, with minimal shared brand-styled HTML.
- `lib/validations/auth.ts` — Zod schemas for every auth form.
- `lib/rate-limit.ts` — Upstash-backed sliding-window limiter for login, OTP
  requests, and password reset; **no-ops (allows everything) if
  `UPSTASH_REDIS_REST_URL`/`TOKEN` aren't set** — configure these before
  production.
- `app/(auth)/actions.ts` — Server Actions: register, request/verify OTP,
  forgot/reset password, change password. All return a generic message on
  the forgot-password and OTP-resend paths regardless of whether the email
  exists, to avoid account enumeration.
- `app/(auth)/{login,register,verify-email,forgot-password,reset-password}` —
  pages + matching client form components in `components/auth/`.
- `middleware.ts` — gates `/account/*` behind a session (redirects to
  `/login?callbackUrl=...`). `/admin` protection is added in Phase 4.
- `types/next-auth.d.ts` — augments Session/User/JWT with `id` and `role`.

**Known gaps / things to verify once you can actually run this:**
- I couldn't `npm install` or run this against a real database or SMTP
  server here, so treat it as reviewed-but-untested — run `npx prisma
  validate`, then walk through register → OTP email → verify → login by
  hand once your `.env` is filled in.
- Change-password is implemented as a Server Action (`changePasswordAction`)
  but has no page yet — it'll get a home in `/account/security` in Phase 3.
- Header's Wishlist/Bag links now point at `/account/wishlist` and
  `/account/cart`, which don't exist until Phase 3 — they'll 404 (after
  passing the login gate) until then.
- The Google provider assumes `emailVerified` should be trusted from Google;
  double-check that's the policy you want (vs. re-verifying via OTP too).

## Phase 3 — Customer dashboard & APIs (done)

- `/account` — sidebar layout (Dashboard, Orders, Wishlist, Cart, Addresses,
  Payment Methods, Profile, Notifications, Security, Settings), gated by
  `middleware.ts` from Phase 2.
- Every page is a Server Component reading straight from Prisma — no
  round-trip through the app's own API for the initial render. The REST
  route handlers under `app/api/{cart,wishlist,addresses,orders,
  notifications}/` exist for **client-side interactions** (quantity steppers,
  remove buttons, the address form) and for whatever else ends up calling
  them (mobile app, future product-page "Add to Bag" wiring, etc).
- **Every route handler scopes its query to the session's `user.id`** —
  never `where: { id }` alone. Cross-user access returns 404, not 403, so an
  id can't be used to confirm another user's data exists (see
  `lib/api-auth.ts` and the ownership checks in each handler).
- Guest cart: `lib/guest-session.ts` sets an httpOnly `guest_session_id`
  cookie; `lib/cart.ts` supports carts keyed by either `userId` or
  `guestSessionId`; `lib/merge-guest-data.ts` folds a guest cart into the
  user's cart (quantities combine) the moment `/account` loads after login,
  then clears the cookie. Wishlist has no guest-side table by design (the
  brief calls for localStorage-based guest wishlists) — merging that is a
  client-side job: replay the localStorage list against `POST /api/wishlist`
  once a session exists.
- Inventory-aware cart: adding/updating a line item is clamped to
  `Inventory.availableStock` so the cart can't silently promise more stock
  than exists.
- Change-password (built in Phase 2) now has a home at `/account/security`;
  Google-only accounts see an explanatory message instead of the form.

**Known gaps, called out rather than glossed over:**
- The product detail page (`ProductInfo.tsx`) still renders from the static
  `lib/products.ts` mock array, whose slugs/ids don't match the handful of
  products the Phase 1 seed script created. So there's no "Add to Bag"
  button wired to `POST /api/cart` yet — wiring that up needs the product
  page to read from the database first, which is a Phase 5 task (product
  management is when the mock array gets fully retired).
- Checkout is intentionally a disabled button on `/account/cart` — that's
  Phase 6.
- Profile picture upload is a note, not a file input yet — needs
  Cloudinary's signed-upload flow from Phase 5.
- `WishlistItem`'s uniqueness constraint includes a nullable `variantId`;
  Postgres treats `NULL` as distinct in unique constraints, so two wishlist
  rows for the same product with no variant chosen wouldn't be deduplicated.
  Minor edge case, worth a `@@unique` re-think if variant-less wishlisting
  turns out to be common.
- Still no live DB to run this against here — same caveat as every phase so
  far. Test the actual flows (login → guest cart merge → address CRUD →
  wishlist add/remove) by hand once `.env` is real.

## Phase 4 — Admin dashboard & RBAC

- `middleware.ts` extended: any `/admin/*` request is checked against the
  session's role *and* that role's permissions (from Phase 1's Role/
  Permission tables) before the request reaches the page — never client-side
  only. Non-admins get redirected to `/403`, not `/login` (so the route's
  existence isn't confirmed to logged-out users).
- `/admin` is excluded from `sitemap.ts` and disallowed in `robots.txt`.
- Sub-pages per the brief: analytics, orders, products, categories,
  collections, customers, inventory, coupons, banners, homepage editor,
  reviews, returns, payments, shipping, reports, settings, admins/roles/
  permissions, audit logs.
- Every mutating admin action writes an `AuditLog` row (actor, action,
  entity, before/after diff in `metadata`).

## Phase 5 — Product & inventory management

- Cloudinary signed uploads (`app/api/uploads/sign/route.ts` issues a short-
  lived signature; the browser uploads directly to Cloudinary, never through
  our server).
- Product create/edit forms: variants (size × color), SKU/barcode, stock,
  SEO fields, status (draft/published), featured/new/trending/bestseller/
  limited-edition flags.
- Low-stock and out-of-stock alerts (a scheduled check comparing
  `Inventory.availableStock` to `lowStockThreshold`, surfaced in the admin
  dashboard and emailed to Product Managers).

## Phase 6 — Cart, checkout, coupons, Razorpay

- Checkout Server Action: validates cart against live inventory, applies
  coupon rules (`minPurchase`, `usageLimit`, `perUserLimit`), computes GST +
  shipping, creates a `PENDING` Order + a Razorpay order, returns the
  Razorpay order id to the client for the checkout widget.
- `app/api/webhooks/razorpay/route.ts` verifies the webhook signature,
  updates `Payment.status`, and flips the `Order.status` accordingly — the
  source of truth for "did this payment actually succeed" is always the
  webhook, never the client redirect.

## Phase 7 — Emails, reviews, returns, recovery, invoices, analytics

- Nodemailer templates: welcome, verify-email, password-reset, order-
  confirmation, shipping-update, delivery-confirmation, refund-confirmation,
  newsletter, **abandoned-cart** (a scheduled job flags carts with
  `lastActivityAt` > 2h ago and `reminderSentAt IS NULL`).
- Reviews: verified-purchase gate, moderation queue (`ReviewStatus.PENDING`
  until an admin with `review:moderate` approves), replies, likes, abuse
  reports.
- Returns: customer-initiated `ReturnRequest`, admin approve/reject/receive/
  refund flow, tied back into `Payment.refundedAmount`.
- `@react-pdf/renderer` invoice generation, streamed from
  `app/api/orders/[id]/invoice/route.ts`.
- Admin analytics: daily/weekly/monthly sales via grouped Prisma queries,
  charted with `recharts`.
- Customer segmentation (`User.customerSegment`): recomputed after each
  order — first order → `NEW`, 2nd+ → `REPEAT`, lifetime spend over a
  threshold → `VIP`.

## Security notes that apply across every phase

- Passwords: bcrypt, cost factor 10+, never logged, never returned by any API.
- All Server Actions and Route Handlers validate input with Zod before
  touching Prisma — no raw `req.json()` passed to a query.
- Prisma's query builder parameterizes everything, so standard usage is not
  vulnerable to SQL injection; the risk to actively guard against is string-
  concatenated `$queryRaw`, which this project avoids.
- CSRF: Auth.js handles CSRF tokens for its own routes; Server Actions get
  Next.js's built-in CSRF protection (origin checking) for free.
- Rate limiting: sensitive routes (login, OTP request, password reset,
  checkout) get an Upstash Redis token-bucket check in Phase 2/6.
- Cookies: `httpOnly`, `secure` (in production), `sameSite: "lax"` — set via
  Auth.js's session cookie config, not manually.
