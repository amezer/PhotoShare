# PhotoShare — Setup Guide

## 1. Install dependencies

```bash
npm install
```

## 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. In the SQL Editor, paste and run the contents of `supabase/schema.sql`
4. Go to **Project Settings → API** and copy:
   - Project URL
   - anon/public key

## 3. Set up environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your Supabase values:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## 5. Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Add your environment variables in the Vercel dashboard (same as `.env`)
4. Deploy — Vercel auto-deploys on every push to main

---

## Project structure

```
src/
  pages/
    Login.jsx       # Login form
    Register.jsx    # Sign up form
    Feed.jsx        # All photos, newest first
    Upload.jsx      # Post a new photo
    Profile.jsx     # User profile + photo grid
  components/
    Navbar.jsx      # Top nav bar
    PhotoCard.jsx   # Single photo with caption
    CommentSection.jsx  # Comments + replies
  supabaseClient.js   # Supabase connection
  App.jsx             # Routes
supabase/
  schema.sql          # Database tables + policies
```
