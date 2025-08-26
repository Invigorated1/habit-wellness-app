-- Add indexes for performance optimization

-- Index for finding habits by user and active status (common query pattern)
CREATE INDEX IF NOT EXISTS "habits_userId_isActive_idx" ON "habits"("userId", "isActive");

-- Index for sorting habits by creation date
CREATE INDEX IF NOT EXISTS "habits_createdAt_idx" ON "habits"("createdAt" DESC);

-- Index for sorting habits by streak
CREATE INDEX IF NOT EXISTS "habits_streak_idx" ON "habits"("streak" DESC);

-- Index for finding habits by last completion
CREATE INDEX IF NOT EXISTS "habits_lastCompletedAt_idx" ON "habits"("lastCompletedAt" DESC);

-- Index for finding habit entries by date range
CREATE INDEX IF NOT EXISTS "habit_entries_date_idx" ON "habit_entries"("date" DESC);

-- Index for finding habit entries by habit and date range (common query)
CREATE INDEX IF NOT EXISTS "habit_entries_habitId_date_idx" ON "habit_entries"("habitId", "date" DESC);

-- Index for finding cron jobs by name and status
CREATE INDEX IF NOT EXISTS "cron_jobs_name_status_idx" ON "cron_jobs"("name", "status");

-- Index for finding recent cron jobs
CREATE INDEX IF NOT EXISTS "cron_jobs_createdAt_idx" ON "cron_jobs"("createdAt" DESC);