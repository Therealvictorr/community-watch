# v0-community-watch-app

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_i52VjNeTubKK9FhrgHolqNeovaQ0)

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Add environment variables in a local-only file (`.env.local` recommended):

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. Run database SQL scripts in Supabase SQL editor (in order):

- `scripts/001_create_profiles.sql`
- `scripts/002_create_reports.sql`
- `scripts/003_create_attachments.sql`
- `scripts/004_create_sightings.sql`
- `scripts/005_create_sighting_photos.sql`
- If your DB already existed from earlier scripts, also run:
  - `scripts/006_align_existing_schema_to_app.sql`

4. Run development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Preview/demo notes

- If Supabase env vars are missing, the app falls back to demo/mock content.
- For a real end-to-end demo (auth + persisted reports + sightings), Supabase env vars and SQL setup must be completed.
- You can export a report as a demo vCon JSON at `GET /api/reports/:id/vcon` (also linked in the report details page).
- This is now suitable for a demo of a complete vCon-shaped object for each report, including report metadata, attachments, and sightings dialog entries.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [v0 Documentation](https://v0.app/docs)

<a href="https://v0.app/chat/api/kiro/clone/Therealvictorr/v0-community-watch-app" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
