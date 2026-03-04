

## Fix: Index Page Shows Blank Placeholder

The root route (`/`) renders the default "Welcome to Your Blank App" page. It should redirect based on auth state:

### Changes

**`src/pages/Index.tsx`** — Replace with a redirect component:
- If loading, show the themed spinner
- If authenticated, redirect to `/admin` or `/student` based on role
- If not authenticated, redirect to `/login`

This uses `useAuth()` from AuthContext and `Navigate` from react-router-dom. No other files need changes.

