# SANAÉRA — Next.js Scaffold

A real Next.js 15 / React 19 / TypeScript / Tailwind implementation of the SANAÉRA
homepage and product detail page, matching the standalone HTML mockups
(`sanaera.html`, `product-detail.html`).

## What's here

- **`app/page.tsx`** — homepage: preloader, gold-thread scroll indicator, hero (flower motif +
  floating particles), marquee, featured grid, shop-by-state scroller, artisan story,
  best sellers, sustainability band, gallery, newsletter, footer — matches
  `reference-homepage.html` section-for-section.
- **`app/product/[slug]/page.tsx`** — dynamic product detail route (unchanged from the
  original build; not part of the HTML-parity pass below).
- **`app/{new-arrivals,collections,heritage,jewelry,artisan-stories}/page.tsx`** — lightweight
  routes so the header's nav links (which now have real hrefs) don't 404.
- **`components/Button.tsx`** and **`components/Eyebrow.tsx`** — shared primitives extracted
  during the HTML-parity pass, replacing several hand-rolled, slightly-inconsistent copies.
- **`components/Preloader.tsx`**, **`components/ScrollIndicator.tsx`**,
  **`components/StateScroller.tsx`**, **`components/Gallery.tsx`**,
  **`components/Newsletter.tsx`** — previously missing entirely; added to match the HTML 1:1.
- **`components/Header.tsx`** — rebuilt with 3 distinct mega-menu panels (one per nav item,
  matching the HTML's different content/caption per panel), real hrefs everywhere, an animated
  underline on hover, and a working mobile burger toggle.
- **`components/ProductCard.tsx`** — added the paisley motif SVG and color-swatch row; gradient
  now cycles by grid position (matching the HTML's `nth-child` rule) instead of per-product data.


## Backend (in progress)

This project is being extended into a full-stack platform (Postgres + Prisma,
Auth.js, admin dashboard, Razorpay, Cloudinary, Nodemailer) in phases — see
**`ARCHITECTURE.md`** for the full roadmap and what's done so far.

**Phase 1 (foundation) is complete:** the Prisma schema, `.env.example`, DB
client, and seed script are in place. Get it running locally:

```bash
cp .env.example .env   # fill in DATABASE_URL / DIRECT_URL at minimum
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

**Phase 2 (Auth.js) is also complete:** email/password + Google login, OTP
email verification, forgot/reset password, and `/account` route protection.
Generate an `AUTH_SECRET` (`npx auth secret`) and a Google OAuth client
before testing sign-in — see `.env.example`.

**Phase 3 (customer dashboard) is also complete:** `/account` with orders,
wishlist, cart (guest-cart merge included), addresses, payment methods,
profile, security, settings, and notifications — see `ARCHITECTURE.md` for
what's genuinely done vs. still a stub (checkout, avatar upload).

## Running it locally


This scaffold was authored without a live install/build step (no network
access in this environment), so double-check `npm run build` once you pull
it down.

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Fonts

Cormorant Garamond (display), Marcellus SC (labels/eyebrows), and Jost (body)
load via `next/font/google` in `app/layout.tsx` — no manual `<link>` tags
needed.

## What's stubbed, not built

- **Imagery**: every product/hero surface uses CSS gradients + thin gold
  line-art in place of photography, exactly like the HTML mockups. Swap in
  real campaign photography via `next/image` where you see the gradient
  `background` props in `ProductCard`, `Hero`, `ProductGallery`, etc.
- **Cart, checkout, auth, search, AI stylist, virtual draping, live
  shopping, multi-currency**: not implemented — this scaffold is the design
  system and page architecture, not the commerce backend. Each would need
  its own data layer (a headless commerce platform, a sizing/AI service,
  etc.) before it's real.
- **GSAP** is installed as a dependency for more advanced scroll-triggered
  work (e.g. pinned sections, staggered SVG draws) beyond what Framer
  Motion's `whileInView` already covers in `Reveal.tsx` — wire it in wherever
  you want a more choreographed moment.
