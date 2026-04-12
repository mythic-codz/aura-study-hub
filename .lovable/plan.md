

## Content & Learning Features -- Implementation Plan

This is a large scope (13 features). Based on your priority choice, we'll build **Content & Learning first** (features 1-4), then proceed to the remaining groups in follow-up rounds.

### Phase 1: Content & Learning (This Implementation)

---

### Feature 1: AI-Powered Quiz System

**How it works**: An edge function analyzes each lecture's PDF content (or video title/description) using Lovable AI to auto-generate quiz questions. Quizzes appear after completing a video/PDF.

**Database changes**:
- New `quizzes` table: `id`, `batch_id`, `content_type`, `content_index`, `questions` (JSONB -- array of `{question, options[], correct_answer, explanation}`), `created_at`
- New `quiz_attempts` table: `id`, `user_id`, `quiz_id`, `score`, `answers` (JSONB), `xp_earned`, `created_at`

**New edge function**: `generate-quiz`
- Accepts `{ batch_id, content_type, content_index, pdf_url?, title? }`
- Fetches the PDF content, sends it to Lovable AI with a prompt to generate 5 multiple-choice questions
- Uses tool calling for structured output (question, 4 options, correct answer, explanation)
- Stores generated quiz in the `quizzes` table
- Falls back to title-based questions if PDF fetch fails

**New components**:
- `QuizModal.tsx` -- Shows after content completion, displays questions one at a time with animated transitions
- `QuizResults.tsx` -- Score summary with XP earned (2 XP per correct answer, max 10 XP per quiz)

**New hook**: `useQuiz.ts` -- fetch/generate quiz, submit attempt

---

### Feature 2: Notes & Bookmarks

**Database changes**:
- New `notes` table: `id`, `user_id`, `batch_id`, `content_type`, `content_index`, `timestamp` (seconds for video, page for PDF), `text`, `created_at`

**UI changes**:
- Add a notes panel (slide-out drawer) on the `PlayPage`
- "Add Note" button on the video player that captures current timestamp
- Notes list sorted by timestamp, clicking a note seeks to that position
- Bookmark icon on each note for quick access

**New hook**: `useNotes.ts` -- CRUD operations for notes

---

### Feature 3: Study Streaks

**Database changes**:
- New `study_sessions` table: `id`, `user_id`, `date` (date only, unique per user+date), `minutes_studied`, `created_at`
- Add `current_streak` and `longest_streak` columns to `users` table

**Logic**:
- When a user watches a video or reads a PDF, record a session for today
- On each session check, calculate current streak (consecutive days)
- XP multiplier: 1x base, +10% per streak day (capped at 2x at 10-day streak)
- Show streak badge in header and profile page

**New components**:
- `StreakBadge.tsx` -- flame icon with streak count, shown in header
- Streak section on profile page with calendar visualization

**New hook**: `useStreak.ts`

---

### Feature 4: Content Search

**Implementation**: Client-side full-text search across batch names, video titles, and PDF titles (data is already loaded).

**UI changes**:
- Enhanced search bar on Index page (already exists but basic)
- Search results page/dropdown showing matched content grouped by batch
- Clicking a result navigates directly to the play page

**No database changes needed** -- searches the already-fetched batch data.

---

### Future Phases (not built now)

| Phase | Features |
|-------|----------|
| Phase 2: Gamification | Daily challenges, level system, achievement milestones |
| Phase 3: Social | Discussion forum, study groups, referral system |
| Phase 4: Admin | Admin dashboard, content analytics, push notifications |

These will be planned and built after Phase 1 is complete.

---

### Technical Summary

| Item | Type |
|------|------|
| New DB tables | `quizzes`, `quiz_attempts`, `notes`, `study_sessions` |
| Modified DB tables | `users` (add streak columns) |
| New edge functions | `generate-quiz` (uses Lovable AI) |
| New pages | None (modal-based quiz, drawer-based notes) |
| New components | `QuizModal`, `QuizResults`, `StreakBadge`, notes drawer |
| New hooks | `useQuiz`, `useNotes`, `useStreak` |
| Modified files | `PlayPage.tsx`, `Header.tsx`, `ProfilePage.tsx`, `Index.tsx`, `VideoPlayer.tsx` |

