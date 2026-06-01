# PhotoShare

A full-stack photo sharing web application where users can post photos, follow other users, leave comments and replies, and like posts.

🔗 **Live site:** [photo-share-jet.vercel.app](https://photo-share-jet.vercel.app)

## Features

- **Auth** — sign up and log in with email and password
- **Photo feed** — view posts from people you follow, with suggested posts from other users
- **Upload** — post photos by clicking, dragging, or pasting from clipboard
- **Comments & replies** — comment on posts and reply to individual comments
- **Likes** — like and unlike posts
- **Follow system** — follow/unfollow users, track followers and following counts
- **User profiles** — photo grid, bio, and profile picture
- **Edit profile** — update username, bio, and avatar
- **Search** — find users by username
- **Responsive** — works on mobile and desktop

## Tech Stack

- **Frontend:** React, React Router, Vite
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Deployment:** Vercel

## Local Setup

1. Clone the repo and install dependencies:
```bash
git clone https://github.com/amezer/PhotoShare.git
cd PhotoShare
npm install
```

2. Create a Supabase project at [supabase.com](https://supabase.com) and run the SQL files in order:
```
supabase/schema.sql
supabase/follows.sql
supabase/likes.sql
```

3. Create a `.env` file:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Start the dev server:
```bash
npm run dev
```

## Database Schema

- `profiles` — extends Supabase auth users with username, bio, avatar
- `photos` — photo posts with image URL and caption
- `comments` — comments and replies (self-referencing via `parent_id`)
- `follows` — follow relationships between users
- `likes` — likes on photos
