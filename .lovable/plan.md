

## Issue

The code already has all 5 nav items (Home, Materials, Quizzes, Grades, Profile) and the `/student/profile` route. The screenshot shows only 4 tabs — this is likely because:

1. The preview/deployment is stale and hasn't picked up the latest code, OR
2. The 5th tab is being pushed off-screen on narrow mobile viewports (each tab has `min-w-[56px]`, so 5 tabs = 280px minimum)

## Plan

To ensure the Profile tab is always visible, I will make a small tweak to `StudentLayout.tsx`:

1. **Reduce `min-w` on nav items** from `56px` to `48px` so all 5 tabs comfortably fit on narrow screens
2. **Reduce icon/text size slightly** for better fit on small devices

This is a single-file, single-line change to `src/components/student/StudentLayout.tsx`.

No database or routing changes needed — everything is already wired up correctly.

