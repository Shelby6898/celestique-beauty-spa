# Celestique Beauty Spa

Responsive business website and appointment-management platform for Celestique Beauty Spa, Shamakhokho, Hamisi Constituency, Vihiga County, Kenya.

**Production:** https://celestique-beauty-spa.vercel.app
**Developer:** Taifatech Solutions

## Customer Features
- Responsive desktop and mobile website.
- Beauty and nail-care service catalogue.
- Online appointment requests through Supabase.
- WhatsApp booking and contact links.
- Business contact details and Google Maps directions.
- Business opening hours and image gallery.
- Privacy and browser-storage notices.

Appointment requests collect a customer's name, phone number, service or package, preferred date and time. The Supabase Edge Function `create-booking` processes requests. Submission does not guarantee confirmation; the spa must respond.

## Administration Portal
Access: `/admin`

Supabase Authentication and the `is_salon_admin` function protect administrator access.

Features:
- Appointment listing, details, search and status management.
- Pending, confirmed, completed and cancelled statuses.
- Date filters: all dates, today, this week, this month, last month, next 7 days and upcoming pending/confirmed.
- Service and package catalogue management.
- Business-hours management.
- Gallery and website image management.
- Administrator password updates.
- Monthly and annual reports.
- Aggregate CSV exports.

## Reports
Reports show appointment counts, status summaries, service popularity and quoted-price summaries. Annual reports include monthly trends.

Quoted prices are historical snapshots, not proof of payments, revenue or profit. CSV exports contain aggregate information, not individual customer names, phone numbers or booking records.

## Business Information
| Detail | Information |
|---|---|
| Business | Celestique Beauty Spa |
| Location | Shamakhokho, Hamisi Constituency, Vihiga County, Kenya |
| Phone | +254 111 994 579 |
| Email | andayitimothy48@gmail.com |
| Monday-Saturday | 8:00 AM-10:00 PM |
| Sunday | Closed |

## Technology
- React, JavaScript and Vite
- CSS
- Supabase PostgreSQL and Authentication
- Supabase Edge Functions
- Vercel
- ESLint

## Project Structure
```text
public/images/       Website images
src/                 React application
src/lib/supabase.js  Supabase client
src/Admin.jsx        Administration portal
src/Reports.jsx      Business reports
src/LegalPage.jsx    Privacy and cookie notices
src/main.jsx         Application routes
index.html           HTML entry point
package.json         Dependencies and scripts
vercel.json          Vercel routing configuration
```

## Getting Started
Requirements: Node.js compatible with Vite and npm.

1. Clone: `git clone https://github.com/Shelby6898/celestique-beauty-spa.git`
2. Enter the project: `cd celestique-beauty-spa`
3. Install: `npm install`
4. Create `.env.local` with these variables:

`VITE_SUPABASE_URL=https://your-project.supabase.co`

`VITE_SUPABASE_ANON_KEY=your-supabase-anon-key`

Use your own Supabase project values. Never expose a service-role key or privileged secret through a VITE_ variable.

## Development Commands
- `npm run dev` - start the development server.
- `npm run lint` - run ESLint.
- `npm run build` - create a production build.
- `npm run preview` - preview the production build.

## Supabase Backend
This repository does not provision the Supabase database or backend. The existing Supabase project must have its database schema, Row Level Security policies, administrator authorization, authentication configuration and `create-booking` Edge Function configured separately. Required Storage configuration must also exist for enabled website-management features.

Installing npm dependencies does not create the database, administrator account or deploy the Edge Function.

## Application Routes
- `/` - public website.
- `/admin` - administration portal.
- `/privacy` - privacy notice.
- `/cookies` - browser-storage information.

Vercel rewrites application routes to `index.html` for React navigation. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel before deployment.

## Privacy and Security
The application minimises booking information and restricts appointment administration to authorised administrators. Stored appointment information should be reviewed periodically and retained only as justified by business and legal requirements.

See `/privacy` and `/cookies` for the published notices.

## Photography
Website images are stored in `public/images/`. Publish only photographs the business is authorised to use.

## Credits
**Business:** Celestique Beauty Spa

**Website development:** Taifatech Solutions
