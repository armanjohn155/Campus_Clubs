# CampusClubs frontend

The API client uses the relative base URL `/api`. Vite proxies that path to the backend, so the same setting works in both environments:

- `npm run dev` on the host uses the Vite default target `http://localhost:8000`.
- Docker Compose sets `VITE_API_TARGET=http://backend:8000` for the frontend container.

The checked-in `.env.example` sets `VITE_API_URL=/api`; local `.env` files are ignored by Git. The API smoke test uses `http://localhost:8000/api` directly because it does not go through Vite.

## Development

```sh
npm install
npm run dev
```

With the full Compose stack running, open <http://localhost:5173>.
