Supabase Dapp Template (Auth + Data Layer)

Overview
- Client-side Supabase integration using @supabase/supabase-js
- Auth helpers: signUp, signIn, signOut, getUser
- Simple CRUD for a projects table via the db.ts helper
- Auth callback route ready at /api.auth

What you get
- web-ui/app/lib/supabase/client.ts
- web-ui/app/lib/supabase/auth.ts
- web-ui/app/lib/supabase/db.ts
- web-ui/app/routes/api.auth.ts
- web-ui package.json dependency on @supabase/supabase-js
- A small, ready-to-use Supabase-backed template to customize further

Usage notes
- Ensure SUPABASE_URL and SUPABASE_ANON_KEY are provided in environment
- If keys are missing, the client initializes a graceful mock to avoid runtime errors
- Use the db.ts helpers to perform CRUD on the projects table

Directory map
- web-ui/app/lib/supabase/ - client.ts, auth.ts, db.ts
- web-ui/app/routes/ - api.auth.ts (callback route)
- templates/supabase-dapp/ - this README and starter scaffold

How to customize
- Paste your real Supabase project keys into environment or CI variables
- Extend db.ts with additional tables as needed
- Wire up UI components to call the auth/db helpers for login, signup, and data operations
