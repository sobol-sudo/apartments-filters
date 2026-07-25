# Nuxt Apartments Filter

This project is a page with a catalog of apartments featuring filtering by various criteria. Built with Nuxt 3 and Vue 3, using Pinia for state management.

<img width="1259" height="767" alt="{BC5B99B8-F0B0-4DE3-BEC4-AC46174EB599}" src="https://github.com/user-attachments/assets/2a17dc41-cdc6-46fb-bc0c-e72cd8da5dd0" />


---

## Features

- Apartment listing with paging ("Load more"), rendered on the server
- Filtering by bedroom count, price and area; sorting by any of the four data columns
- Filters and sort order survive a reload, and are applied during SSR as well
- Apartment detail page at `/apartments/:id`, deep-linkable, with a real 404
- Explicit empty, error and no-data states, each with a way out

---

## How the filters are persisted

Saved filters are kept in a cookie rather than in `localStorage`.

The list is server-rendered, and the server can only see what the browser sends
with the request. With `localStorage` a returning visitor is served the
unfiltered catalogue and watches it change once hydration runs. A cookie is
readable on both sides, so the server renders exactly what the client is about
to render — no flash, no hydration mismatch.

The cookie is user-editable, so it is treated as untrusted input: unknown shapes
fall back to the defaults and out-of-bounds ranges are clamped, which means a
corrupt value can never lock the page into a permanent empty state.

---

## Data

`server/api/apartments` and `server/api/apartments/:id` are Nitro routes backed
by a fixed dataset in `entities/apartment/mock`. During SSR Nuxt resolves them
in-process, so a server render costs a function call rather than a round trip.
Everything on screen — bedroom chips, the floor count, price per m² — is derived
from that dataset; nothing is hard-coded to look fuller than the data is.

---

## Technologies

- **Nuxt 3** – framework based on Vue 3 for SSR and SSG  
- **Vue 3** – modern frontend framework  
- **Pinia** – global state management  
- **vue-3-slider-component** – range slider component  
- **Sass/SCSS** – styling  

---

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Type-check the whole project:

```bash
pnpm typecheck
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
