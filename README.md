# DuaMaker

Community-driven Islamic supplication database for CMU-Q MSA. Deploy at **dua.cmuqmsa.org**.

## Setup (zero config)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run**
   ```bash
   npm run dev
   ```

That's it. The SQLite database is created automatically at `data/duamaker.db` on first run (like al-amanah).

3. **Optional:** Set `ADMIN_PASSWORD` in `.env.local` for the admin dashboard (default works for dev).

## Deployment (dua.cmuqmsa.org)

### Docker (recommended)

1. **Set the admin password**
   ```bash
   export ADMIN_PASSWORD="your-secure-password"
   ```
   Or create a `.env` file in the project root:
   ```
   ADMIN_PASSWORD=your-secure-password
   ```

2. **Build and run**
   ```bash
   cd duamaker
   docker compose up -d
   ```

3. **Access**
   - App runs on port 3000
   - SQLite data persists in the `duamaker_data` Docker volume
   - Use a reverse proxy (nginx/caddy) for HTTPS and subdomain routing

**Useful commands:**
- `docker compose logs -f` – view logs
- `docker compose down` – stop (data in volume is preserved)
- `docker compose up -d --build` – rebuild and restart after code changes

### Without Docker

- Build: `npm run build`
- Start: `npm start`
- The `data/` folder persists the database. Ensure it's writable.
- Use a reverse proxy (nginx/caddy) for HTTPS and subdomain routing.

## Features

- **Browse** – View approved duas, filter by category, sort by newest or popularity
- **Personal lists** – Add duas to Current or Comprehensive list (LocalStorage)
- **Submit** – Public form to submit new duas (pending until admin approval)
- **My List** – View saved duas, download as `.tex` or PDF
- **Admin** – Hidden route `/admin-dashboard` to approve/reject/edit pending submissions
