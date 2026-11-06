# MAHGOOZ — محجوز

Arabic RTL venue discovery and booking site with an Express backend and PostgreSQL database.

## Included
- Existing MAHGOOZ front-end design (`public/index.html`)
- Express API server (`server.js`)
- PostgreSQL tables and seed data (auto-created at startup)
- Booking request submission persisted in database
- Admin dashboard at `/admin` for viewing bookings and updating status
- Admin API protected by `ADMIN_KEY`

## Render deployment
1. Push this folder to a GitHub repository.
2. In Render create a **PostgreSQL** database. Copy its **Internal Database URL**.
3. Create a **Web Service** from the repository.
4. Set Build Command: `npm install`
5. Set Start Command: `npm start`
6. In the Web Service Environment add:
   - `DATABASE_URL` = Internal Database URL from Render PostgreSQL
   - `ADMIN_KEY` = a long private random secret you create
7. Deploy. The app creates its tables and inserts the demo venue records at startup.
8. Open the generated Render service URL. Admin panel: append `/admin`.

## Important
- Never publish `.env` or the admin key. `.env.example` is only a template.
- This project contains demo venues matching the supplied HTML. Real business contacts, venue details, availability calendars, and payment integration require their own data and implementation.
- Booking requests are saved as `pending`; this is a booking request system, not a confirmed reservation or payment system.
- Render may sleep on some free service plans and the first request can take a while.
