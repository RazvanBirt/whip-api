# Whip API

Backend API for the Whip car platform.

## Local development URLs

With the default local `.env`:

| Service      | URL                                   |
| ------------ | ------------------------------------- |
| API server   | `http://localhost:3000`               |
| API base URL | `http://localhost:3000/api`           |
| Health check | `http://localhost:3000/health`        |
| PostgreSQL   | `postgresql://localhost:5432/whip_db` |

All application API routes are mounted under `/api`.

Examples:

```text
http://localhost:3000/api/makes
http://localhost:3000/api/models
http://localhost:3000/api/garage
```

The health endpoint is outside `/api`:

```text
http://localhost:3000/health
```

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create your environment file

Copy the reusable template:

```bash
cp .env.example .env
```

The template already contains the normal local PostgreSQL, port, cookie, JWT development settings, Supabase project URL, and bucket.

You only need to add private secrets that must not be committed, especially:

```env
SUPABASE_SERVICE_ROLE_KEY=...
```

### 3. Start PostgreSQL

Using Docker:

Local database defaults:

```text
Host: localhost
Port: 5432
Database: whip_db
User: whipuser
Password: whipuser_password

```

```bash
docker run -d --name whip-postgres -p 5432:5432 -e POSTGRES_USER=whipuser -e POSTGRES_PASSWORD=whipuser_password -e POSTGRES_DB=whip_db postgres:15
```

### 4. Generate Prisma client

```bash
npx prisma generate
```

### 5. Run database migrations

```bash
npx prisma migrate dev
```

### 6. Start the API

```bash
npm run dev
```

The API will be available at:

```text
http://localhost:3000
```

Check that it is running:

```text
GET http://localhost:3000/health
```

---

## Environment variables

For a new machine:

```bash
cp .env.example .env
```

Then paste your private Supabase service-role key into `.env`.

### App

| Variable   | Local value             |
| ---------- | ----------------------- |
| `NODE_ENV` | `local`                 |
| `PORT`     | `3000`                  |
| `APP_URL`  | `http://localhost:3000` |

### PostgreSQL

| Variable            | Local value                                                                    |
| ------------------- | ------------------------------------------------------------------------------ |
| `POSTGRES_USER`     | `whipuser`                                                                     |
| `POSTGRES_PASSWORD` | `whipuser_password`                                                            |
| `POSTGRES_DB`       | `whip_db`                                                                      |
| `POSTGRES_HOST`     | `localhost`                                                                    |
| `POSTGRES_PORT`     | `5432`                                                                         |
| `DATABASE_URL`      | `postgresql://whipuser:whipuser_password@localhost:5432/whip_db?schema=public` |

### Authentication

| Variable            | Local development value               |
| ------------------- | ------------------------------------- |
| `JWT_ACCESS_SECRET` | `change_me_access_very_long_random`   |
| `JWT_ACCESS_TTL`    | `15m`                                 |
| `REFRESH_TTL_DAYS`  | `30`                                  |
| `RESET_TTL_MINUTES` | `30`                                  |
| `COOKIE_SECRET`     | `change_me_cookie_secret_long_random` |
| `COOKIE_DOMAIN`     | `localhost`                           |
| `COOKIE_SECURE`     | `false`                               |
| `COOKIE_SAMESITE`   | `lax`                                 |

The current API uses JWTs for access tokens. Refresh tokens are opaque session tokens, and their lifetime is controlled by `REFRESH_TTL_DAYS`.

### Supabase

