# personal-site

My corner of the internet:

- **Ramblings**: the blog.
- **Raving**: reviews of music, video games, movies and TV, scored out of ten and filterable by category.
- **Portfolio**: an interactive scrolling timeline, with a one-click PDF version.
- **Gallery**: photography, with a lightbox and EXIF details.

Built with React 19, TypeScript, TanStack Router and TanStack Query on Vite. Content is Markdown/YAML in this repo, editable in the browser at `/admin`. It's hosted free on GitHub Pages.

---

## Running it locally

```bash
npm install
npm run dev
```

Open http://localhost:5173. Saving any file under `content/` updates the open page in place, without a reload. Drafts show up locally with a **Draft** badge, but never on the live site.

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with live content reload |
| `npm run build` | Type-check, build content, bundle into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Content pipeline and filter/format tests (`node --test`) |
| `npm run lint` | oxlint |
| `npm run content` | Just validate and build content (add `-- --drafts` to include drafts) |

---

## Writing and uploading

### Option 1: in the browser (`/admin`)

Go to `https://<your-site>/admin/` and choose **Sign In Using Access Token**.
You'll need a GitHub token the first time:

1. GitHub → Settings → Developer settings → **Fine-grained personal access tokens** → Generate new token.
2. Repository access: **Only select repositories** → this repo.
3. Permissions → Repository permissions → **Contents: Read and write**.
4. Generate it, and paste it into the admin sign-in.

The editor gives you:
- a rich-text editor for post bodies, with a toolbar for headings, bold, links, quotes, lists and images; you can flip to raw Markdown at any time
- form fields for title, date, tags, cover image, and, for raves, category and rating
- drag-and-drop photo uploads

Saving commits to the repo, and the site redeploys within a minute or two.

> Locally, `npm run dev` then http://localhost:5173/admin/index.html → **Work with Local Repository** (Chrome/Edge) edits your working copy directly, no token needed.

### Option 2: edit files directly

Everything lives in `content/`. The filename becomes the URL (`content/raving/outer-wilds.md` → `/raving/outer-wilds`).

**`content/ramblings/*.md`**
```yaml
---
title: On slow mornings        # required
date: 2026-09-02               # required
summary: One or two sentences   # shown on cards
tags: [life, habits]
cover: /uploads/my-photo.jpg   # any image in content/uploads
draft: false
---
The post, in Markdown. ![Alt text](/uploads/another.jpg "Optional caption")
```

**`content/raving/*.md`**: the same fields, plus:
```yaml
category: music        # music | video-games | movies | tv
subject: The thing being reviewed
creator: Who made it   # optional
year: 2025             # optional
rating: 9              # 1–10
```

**`content/portfolio/*.md`**: one file per timeline entry:
```yaml
---
title: Senior Developer
kind: job              # job | project | education | award
org: Company name
location: Remote
date: 2024-03-01       # start
endDate: 2025-01-31    # optional
ongoing: true          # shows "Present"
summary: Shown on the timeline card
link: https://…
image: /uploads/…
---
Details shown when the entry is expanded.
```

**`content/gallery/*.yml`**: one file per photo:
```yaml
image: /uploads/gallery/sunset.jpg
title: Golden hour over the ridge
caption: Optional
date: 2025-09-14       # optional; falls back to the camera's own date
tags: [landscape, sunset]
```

**`content/site.yml`**: your name, tagline, home-page intro, social links, and the portfolio PDF path.

If a file has a mistake (a rating of 11, a misspelled category, a missing image), the build stops and names the file and field. In dev it appears as an overlay in the browser.

### Photos

Upload **full-size originals** (JPG/PNG/WebP). At build time each image is:
- converted to WebP at up to four sizes (480–2400px)
- given a blurred placeholder
- read for EXIF (camera, lens, settings, date)

Visitors only ever download the size their screen needs. Unchanged photos are cached between builds.

Everything lives in the repo, which comfortably handles a few hundred photos. GitHub's soft limit is about 1 GB per repo. If the gallery ever outgrows that, the image step in `scripts/images.ts` is the one place to point at external storage instead.

### The portfolio PDF

The **PDF version** button serves `public/files/portfolio.pdf`. Replace it in `/admin` → Site settings → Portfolio PDF, or overwrite the file and push.

---

## Putting it on GitHub Pages (one-time)

1. Create an empty repo on GitHub. Name it **`<username>.github.io`** to serve the site at `https://<username>.github.io/`. Any other name serves it at `https://<username>.github.io/<repo>/`; the build picks the right base path automatically.
2. Push this folder to it.
3. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. `backend.repo` in `public/admin/config.yml` must name the repo. It's set to `MrShedford/MrShedford.github.io`; change it if the repo is ever renamed.

Every push to `main` then lints, tests, builds and deploys (`.github/workflows/deploy.yml`).

---

## How it fits together

```
content/            ← you edit this (Markdown, YAML, original images)
  │
  │  scripts/content.ts  (runs inside Vite: on dev start, on save, on build)
  │    validates frontmatter (src/content/schema.ts, zod)
  │    renders Markdown → HTML, resizes images → public/img
  ▼
public/data/*.json  ← generated, gitignored
  │
  │  TanStack Query (src/lib/queries.ts), prefetched on link hover
  ▼
React pages (src/routes), TanStack Router (src/router.tsx)
```

- **Theme**: colours are CSS custom properties in `src/styles/main.scss` (light and dark), with fonts and spacing in `src/styles/_variables.scss`. The palette is terracotta, deep red, sage, forest and ochre on cream or umber.
- **Raving categories / timeline kinds**: `src/content/taxonomy.ts` (the schema and UI follow from it), plus the matching `select` options in `public/admin/config.yml`. A new category also wants an accent colour in `src/styles/main.scss`.
- **GitHub Pages SPA routing**: the build copies `index.html` to `404.html`, so deep links and refreshes work.
