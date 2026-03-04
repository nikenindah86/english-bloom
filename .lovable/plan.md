

## Fix: Index Page Still Showing Placeholder

The previous edit to `Index.tsx` was not applied — it still contains the "Welcome to Your Blank App" fallback. The file needs to be updated.

### Changes

**`src/pages/Index.tsx`** — Replace with a branded public landing page:
- Hero section with the app name ("English Teacher LMS" or similar), tagline, and decorative blush/lavender background blobs
- Two CTA buttons: "Sign In" → `/login`, "Create Account" → `/register`
- Themed with the existing feminine pastel design system (glassmorphism card, BookOpen icon, rounded corners)
- No auth logic needed since the user chose a public landing page

