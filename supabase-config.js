/* =========================================================
   DERÎ — Supabase connection settings
   -----------------------------------------------------------
   Fill these in with your own project's values:
   Supabase Dashboard → your project → Settings → API
     - "Project URL"        → SUPABASE_URL
     - "anon public" key    → SUPABASE_ANON_KEY

   The anon key is SAFE to have visible in front-end code —
   that is how Supabase is designed to work. Real protection
   comes from the Row Level Security policies in sql/schema.sql,
   not from hiding this key.
   ========================================================= */

const SUPABASE_URL = 'https://ihxypoqumyaiwtuqigqh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloeHlwb3F1bXlhaXd0dXFpZ3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MDQwNTIsImV4cCI6MjA5OTQ4MDA1Mn0.xH3fNh5LzhmLcijTPcXkROKnJPw2F2uq5mHBCml2uVY';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
