# Agent CRM

Mobile-first sales CRM for life insurance agents working the **B.E.S.T. mortgage protection script**. Built with React 18, Vite, Tailwind, and lucide-react.

## What's inside

- **Lead dashboard** with status filters (New, Call Back, Appointment, Application, No Contact, No Engagement, Not Interested) and search
- **Full B.E.S.T. Script** with inline lead capture — every Quility placeholder is a tappable field
- **Carrier underwriting follow-ups** auto-detect 13 conditions (Diabetes, HBP, Heart Attack, Stroke, Cancer, COPD, Asthma, Sleep Apnea, Mental Health, Cholesterol, Kidney, AFib, Thyroid) and surface the exact questions carriers want
- **Cheat sheet** modal accessible from anywhere
- **Tap-to-call** via `tel:` links
- **Persistent storage** via localStorage (easy swap-in point for Supabase later)
- **Mobile-optimized** sticky disposition bar at bottom

---

## Run it locally on your Mac

### One-time setup: install Node.js

If you don't already have it:

1. Go to <https://nodejs.org>
2. Download the **LTS** version (the green button on the left)
3. Run the installer

Verify in Terminal:

```bash
node -v
npm -v
```

You should see version numbers like `v20.x.x` and `10.x.x`.

### Run the app

1. Unzip this folder somewhere you'll remember — for example `~/Sites/agent-crm`
2. Open Terminal (Cmd-Space → "Terminal")
3. Navigate to the folder and install dependencies:

```bash
cd ~/Sites/agent-crm
npm install
```

That takes about 30–60 seconds the first time.

4. Start the dev server:

```bash
npm run dev
```

5. Open <http://localhost:5173> in your browser.

To test it on your phone over Wi-Fi, look at the Terminal output — you'll see a "Network" URL like `http://192.168.1.x:5173`. Open that on your phone (must be on the same Wi-Fi).

To stop the dev server: Ctrl-C in Terminal.

---

## Push to GitHub (with GitHub Desktop)

1. Open **GitHub Desktop**
2. **File → Add Local Repository** → choose your `agent-crm` folder
3. It'll say "this directory does not appear to be a Git repository" — click **"create a repository"** in that warning
4. **Important**: keep the repository name exactly **`agent-crm`** (or update `base: '/agent-crm/'` in `vite.config.js` to whatever name you pick — they have to match)
5. Click **Create Repository**
6. Click **Publish repository** at the top — choose Public (GitHub Pages requires Public on free accounts) and click **Publish Repository**

Done — your code is on GitHub.

---

## Deploy to GitHub Pages

GitHub doesn't auto-build Vite apps, so we use a GitHub Actions workflow (already included at `.github/workflows/deploy.yml`) that builds and deploys on every push.

### One-time setup

After your first push:

1. Go to your repo on github.com → **Settings → Pages** (in the left sidebar)
2. Under **"Build and deployment"**, change **Source** to **"GitHub Actions"**
3. That's it — no other settings to touch

### Watch the first build

1. Click the **Actions** tab on your repo
2. You'll see a workflow run called "Deploy to GitHub Pages" — wait for the green checkmark (~90 seconds)
3. Your site is now live at **`https://yourusername.github.io/agent-crm/`**

If you renamed the repo (so it's not `agent-crm`), you need to update `base: '/your-repo-name/'` in `vite.config.js`, commit, and push — otherwise the page will be blank because of broken asset paths.

### Every push after that

Just commit and push from GitHub Desktop. The Actions tab shows the rebuild, and 60–90 seconds later your live site updates.

### If your live site shows a blank page

It's almost always one of these:

**1. Pages source is set wrong (most common).** Settings → Pages → Source must be **"GitHub Actions"**, not "Deploy from a branch". The branch option triggers Jekyll, which doesn't understand Vite/React and will serve a broken page. If you've added any Jekyll files trying to fix things — `_config.yml`, front matter blocks (`---` at the top of HTML), Gemfile — delete them. This project includes a `public/.nojekyll` file that explicitly disables Jekyll on the deploy output.

**2. The `base` in `vite.config.js` doesn't match your repo name.** If your repo is `my-crm` instead of `agent-crm`, change `base: '/agent-crm/'` to `base: '/my-crm/'`, commit, push.

**3. You missed the trailing slash in the URL.** GitHub Pages serves at `https://username.github.io/agent-crm/` *with* the slash. Without it, asset paths break.

To diagnose: open the broken page → right-click → Inspect → Console tab. The 404 errors there tell you exactly which path the browser is trying (and failing) to load. The path in the error reveals whether it's a base-path issue or a Jekyll-mangled-path issue.

---

## Project structure

```
agent-crm/
├── .github/
│   └── workflows/
│       └── deploy.yml      ← auto-deploys to GitHub Pages on push
├── index.html              ← HTML shell + Google Fonts
├── package.json            ← dependencies
├── vite.config.js          ← Vite config (base path for GitHub Pages)
├── tailwind.config.js      ← Tailwind config
├── postcss.config.js       ← PostCSS config
├── .gitignore
├── README.md               ← this file
└── src/
    ├── App.jsx             ← the entire CRM (one component, ~1400 lines)
    ├── main.jsx            ← entry point + storage polyfill
    └── index.css           ← Tailwind directives
```

---

## Where the data lives

Lead data is saved to **localStorage** in your browser, under two keys:

- `agent_crm_data_v2` — all leads (JSON)
- `agent_crm_profile_v1` — your agent profile (name)

This means each device has its own copy — nothing syncs across devices. To clear everything: open your browser's DevTools → Application tab → Local Storage → delete the keys.

---

## Migrating into Life Agent Accelerator (Next.js + Supabase)

When you're ready to fold this into your multi-tenant SaaS, here's the playbook:

1. **Component**: Copy `src/App.jsx` into a new route, e.g. `app/(dashboard)/agent-crm/page.jsx`. Add `'use client'` at the top.

2. **Storage swap**: The single integration point is in `src/main.jsx` — the `window.storage` polyfill. Replace its bodies with Supabase calls:

   ```jsx
   window.storage = {
     get: async (key) => {
       const { data } = await supabase
         .from('agent_data')
         .select('value')
         .eq('agent_id', agentId)  // multi-tenant scoping
         .eq('key', key)
         .single()
       return data ? { value: data.value } : null
     },
     set: async (key, value) => {
       await supabase.from('agent_data').upsert({
         agent_id: agentId,
         key,
         value: String(value),
       })
       return { value }
     },
     // ... delete, list
   }
   ```

   The component code never has to change.

3. **Lead schema** is defined in `makeLead()` near the top of `App.jsx`. Mirror that into a `leads` table in Supabase if you'd rather normalize the data instead of dumping JSON blobs. Either approach works.

4. **Conventions** to keep: named React imports only (no default React), wrap any `useSearchParams` consumer in Suspense, use try/catch on Supabase admin queries, never write `plan_tier` from the client side.

---

## Common scripts

```bash
npm run dev      # local dev server with hot reload
npm run build    # production build → dist/
npm run preview  # preview the production build locally
```

---

## License

Private use. Generated for Gavin Morel's insurance agency workflow.
