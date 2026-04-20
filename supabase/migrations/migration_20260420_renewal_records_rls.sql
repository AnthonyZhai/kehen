-- Migration: Create renewal_records table and add RLS policies

-- 建表
CREATE TABLE IF NOT EXISTS renewal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  hours_added NUMERIC NOT NULL,
  previous_remaining NUMERIC NOT NULL,
  previous_total NUMERIC NOT NULL,
  renewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  notes TEXT
);

-- 开启行级安全
ALTER TABLE renewal_records ENABLE ROW LEVEL SECURITY;

-- Boss 可以插入续费记录
CREATE POLICY "boss_can_insert_renewal"
  ON renewal_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'boss'
    )
  );

-- Boss 可以查看所有续费记录
CREATE POLICY "boss_can_select_renewal"
  ON renewal_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'boss'
    )
  );

-- 家长可以查看自己孩子的续费记录
CREATE POLICY "parent_can_select_own_renewal"
  ON renewal_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_id AND s.parent_id = auth.uid()
    )
  );
