

## Plan: Online Course LMS Feature

### Database Schema (Migration)

**Table: `courses`**
- id (uuid PK), title (text), description (text nullable), class_id (uuid nullable, references classes), is_published (boolean default false), created_at (timestamptz), updated_at (timestamptz)

**Table: `lessons`**
- id (uuid PK), course_id (uuid references courses ON DELETE CASCADE), title (text), content (text nullable — stores HTML from rich text editor), video_url (text nullable), order_index (integer default 0), created_at (timestamptz), updated_at (timestamptz)

**Table: `lesson_completions`**
- id (uuid PK), lesson_id (uuid references lessons ON DELETE CASCADE), student_id (uuid), completed_at (timestamptz default now()), UNIQUE(lesson_id, student_id)

**RLS Policies:**
- courses/lessons: Teachers full access (ALL); Students can SELECT where course is_published=true and student's class matches
- lesson_completions: Students can INSERT/SELECT own records; Teachers can SELECT all

**Storage:** Use existing `materials` bucket for lesson images/audio uploads.

### New Files

| File | Purpose |
|------|---------|
| `src/pages/AdminCourses.tsx` | Course list + create/edit course dialog. Each course card shows title, lesson count, publish toggle. Click opens lesson manager. |
| `src/pages/AdminCourseDetail.tsx` | Lesson list for a course (draggable order). "Add Lesson" opens lesson editor dialog with video URL input + rich text editor. |
| `src/components/admin/LessonEditor.tsx` | Dialog with: title input, video URL input, rich text editor (built with TipTap — `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`). Toolbar: H1/H2/H3, Bold, Italic, Bullet/Ordered List, Image upload (to materials bucket), Audio embed, Link. |
| `src/pages/StudentCourses.tsx` | Course list for student's class. Each card shows progress (completed/total lessons). |
| `src/pages/StudentCourseDetail.tsx` | Syllabus view — lesson list with completion checkmarks. |
| `src/pages/StudentLesson.tsx` | Lesson consumption page: responsive video embed (YouTube/Vimeo iframe or direct URL), rendered HTML content below, "Mark as Complete" button at bottom. |

### Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Add routes: `/admin/courses`, `/admin/courses/:id`, `/student/courses`, `/student/courses/:courseId`, `/student/courses/:courseId/lessons/:lessonId` |
| `src/components/admin/AdminLayout.tsx` | Add "Courses" to `academicItems` |
| `src/components/student/StudentLayout.tsx` | Add "Courses" to `navItems` |
| `src/components/MobileBottomNav.tsx` | Add "Courses" to both admin `adminMoreItems` and student nav |

### Rich Text Editor Approach

Use TipTap (headless, React-native) with extensions:
- `@tiptap/react`, `@tiptap/starter-kit` (headings, bold, italic, lists, etc.)
- `@tiptap/extension-image` — for inline images uploaded to storage bucket
- Custom audio node — renders a styled `<audio>` element for uploaded audio files

The toolbar will use the existing Button component with icon buttons matching the pastel aesthetic. Image/audio uploads go through the Supabase storage `materials` bucket.

### Video Embed Logic

Parse the video URL to determine type:
- YouTube URLs → extract video ID → render `<iframe>` with `youtube.com/embed/{id}`
- Vimeo URLs → extract ID → render `<iframe>` with `player.vimeo.com/video/{id}`
- Direct URLs → render `<video>` element

Wrap in `aspect-ratio` (16:9) container with rounded corners.

### Student Lesson Page Layout

```text
┌─────────────────────────────┐
│  ◀ Back to Course           │
│                             │
│  ┌───────────────────────┐  │
│  │   VIDEO PLAYER 16:9   │  │
│  └───────────────────────┘  │
│                             │
│  Lesson Title (H1)          │
│                             │
│  ── Rich Text Content ──    │
│  Paragraphs, images,        │
│  audio players, lists...    │
│                             │
│  ┌───────────────────────┐  │
│  │ ✓ Mark as Complete    │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### Dependencies to Install

- `@tiptap/react`
- `@tiptap/starter-kit`
- `@tiptap/extension-image`
- `@tiptap/extension-link`
- `@tiptap/pm`

### Summary

This adds a full Course → Lesson hierarchy with a TipTap-based rich text editor for teachers, responsive video embedding, and a clean student-facing lesson viewer with progress tracking. All styled consistently with the existing pastel/feminine aesthetic.

