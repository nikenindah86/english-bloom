

## Plan: Move Announcements to Sidebar + Comprehensive Dashboard

### 1. Move Announcements to Its Own Page

**New file: `src/pages/AdminAnnouncements.tsx`**
- Move the existing `AnnouncementSection` component into a dedicated full page wrapped in `AdminLayout`
- Simple page with heading + the existing `AnnouncementSection` component

**`AdminLayout.tsx`**: Add "Announcements" (Megaphone icon) to the `mainItems` array (under Main, alongside Dashboard).

**`AdminDashboard.tsx`**: Remove `<AnnouncementSection />` from the dashboard.

**`App.tsx`**: Add route `/admin/announcements` with teacher protection.

**`MobileBottomNav.tsx`**: Add Announcements to mobile admin grid if not already there.

**Mobile icon grid in dashboard**: Add Announcements icon to the grid.

### 2. Comprehensive Dashboard

Replace the current 4-stat grid + announcement section with a richer overview:

**Expanded Stats Grid (2x3 or 2x4)**:
- Students (existing)
- Pending Quiz Submissions (existing)
- Announcements count (existing)
- Materials count (existing)
- **New**: Assignments count (from `assignments` table)
- **New**: Courses count (from `courses` table)
- **New**: Classes count (from `classes` table)
- **New**: Quizzes count (from `quizzes` table)

**Recent Activity Section**: Show the latest 5 items across key tables:
- Recent quiz submissions (student name, quiz title, status, date)
- Recent assignment submissions
- Upcoming scheduled quizzes/assignments (those with `scheduled_at` in the future)

**Quick Actions Row**: Clickable cards for common tasks like "Create Quiz", "Add Material", "Post Announcement" that navigate to the respective pages.

### Files Summary

| File | Action |
|------|--------|
| `src/pages/AdminAnnouncements.tsx` | New — full page for announcements |
| `src/pages/AdminDashboard.tsx` | Remove AnnouncementSection, add more stats + recent activity + quick actions |
| `src/components/admin/AdminLayout.tsx` | Add "Announcements" to mainItems |
| `src/components/MobileBottomNav.tsx` | Add Announcements to admin items |
| `src/App.tsx` | Add `/admin/announcements` route |

