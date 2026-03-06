

## Plan: Remove Role Selection from Registration

Single file change in `src/pages/Register.tsx`:

1. Remove the `role` state and hardcode it as `"student"` in the signup metadata
2. Remove the "I am a..." role selection UI (Student/Teacher buttons)
3. Remove the `GraduationCap` icon import (no longer needed)

This means all new registrations will automatically be student accounts. Teachers/admins are managed separately.

