

## Phase 2: Teacher Admin Interface

### Database Changes
- **Storage bucket**: Create a `materials` storage bucket for file uploads with appropriate RLS (teachers can upload/delete, authenticated users can read).
- No schema changes needed -- existing tables cover all requirements.

### New Components

1. **`src/components/admin/AdminLayout.tsx`** -- Shared layout wrapper for all `/admin/*` routes with:
   - Sticky top header (logo, user email, sign-out)
   - Bottom navigation bar (Home, Students, Materials, Quizzes) using `lucide-react` icons
   - Active tab highlighting with the primary color
   - Content area with `pb-20` to clear the bottom nav

2. **`src/components/admin/AnnouncementSection.tsx`** -- Announcement CRUD on the dashboard:
   - List of announcements fetched from `announcements` table
   - Inline form (title + content) to create new announcements
   - Delete button on each announcement
   - Uses `@tanstack/react-query` for data fetching + mutations

3. **`src/pages/AdminStudents.tsx`** (`/admin/students`):
   - Fetches profiles with `user_roles` role = 'student'
   - Card/list view showing student name, email, join date
   - Dialog modal for viewing/editing student details (full_name, avatar_url)
   - Delete confirmation via AlertDialog

4. **`src/pages/AdminMaterials.tsx`** (`/admin/materials`):
   - CRUD interface for learning materials
   - Card grid showing material title, type badge (worksheet/tutorial), description
   - Dialog modal for creating/editing materials with title, description, type select, and file upload
   - File upload to the `materials` storage bucket
   - Delete with confirmation

5. **`src/pages/AdminDashboard.tsx`** -- Revamp existing page:
   - Live stats from DB (count of students, pending submissions, announcements, materials)
   - Embed `AnnouncementSection` for quick announcement management
   - Uses the new `AdminLayout` wrapper

### Routing Updates (`App.tsx`)
- Add routes: `/admin/students`, `/admin/materials`, `/admin/quizzes` (placeholder)
- All wrapped in `ProtectedRoute` with `requiredRole="teacher"`
- `/admin` renders the dashboard home

### Technical Approach
- All data operations via `supabase` client with `@tanstack/react-query`
- Feminine themed dialogs with rounded corners, glassmorphism cards
- Mobile-first: bottom nav, full-width cards, touch-friendly tap targets

