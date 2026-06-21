# Fresh Cafe' & Market — Deploy Instructions (Mobile-Friendly)

These steps work entirely from your phone's browser. No app installs, no terminal, no Node.js needed.

## Step 1 — Create a free GitHub account
1. Go to github.com in your phone browser
2. Sign up (free)

## Step 2 — Create a new repository
1. Tap the "+" icon (top right) → "New repository"
2. Name it `fresh-cafe-app`
3. Keep it Public
4. Tap "Create repository"

## Step 3 — Upload these files
1. On your new empty repo page, tap "uploading an existing file" (or the "Add file" button → "Upload files")
2. Upload ALL files from this zip, keeping the folder structure:
   - `index.html`
   - `package.json`
   - `vite.config.js`
   - `.gitignore`
   - `src/main.jsx`
   - `src/App.jsx`
3. Tap "Commit changes" at the bottom

   Note: GitHub's mobile upload may not preserve the `src/` folder automatically.
   If `main.jsx` and `App.jsx` don't end up inside a `src` folder, create the folder
   first: tap "Add file" → "Create new file" → type `src/main.jsx` as the filename
   (the `src/` prefix auto-creates the folder), paste the content, commit. Repeat
   for `src/App.jsx`.

## Step 4 — Create a free Vercel account
1. Go to vercel.com
2. Tap "Sign Up" → choose "Continue with GitHub"
3. Authorize Vercel to access your GitHub account

## Step 5 — Deploy
1. On Vercel's dashboard, tap "Add New" → "Project"
2. Find and select your `fresh-cafe-app` repo → tap "Import"
3. Vercel auto-detects it's a Vite project — leave all settings as default
4. Tap "Deploy"
5. Wait ~1 minute. You'll get a live URL like `fresh-cafe-app.vercel.app`

## Step 6 — Test it
- Open your new URL → you should see the table number screen (customer view)
- Open `your-url.vercel.app/#kitchen` → you should see the kitchen board
- Place a test order on one, check it appears on the other

## After this works
Once deployed, the Supabase connection will work properly (the artifact preview's
network restrictions won't apply on a real hosted site). If the kitchen still shows
a red "no connection" bar, send the exact error text shown and we'll debug from there.

Next steps after a successful deploy:
- Generate QR codes for each table (pointing to `your-url.vercel.app/#table=N`)
- Optional: connect a custom domain (e.g. freshcafe.com) instead of the vercel.app one
