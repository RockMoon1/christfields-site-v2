-- 013_reflect_one_per_day.sql
-- One gratitude entry and one examen per member per day.
--
-- saveGratitude and saveExamen are written as "check for a row, then insert or
-- update". Without a constraint, two quick submits (a double tap, a retry on a
-- slow connection) can both find nothing and both insert, leaving two rows for
-- the same day. The reader uses .maybeSingle(), which then errors, so the
-- member's own entry stops loading for that day.
--
-- SAFE TO RUN ANYTIME, but it will fail if duplicates already exist. The two
-- cleanup statements below remove any duplicate rows first, keeping the
-- newest entry for each day, so the whole file can be run top to bottom.

-- Keep only the most recent row per (member, day).
delete from gratitude_entries a
  using gratitude_entries b
 where a.clerk_user_id = b.clerk_user_id
   and a.entry_date    = b.entry_date
   and a.ctid          < b.ctid;

delete from reflections a
  using reflections b
 where a.clerk_user_id = b.clerk_user_id
   and a.entry_date    = b.entry_date
   and a.ctid          < b.ctid;

-- The constraint the code has always assumed.
create unique index if not exists gratitude_entries_user_day_idx
  on gratitude_entries (clerk_user_id, entry_date);

create unique index if not exists reflections_user_day_idx
  on reflections (clerk_user_id, entry_date);
