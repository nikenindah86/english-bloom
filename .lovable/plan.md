

## Problem

The `public/_redirects` file exists and is correct, but the 404 still persists on your Netlify deployment. This can happen when Netlify doesn't pick up the `_redirects` file properly. The most reliable fix is to add a `netlify.toml` configuration file at the project root, which Netlify always reads.

## Plan

Create a **`netlify.toml`** file in the project root with SPA redirect rules. This takes precedence over `_redirects` and is the recommended approach for Vite + Netlify projects.

| File | Action |
|------|--------|
| `netlify.toml` | Create at project root with build settings and SPA redirect rule |

The file will contain:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

After this deploys, all routes like `/student`, `/admin/classes`, etc. will work correctly on refresh.

