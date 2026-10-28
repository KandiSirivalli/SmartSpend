# SmartSpend v2 — Login, profile, and cloud transactions

## 1. Keep the old project
Do not delete the old `smartspend-starter` folder. Keep it as a backup until your transactions are transferred.

## 2. Install and run
1. Extract this ZIP into a NEW folder, for example `Downloads\smartspend-v2`.
2. Open the folder that contains `package.json` in VS Code.
3. Open Terminal > New Terminal and run:
   ```powershell
   npm install
   ```
4. Create a Supabase project at https://supabase.com/dashboard.
5. In Supabase, open SQL Editor > New query. Paste all of `supabase_schema.sql`, then click Run.
6. In Supabase Project Settings, find the Project URL and publishable/anon key.
7. Copy `.env.example` to a new file named `.env` in the project root. Fill in:
   ```
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
   ```
   Do not use a service-role/secret key in this browser app.
8. Stop and restart Vite if it was already running, then:
   ```powershell
   npm run dev
   ```
9. Open the URL printed in the terminal (usually http://localhost:5173).

## 3. Login and profile
When Supabase is configured, the app starts with login and signup. After logging in, click the avatar on the top right or the profile at the lower left to open the profile and log out.

## 4. About your old transactions
The app has an **Import old transactions** button after login. It can import non-sample transactions only if the old app stored them under the same browser localStorage key (`smartspend_transactions`) and the new app is opened on the same origin/port. If it reports no saved transactions, do not clear browser data; open the old version on its old localhost port and we can export the data through the browser console or copy it manually.
The built-in sample transactions are demo data and are not automatically imported. This avoids mixing sample data into your real account.

## 5. Security
Each transaction belongs to a Supabase authenticated user. Row Level Security (RLS) policies in `supabase_schema.sql` enforce that users can access only rows where `user_id = auth.uid()`. Never disable RLS or place a Supabase service-role key in the frontend.
