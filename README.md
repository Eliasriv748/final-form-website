# Final Form V2

Latest project checkpoint: [HANDOFF.md](HANDOFF.md).

Final Form V2 is a Next.js App Router storefront for an independent apparel
brand. The current implementation preserves the original V2 product assets and
cart interaction while establishing a typed headless Shopify boundary.

## Local development

Next.js 16 requires Node.js 20.9 or newer.

```sh
npm install
npm run dev
```

Open `http://localhost:3000`.

Quality checks:

```sh
npm run lint
npm run typecheck
npm run build
```

## Shopify Storefront API

Copy `.env.example` to `.env.local` and provide the store domain and a private
Storefront API token. These values stay on the server and must not use a
`NEXT_PUBLIC_` prefix.

```sh
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_PRIVATE_TOKEN=your-private-token
SHOPIFY_STOREFRONT_API_VERSION=2026-07
```

Without these values, the storefront uses the two-product preview catalog in
`lib/catalog.ts`. Preview variant IDs begin with `preview://` so they cannot be
mistaken for Shopify merchandise IDs.

## Inventory states

Purchase state is derived in `lib/products.ts`:

- Positive or undisclosed available inventory: `in_stock`
- Zero inventory plus Shopify metafield `custom.preorder_eligible = true`:
  `preorder`
- All other cases: `unavailable`

The UI already communicates these states. Shopify cart mutations and live
checkout are the next commerce implementation step; checkout remains disabled
until that server-backed flow is connected.

## Routes

- `/` — editorial homepage
- `/collections/drop-001` — current collection
- `/products/[handle]` — product study and purchase controls
- `/cart` — persisted preview cart

Legacy `.html` URLs redirect to their canonical App Router equivalents.

The former static implementation remains at the repository root as a temporary
reference during migration. It is not used by the Next.js application.
