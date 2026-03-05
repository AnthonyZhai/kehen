-- Migration: Change total_hours and remaining_hours to numeric to support decimal values (e.g. 0.5 hour)
ALTER TABLE students ALTER COLUMN total_hours TYPE numeric USING total_hours::numeric;
ALTER TABLE students ALTER COLUMN remaining_hours TYPE numeric USING remaining_hours::numeric;
