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
4. Fill in the repo details (name, description) and click **Create Repository**
5. Click **Publish repository** at the top
6. Choose Public or Private — for a CRM with client data structure, **Private** is the right call — and click **Publish Repository**

Done — your code is on GitHub.

---

## Deploy to Vercel

Since you already use Vercel for Life Agent Accelerator, this is the fastest path to a live URL.

1. Go to <https://vercel.com/new>
2. Click **Import** next to your `agent-crm` GitHub repo
3. Vercel auto-detects Vite — every default is correct
4. Click **Deploy**

About 60 seconds later you'll have a URL like `agent-crm-yourusername.vercel.app`. Open it on your phone — looks and behaves like a native app. Add it to your home screen for an app-like icon.

Every time you push to GitHub, Vercel rebuilds automatically.

---

## Project structure

```
agent-crm/
├── index.html              ← HTML shell + Google Fonts
├── package.json            ← dependencies
├── vite.config.js          ← Vite config (network access enabled)
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
