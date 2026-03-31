

## Plan: Update Index Landing Page with NICE Logo

The screenshot shows the Index page (`src/pages/Index.tsx`) still using the old BookOpen icon and "English Teacher LMS" branding. Update it to match the Login/Register pages.

### Changes to `src/pages/Index.tsx`
- Import `logo` from `@/assets/logo.png`
- Replace the `BookOpen` icon div with an `<img>` tag using the logo
- Update heading from "English Teacher LMS" to "NICE"
- Update subtitle to "Niken's Interactive Classroom for English"

