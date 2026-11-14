-- Migration: 002_inquiry_numbering_and_form_settings.sql
-- Description: 
--   1. Re-sequences all existing inquiries oldest-first to 1, 2, 3...
--   2. Creates atomic PostgreSQL sequence 'inquiry_number_seq' for consecutive, non-repeating serial numbers.
--   3. Adds custom_fields JSONB column to inquiries.
--   4. Seeds initial inquiry_form_settings into app_settings.

-- 1. Add custom_fields column to inquiries if not exists
ALTER TABLE inquiries 
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb NOT NULL;

-- 2. Safely re-sequence existing inquiries based on creation date (oldest first, starting at 1)
-- Temporary drop of unique constraint if needed, or update via CTE
DO $$
DECLARE
  rec RECORD;
  idx INTEGER := 1;
BEGIN
  -- First assign negative numbers to avoid any unique constraint collision during renumbering
  FOR rec IN (SELECT id FROM inquiries ORDER BY created_at ASC, id ASC) LOOP
    UPDATE inquiries SET inquiry_number = -idx WHERE id = rec.id;
    idx := idx + 1;
  END LOOP;

  -- Then assign permanent positive sequential numbers 1, 2, 3...
  idx := 1;
  FOR rec IN (SELECT id FROM inquiries ORDER BY -inquiry_number ASC, created_at ASC, id ASC) LOOP
    UPDATE inquiries SET inquiry_number = idx WHERE id = rec.id;
    idx := idx + 1;
  END LOOP;
END $$;

-- 3. Create or update PostgreSQL sequence for new inquiries
CREATE SEQUENCE IF NOT EXISTS inquiry_number_seq;

-- Synchronize sequence with current maximum inquiry number
SELECT setval(
  'inquiry_number_seq',
  COALESCE((SELECT MAX(inquiry_number) FROM inquiries WHERE inquiry_number > 0), 0)
);

-- 4. Seed initial default inquiry form settings into app_settings
INSERT INTO app_settings (id, setting_key, setting_value, updated_at)
VALUES (
  'set-inquiry-form',
  'inquiryFormSettings',
  '{"labInstructions":[{"id":"inst-1","name":"White Metal","enabled":true},{"id":"inst-2","name":"Ceramic","enabled":true},{"id":"inst-3","name":"Zircon","enabled":true},{"id":"inst-4","name":"Valplast","enabled":true},{"id":"inst-5","name":"R.P.D.C.","enabled":true},{"id":"inst-6","name":"Half Ceramic","enabled":true},{"id":"inst-7","name":"Japanese Gold","enabled":true}],"trialOptions":[{"id":"trial-1","name":"Metal Trial","enabled":true},{"id":"trial-2","name":"Bisque Trial","enabled":true},{"id":"trial-3","name":"Final","enabled":true}],"toothShades":[{"id":"shade-1","name":"A1","enabled":true},{"id":"shade-2","name":"A2","enabled":true},{"id":"shade-3","name":"A3","enabled":true},{"id":"shade-4","name":"A3.5","enabled":true},{"id":"shade-5","name":"B1","enabled":true},{"id":"shade-6","name":"B2","enabled":true},{"id":"shade-7","name":"C1","enabled":true},{"id":"shade-8","name":"C2","enabled":true},{"id":"shade-9","name":"D2","enabled":true},{"id":"shade-10","name":"Bleach","enabled":true}],"allowOtherLabInstruction":true,"allowOtherTrialOption":true,"allowOtherShade":true,"customFields":[]}',
  CURRENT_TIMESTAMP
)
ON CONFLICT (setting_key) DO NOTHING;
