# Glaze Library

Glaze Library is a Next.js App Router application for ceramic studios and glaze libraries. Members sign in with Supabase magic links, maintain a private glaze inventory, generate all owned 2-glaze combinations automatically, and publish kiln-tested photos for other signed-in members to browse.

## Stack

- Next.js 16 App Router
- Tailwind CSS 4
- Supabase Auth, Postgres, and Storage
- Stripe Checkout + Billing Portal subscription support
- Vercel-ready deployment

## Local development

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env.local
```

3. Add your Supabase values to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_MEMBER_PRICE_ID=...
STRIPE_WEBHOOK_SECRET=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. Link the repo to your hosted Supabase project:

```bash
npm run supabase:login
npm run supabase:link -- --project-ref your-project-ref
```

5. Push schema and starter catalog to the linked project:

```bash
npm run supabase:push
```

6. Configure Stripe billing:

- Create a recurring Stripe Price for the membership plan.
- Copy the Price ID into `STRIPE_MEMBER_PRICE_ID`.
- Point your Stripe webhook endpoint at `/api/stripe/webhook`.
- Subscribe the webhook to `checkout.session.completed`, `checkout.session.expired`, `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`.

7. Start the app:

```bash
npm run dev
```

Without Supabase keys, the app falls back to a demo workspace with seeded data so the UI can still be explored.

## Scripts

- `npm run dev` starts the local dev server
- `npm run build` builds the production app
- `npm run lint` runs ESLint
- `npm run test` runs unit tests for the combination logic
- `npm run import:facebook` opens a headed browser and archives selected Facebook group posts into the admin intake queue
- `npm run supabase:login` authenticates the Supabase CLI
- `npm run supabase:link -- --project-ref your-project-ref` links this repo to a hosted Supabase project
- `npm run supabase:push` applies all migrations, including the starter commercial glaze catalog
- `npm run supabase:start` starts the local Supabase stack
- `npm run supabase:reset:local` resets the local Supabase database

## Included MVP areas

- Marketing landing page
- Magic-link sign-in screen
- Dashboard
- Inventory listing, add, and edit flows
- Owned glaze combinations
- Combination detail pages
- Community browse/search
- Publish flow for shared photos
- Admin moderation queue
- Billing page with Checkout + Customer Portal actions

## Deploying to Vercel

1. Create a Vercel project and connect this repository.
2. Add the same Supabase and Stripe environment variables to the Vercel project.
3. Set `NEXT_PUBLIC_SITE_URL` to your production domain.
4. Run `npm run supabase:push` against the production Supabase project before promoting the deployment.
5. Update the Stripe webhook endpoint to `https://your-domain.com/api/stripe/webhook`.