| Variable                    | Local value                                |
| --------------------------- | ------------------------------------------ |
| `SUPABASE_URL`              | `https://szrmpjeykqejfjzxnqqr.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Private — add to `.env` only               |
| `SUPABASE_BUCKET`           | `whip_images`                              |

Never commit a Supabase service-role key.

---

# API endpoints

## Authentication

Base URL:

```text
http://localhost:3000/api/auth
```

| Method | Endpoint                    | Auth required |
| ------ | --------------------------- | ------------- |
| `POST` | `/api/auth/register`        | No            |
| `POST` | `/api/auth/login`           | No            |
| `POST` | `/api/auth/refresh`         | No            |
| `POST` | `/api/auth/logout`          | No            |
| `POST` | `/api/auth/forgot-password` | No            |
| `POST` | `/api/auth/reset-password`  | No            |
| `POST` | `/api/auth/change-password` | Yes           |

For authenticated endpoints send:

```http
Authorization: Bearer <accessToken>
```

---

## Makes

| Method   | Endpoint                | Auth required |
| -------- | ----------------------- | ------------- |
| `GET`    | `/api/makes`            | No            |
| `GET`    | `/api/makes/:id`        | No            |
| `POST`   | `/api/makes`            | Yes           |
| `POST`   | `/api/makes/with-image` | Yes           |
| `PATCH`  | `/api/makes/:id`        | Yes           |
| `DELETE` | `/api/makes`            | Yes           |

---

## Models

| Method   | Endpoint                          | Auth required |
| -------- | --------------------------------- | ------------- |
| `GET`    | `/api/models`                     | No            |
| `GET`    | `/api/models/:id`                 | No            |
| `POST`   | `/api/models`                     | Yes           |
| `PATCH`  | `/api/models/:id`                 | Yes           |
| `DELETE` | `/api/models`                     | Yes           |
| `POST`   | `/api/models/catalog/models/full` | Yes           |

> The current route in the API source is `/api/models/catalog/models/full`. If you later simplify it to `/api/models/catalog/full`, update this table at the same time.

---

## Body types

| Method   | Endpoint              | Auth required |
| -------- | --------------------- | ------------- |
| `GET`    | `/api/body-types`     | No            |
| `GET`    | `/api/body-types/:id` | No            |
| `POST`   | `/api/body-types`     | Yes           |
| `PATCH`  | `/api/body-types/:id` | Yes           |
| `DELETE` | `/api/body-types`     | Yes           |

---

## Engines

| Method   | Endpoint           | Auth required |
| -------- | ------------------ | ------------- |
| `GET`    | `/api/engines`     | No            |
| `GET`    | `/api/engines/:id` | No            |
| `POST`   | `/api/engines`     | Yes           |
| `PATCH`  | `/api/engines/:id` | Yes           |
| `DELETE` | `/api/engines`     | Yes           |

---

## Transmissions

| Method   | Endpoint                 | Auth required |
| -------- | ------------------------ | ------------- |
| `GET`    | `/api/transmissions`     | No            |
| `GET`    | `/api/transmissions/:id` | No            |
| `POST`   | `/api/transmissions`     | Yes           |
| `PATCH`  | `/api/transmissions/:id` | Yes           |
| `DELETE` | `/api/transmissions`     | Yes           |

---

## Drivetrains

| Method   | Endpoint               | Auth required |
| -------- | ---------------------- | ------------- |
| `GET`    | `/api/drivetrains`     | No            |
| `GET`    | `/api/drivetrains/:id` | No            |
| `POST`   | `/api/drivetrains`     | Yes           |
| `PATCH`  | `/api/drivetrains/:id` | Yes           |
| `DELETE` | `/api/drivetrains`     | Yes           |

---

## Garage

All garage endpoints require an authenticated user.

| Method   | Endpoint          | Auth required |
| -------- | ----------------- | ------------- |
| `GET`    | `/api/garage`     | Yes           |
| `POST`   | `/api/garage`     | Yes           |
| `GET`    | `/api/garage/:id` | Yes           |
| `PATCH`  | `/api/garage/:id` | Yes           |
| `DELETE` | `/api/garage/:id` | Yes           |

---

## Health check

The health endpoint is not mounted under `/api`.

| Method | Endpoint  | Auth required |
| ------ | --------- | ------------- |
| `GET`  | `/health` | No            |

Local URL:

```text
http://localhost:3000/health
```

Example response:

```json
{
  "api": "ok",
  "database": "connected"
}
```

---

## Seed data via API

Run the API first, then:

```bash
BASE_URL="http://localhost:3000" \
API_PREFIX="/api" \
npx tsx scripts/seed-via-api.ts
```

If you use explicit seed-user credentials:

```bash
SEED_EMAIL="seed@local.dev" \
SEED_PASSWORD="SeedPassword123!" \
BASE_URL="http://localhost:3000" \
API_PREFIX="/api" \
npx tsx scripts/seed-via-api.ts
```

---

## Useful development commands

```bash
# Start API
npm run dev

# Generate Prisma client
npx prisma generate

# Create/apply a development migration
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio

# Start PostgreSQL
docker compose up -d postgres

# Stop PostgreSQL
docker compose down

# Seed through the API
BASE_URL="http://localhost:3000" API_PREFIX="/api" npx tsx scripts/seed-via-api.ts
```
