

## Plan: Add NICE Branding + Logo + Favicon

### Changes

**1. Copy uploaded image to project**
- Copy `user-uploads://favicon.png` to `public/favicon.png` (for favicon)
- Copy `user-uploads://favicon.png` to `src/assets/logo.png` (for React components)

**2. `index.html`** — Update title to "NICE - Niken's Interactive Classroom for English", add favicon link, update meta tags

**3. `src/pages/Login.tsx`** — Replace BookOpen icon with the logo image, change heading to "NICE" with subtitle "Niken's Interactive Classroom for English"

**4. `src/pages/Register.tsx`** — Same branding update as Login page

**5. `src/components/admin/AdminLayout.tsx`** — Replace BookOpen icon in sidebar header and mobile header with the logo image. Update label from "Teacher Panel" to "NICE"

| File | Change |
|------|--------|
| `public/favicon.png` | Copy uploaded image |
| `src/assets/logo.png` | Copy uploaded image |
| `index.html` | Title + favicon + meta |
| `src/pages/Login.tsx` | Logo image + app name |
| `src/pages/Register.tsx` | Logo image + app name |
| `src/components/admin/AdminLayout.tsx` | Logo in sidebar + header |

