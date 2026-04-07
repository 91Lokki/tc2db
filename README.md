# TC2DB

TC2DB is a web-based racing management and car trading game inspired by *The Crew 2*.

This repository contains:

- A vanilla JS frontend at the project root
- A Node.js + Express + Prisma + PostgreSQL backend under [`backend/`](/Users/mike/Desktop/tc2db-main/backend)
- Seed tooling for reference data, a mock player ecosystem, leaderboard history, and used-car listings

## Stack

- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Node.js 20, Express, TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Validation: Zod
- Auth: JWT
- Password hashing: bcrypt

## Project Structure

```text
tc2db-main/
  api.js
  home.html
  index.html
  leaderboard.html
  profile.html
  register.html
  schedule.html
  trade.html
  style.css
  images/
  backend/
    package.json
    prisma/
      schema.prisma
      seed.ts
    src/
      app.ts
      server.ts
      config/
      lib/
      middlewares/
      modules/
```

## Backend Features

- Player registration, login, profile, password change, and soft delete
- Dealer market and used-car market flows
- Track lookup, season schedules, track history, and leaderboard standings
- Race simulation with admin-only controls
- New-season creation from the previous season template
- Mock ecosystem seeding so the UI has:
  - mock players
  - populated garages
  - used-car listings
  - season standings
  - race history

## Demo Screenshots

### Schedule Lookup

![Schedule Lookup](images/schedule_demo.png)

### Used Car Market

![Used Car Market](images/used.png)

### Leaderboard And Race Dashboard

![Leaderboard And Race Dashboard](images/simulate.png)

### Dealership Purchase Modal

![Dealership Purchase Modal](images/dealership.png)

### Player Profile And Garage

![Player Profile And Garage](images/profile.png)

## Quick Start

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Configure environment variables

Copy [`backend/.env.example`](/Users/mike/Desktop/tc2db-main/backend/.env.example) to `.env`.

Example:

```bash
cp .env.example .env
```

Default variables:

```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tc2db?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
JWT_EXPIRES_IN="7d"
BCRYPT_SALT_ROUNDS=10
CORS_ORIGIN="http://127.0.0.1:5500"
```

### 3. Run Prisma migration

The current schema includes an `isAdmin` flag on `Player`, so make sure the latest migration is applied.

```bash
npx prisma migrate dev --name init
npx prisma generate
```

If you already had an older local database before `isAdmin` was added:

```bash
npx prisma migrate dev --name add-admin-flag
npx prisma generate
```

### 4. Seed the database

```bash
npm run db:seed
```

What the seed does:

- Loads brand and car data from The Crew 2 CSV exports
- Seeds countries, brands, car models, tracks, and the 2024 season schedule
- Creates demo accounts and an admin account
- Creates a mock ecosystem with populated garages, market listings, race history, and standings

### 5. Start the backend

```bash
npm run dev
```

The API will run at:

```text
http://localhost:3000/api
```

### 6. Start the frontend

Serve the project root with any static server.

Examples:

```bash
python3 -m http.server 5500
```

or use VS Code Live Server.

Then open:

```text
http://127.0.0.1:5500/index.html
```

## Seed Data Sources

The backend seed reads vehicle data from CSV files.

Default expected directory:

```text
/Users/mike/Documents/tc2_crawler
```

Default filenames:

- `tc2_hypercars_full.csv`
- `tc2_street_full.csv`
- `tc2_touring_full.csv`

You can override them with environment variables before running the seed:

```bash
TC2_CSV_DIR=/path/to/csvs npm run db:seed
```

Or:

```bash
TC2_HYPERCARS_CSV=/path/hypercars.csv \
TC2_STREET_CSV=/path/street.csv \
TC2_TOURING_CSV=/path/touring.csv \
npm run db:seed
```

## Default Accounts

After seeding, the following are available:

- Admin account:
  - username: `admin`
  - password: `password123`
- Demo and mock accounts:
  - password: `password123`

Important:

- Only admin users can:
  - simulate races
  - create a new season
- Regular players can still browse standings, schedules, market data, and manage their own garage/account

## Backend Scripts

From [`backend/`](/Users/mike/Desktop/tc2db-main/backend):

```bash
npm run dev
npm run build
npm run start
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
npm run db:seed
npm test
```

## Main API Groups

### Players

- `POST /api/Players/register`
- `POST /api/Players/login`
- `PUT /api/Players/:playerId/password`
- `DELETE /api/Players/:playerId`
- `GET /api/Players/profile/:username`
- `GET /api/Players/garage`

### Market

- `GET /api/Market/options/brands`
- `GET /api/Market/options/countries`
- `GET /api/Market/dealer/cars`
- `GET /api/Market/used-cars`
- `POST /api/Market/buy`
- `POST /api/Market/sell`
- `POST /api/Market/cancel-sell`
- `POST /api/Market/purchase-used`

### Race

- `GET /api/Race/next-global`
- `GET /api/Race/next-schedule/:year`
- `GET /api/Race/schedules/:year`
- `POST /api/Race/simulate-next` (admin only)
- `POST /api/Race/new-season` (admin only)

### Leaderboard / Track

- `GET /api/Leaderboard/standings/:year`
- `GET /api/Track/options/years`
- `GET /api/Track/options/tracks`
- `GET /api/Track/history`

## Database Overview

Key models in [`backend/prisma/schema.prisma`](/Users/mike/Desktop/tc2db-main/backend/prisma/schema.prisma):

- `Country`
- `Brand`
- `CarModel`
- `Player`
- `OwnedCar`
- `MoneyTransaction`
- `Track`
- `RaceSchedule`
- `RaceResult`
- `SeasonPoints`

## Notes

- The frontend expects the backend under `/api`
- Frontend image loading includes handling for hotlink-sensitive sources
- The mock ecosystem seed intentionally leaves pending races so the admin can continue simulating the active season
- If auth behavior changes, log out and log back in to refresh the JWT payload

## Troubleshooting

### `simulate` or `new season` is disabled

Make sure you are logged in as:

- username: `admin`
- password: `password123`

If you previously logged in before the `isAdmin` field existed, log out and log in again.

### GitHub push does not work

This repository can be committed locally without being pushed. If `git push` fails, make sure GitHub authentication is configured on your machine.

### Seed fails because CSV files are missing

Either:

- place the CSV files in `/Users/mike/Documents/tc2_crawler`
- or override the CSV paths with environment variables

## License

This project currently has no explicit license file in the repository.
