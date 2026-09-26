# Save point — September 25, 2026

The user approved the current homepage and site-wide theme as a good stopping point.

## Current design

- Homepage uses `public/homepage.png`: the original red Final Form Athletics artwork on a white textured background.
- Desktop navigation is a revolving vertical wheel on the right. Shop is selected initially, About is above it, and Lookbook is below it. Unfocused choices fade.
- Mobile places the artwork above a horizontal swipe wheel with visible faded neighboring choices.
- The wheel loops and supports mouse scrolling, touch swipes, keyboard arrows, and previous/next controls.
- Graduate is stored locally in `public/fonts/` with its license. It provides the collegiate lettering throughout the site.
- Collection, both product pages, About, Lookbook, cart, cart drawer, and mobile navigation use white surfaces, red accents, and collegiate headings.
- Live Next.js routes have no footer. Footer remnants were removed from the old static homepage, collection, and cart files. The dark collection closing section was also removed.

## Artwork ownership

The user will upscale the homepage artwork manually. Do not upscale or regenerate it as an assistant task. The current original is **1920 × 1080**. Keep the approved responsive layout and wheel interaction when the user supplies a replacement.

## Main files

- `app/page.tsx`, `app/home.module.css`, `components/home-wheel.tsx`: homepage.
- `app/globals.css`: shared theme and global Graduate font declaration.
- `app/editorial.module.css`, `app/about/page.tsx`, `app/lookbook/page.tsx`: editorial pages.
- `app/collections/drop-001/page.tsx`, `app/products/[handle]/page.tsx`, `app/cart/page.tsx`: storefront routes.
- `components/site-header.tsx`, `components/cart-drawer.tsx`: shared navigation and cart.

## Verification completed

- Production build, including TypeScript checking, passed.
- ESLint passed.
- Browser checks passed on all seven routes at 1440px, 390px, and 320px widths: no page overflow, clipped headings, footers, or JavaScript runtime errors.
- Size selection, add to cart, drawer quantities, cart review, and mobile navigation passed.
- Homepage wheel scrolling, wraparound, keyboard controls, touch swipes, and reduced motion were verified.
- Temporary browser scripts and screenshots are in `node_modules/.cache/`; these are disposable and may disappear during dependency installation.

## Running locally

Use `npm run dev` for development. For a production preview, run `npm run build` followed by `npm run start -- --hostname 127.0.0.1 --port 3000`.

Read `AGENTS.md` and the relevant installed Next.js documentation before changing code.

## Git and laptop continuation

This project is connected to `https://github.com/Eliasriv748/final-form-website.git` on branch `main`. Use this branch on the laptop; the repository's default branch may still be `master`.

For a fresh checkout:

```sh
git clone --branch main https://github.com/Eliasriv748/final-form-website.git
cd final-form-website
npm ci
npm run dev
```

For an existing checkout of this repository, switch to `main` and pull with `git pull --ff-only`, preserving any uncommitted laptop changes first.

## Existing limitations

- Checkout remains disabled because live Shopify cart/checkout integration is unfinished. Customer-facing copy says checkout is coming soon.
