CREATE TABLE renewal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  hours_added NUMERIC NOT NULL,
  previous_remaining NUMERIC NOT NULL,
  previous_total NUMERIC NOT NULL,
  renewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  notes TEXT
);
ALTER TABLE renewal_records ENABLE ROW LEVEL SECURITY;
