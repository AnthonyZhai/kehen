-- Migration: Add class_id to students table
-- Purpose: Use unique class ID instead of class_name to associate students with classes,
--          solving the duplicate class name issue.

-- 1. Add the class_id column (nullable uuid)
ALTER TABLE students ADD COLUMN IF NOT EXISTS class_id uuid;

-- 2. Add foreign key constraint referencing classes.id
ALTER TABLE students
  ADD CONSTRAINT students_class_id_fkey
  FOREIGN KEY (class_id) REFERENCES classes(id)
  ON DELETE SET NULL;

-- 3. Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);

-- 4. Backfill: set class_id for existing students based on matching class_name
--    If multiple classes share the same name, this picks the first match (min id).
--    You may want to review and manually adjust after running.
UPDATE students s
SET class_id = (
  SELECT c.id
  FROM classes c
  WHERE c.name = s.class_name
  LIMIT 1
)
WHERE s.class_name IS NOT NULL
  AND s.class_id IS NULL;
