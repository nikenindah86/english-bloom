

## Phase 1: English Teacher LMS — Foundation

### 1. Design System & Theme
- Feminine, elegant color palette: blush pink (`hsl(340 80% 94%)`), soft lavender, warm cream backgrounds, rose-gold/deep plum accents
- Clean sans-serif typography, rounded corners, soft glassmorphism card shadows
- Mobile-first responsive layout throughout

### 2. Database Schema (Lovable Cloud)
Create the following tables with RLS:
- **profiles** — linked to auth.users, stores full_name, avatar_url
- **user_roles** — separate table for roles (teacher/student) with security definer function for role checks
- **announcements** — title, content, created_at
- **materials** — title, description, file_url, type (worksheet/tutorial)
- **quizzes** — title, description, is_active
- **quiz_submissions** — student_id, quiz_id, score, feedback, status

RLS policies: students see their own data, teachers see everything (via `has_role` security definer function).

### 3. Authentication Pages
- Beautiful **Login** page with email/password, matching the feminine pastel theme
- **Register** page with role selection (teacher or student)
- Password reset flow with forgot password + reset page

### 4. Role-Based Routing
- After login, detect user role and redirect:
  - **Teacher** → `/admin` (admin dashboard placeholder)
  - **Student** → `/student` (student dashboard placeholder)
- Protected routes that redirect unauthenticated users to login
- Simple placeholder dashboard pages for both roles with navigation shell

### 5. Pages Created
- `/login` — Login page
- `/register` — Registration page
- `/admin` — Teacher dashboard (placeholder with nav)
- `/student` — Student dashboard (placeholder with nav)
- `/reset-password` — Password reset page

