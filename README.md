# Real Estate Pro CRM

A production-ready React web application for real estate professionals. Features a responsive design from a single codebase (Desktop + Mobile), live data integration with GoHighLevel (GHL) via Private Integration Tokens (PIT), and Supabase for user authentication and file storage.

## Architecture

- **Frontend Framework:** React 18 + Vite + TypeScript (strict mode)
- **Routing:** React Router v6
- **State Management:** TanStack Query v5 with local storage persistence
- **Styling:** Tailwind CSS + CSS-variable OKLCH token system + shadcn/ui
- **Forms & Validation:** React Hook Form + Zod
- **Auth & Storage:** Supabase
- **Data Source:** GoHighLevel (GHL) API 2.0 via Private Integration Token (PIT)

## Code Formatting & Linting

Code formatting and code quality checks are handled entirely via ESLint. We do not use Prettier in this project in order to maintain a single source of truth for code style rules. Run `npm run lint` or `bun run lint` to verify the codebase.

## Setup & Environment Variables

Create a `.env` file in the root directory (do not commit this file). See `.env.example` for the required variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

> **Note:** The `VITE_SUPABASE_PUBLISHABLE_KEY` is public-by-design, but ensure your Supabase project has Row Level Security (RLS) enabled. The GHL Location ID should be treated as non-secret-but-private.

## Creating a GoHighLevel Private Integration Token (PIT)

1. Log in to your GHL account and navigate to **Settings > Private Integrations**.
2. Click **Create New** or **New Integration**.
3. Select the required scopes. This application requires:
   - `contacts.readonly`, `contacts.write`
   - `opportunities.readonly`, `opportunities.write`
   - `objects.readonly`, `objects.write`
   - `associations.readonly`, `associations.write`
   - `conversations.readonly`, `conversations/message.write`
   - `calendars.readonly`, `calendars/events.readonly`, `calendars/events.write`
   - `users.readonly`
   - `locations.readonly`
   - `locations/customFields.readonly`, `locations/customValues.readonly`
   - `tags.readonly`, `tags.write`
   - `medias.readonly`, `medias.write`
   - `tasks.readonly`, `tasks.write`
   - `notes.readonly`, `notes.write`
   - `templates.readonly`
4. Copy the generated token and your Location ID.
5. In the CRM, after signing up, you will be prompted to enter these credentials in the Integrations Settings tab.

> **Development Fallback:** In local development mode (`npm run dev`), you can bypass the Integrations onboarding screen by setting `VITE_GHL_PIT` and `VITE_GHL_LOCATION_ID` in your `.env` file. These fallbacks are ignored in production builds.

> **Document Uploads:** Note that progress tracking for document uploads to Supabase Storage is currently limited by the underlying SDK capabilities. Large files may appear to pause before completion.

## Migration Notes for v2 (Edge Function Proxy)

Currently, the application communicates directly with the GHL API from the browser using the stored PIT. In v2, this will be migrated to a Supabase Edge Function proxy for enhanced security and to support webhooks.

- **Frontend changes:** The `ghlFetch` utility in `src/lib/ghl/client.ts` should be updated to point to your Supabase Edge Function URL instead of the direct GHL endpoint.
- **Backend changes:** Deploy an Edge Function that reads the user's stored PIT from the `ghl_credentials` table, attaches it to the request, and forwards it to GHL.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run typecheck` - Run TypeScript compiler check
- `npm run lint` - Run ESLint
