-- 扩展 class_records.status 的 CHECK 约束，支持手动扣课时类型
-- 原有：CHECK (status IN ('pending', 'confirmed', 'disputed'))
-- 新增：'manual_deduct' 用于管理员手动扣课时场景（课程转换费用差价等）

ALTER TABLE class_records
  DROP CONSTRAINT IF EXISTS class_records_status_check;

ALTER TABLE class_records
  ADD CONSTRAINT class_records_status_check
  CHECK (status IN ('pending', 'confirmed', 'disputed', 'manual_deduct'));
