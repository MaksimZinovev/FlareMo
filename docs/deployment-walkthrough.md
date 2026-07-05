> Architecture diagram: [`flaremo-architecture.html`](./flaremo-architecture.html) (same folder — open in a browser; has dark/light toggle + PNG/SVG export).

## What we did — in plain words

You wanted to try **FlareMo**, a notes app that runs on Cloudflare's free tier. We took it from a GitHub repo to a live, locked-down website in 9 steps. Here's the whole story, simply:

### 1. We put the app on the internet
FlareMo isn't a program you install on your Mac. It's a **website that lives on Cloudflare's servers**. To get it there we:
- **Copied the code** from GitHub to your computer (`git clone`)
- **Installed its dependencies** (the libraries it needs — like buying the parts before building furniture)
- **Logged into Cloudflare** from the terminal (`wrangler login`)
- **Created two storage bins** on your Cloudflare account:
  - **D1** — a database (where your notes text lives)
  - **R2** — a file bucket (where uploaded images / attachments live)
- **Told the app which bins to use** by editing one line in a config file
- **Ran safety checks** (`verify` + `dry-run`) — like a dress rehearsal before the real show
- **Set up the database tables** (`migrate`) — created the empty "notes", "users", etc. folders inside D1
- **Published it** (`deploy`) — Cloudflare put your app live at **`https://flaremo.yoursubdomainname.workers.dev`**

### 2. We picked a name for your site
Cloudflare needed a one-time public name (`yoursubdomainname`), so your site address became `flaremo.**yoursubdomainname**.workers.dev`. The `frontend` agent did this in the dashboard for us.

### 3. We locked the door (the important part)
By default anyone with the link could read/write your notes. So we set up **Cloudflare Access** — a bouncer in front of your app. We created **4 rules**:

| Who | What they want | The bouncer's rule |
| --- | --- | --- |
| **You** in a browser | To use FlareMo | ✅ **Allow** — log in once with `youremail@gmail.com`, stay logged in for a week |
| **A script / MCP / API client** | To call the API automatically | ✅ **Service Auth** — only if it shows a secret **Service Token** (the Client ID + Secret you saved) |
| **Anyone** clicking a public share link | To view one shared note | ✅ **Bypass** — no login needed, for `/share/*`, `/api/public/shares/*`, `/assets/*` only |
| **Everyone else** | Anything else | ❌ Blocked → sent to the login page |

The clever bit: even on the "bypass" public-share paths, **FlareMo itself still checks the share token** — so a made-up link returns 404, not your notes. We proved all this with `curl` tests (shown in the diagram's "Verified" card).

### 4. The diagram shows how a request flows

Look at the diagram: a request comes from one of the three left-side boxes (You / API client / Public viewer) → hits **Cloudflare Access** (the security box) → if the rule passes, it goes to the **FlareMo Worker** (the app) → which reads/writes **D1** (notes) and **R2** (attachments). Everything inside the dashed "Cloudflare" box runs on Cloudflare's free tier.

## TL;DR

You now own a private notes website at `https://flaremo.yoursubdomainname.workers.dev`. You log in with your email. Scripts can talk to it with a secret token. Public share links work for anyone you share them with. It costs $0, runs on Cloudflare's edge, and the data is yours (in your D1 + R2).