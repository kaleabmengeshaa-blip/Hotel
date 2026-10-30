# Classic Cafe and Restaurant

A QR-based digital menu with an admin dashboard for managing menu items, photos, availability, guest feedback, and menu QR codes. Menu and admin data are stored in PostgreSQL through Prisma.

## Requirements

- Node.js 20.9 or newer
- npm
- A PostgreSQL database

## Local Setup

1. Install dependencies:

	```powershell
	npm install
	```

2. Copy `.env.example` to `.env`, then set `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET`. Keep `.env` private and do not commit it.

3. Create or update the database schema:

	```powershell
	npx prisma migrate dev
	```

4. Start the development server:

	```powershell
	npm run dev
	```

Open `http://localhost:3000` for the guest menu and `http://localhost:3000/admin` for the admin dashboard.

Generate an admin session secret with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Use a unique password and secret in production. The admin session expires after eight hours.

## Database Seed

`prisma/seed.ts` adds missing sample categories and menu items without duplicating existing entries. Existing menu items are left unchanged:

```powershell
npx prisma db seed
```

## Checks and Production

```powershell
npm run lint
npm run build
npm start
```

For deployment, configure the same environment variables in the hosting provider and apply committed migrations with `npx prisma migrate deploy` before serving traffic.
