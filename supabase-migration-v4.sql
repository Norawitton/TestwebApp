-- =====================================================================
-- Migration v4: ออมกัน (AomGun) — เพิ่มวันสรุปยอด/วันครบกำหนดชำระบัตรเครดิต
-- Additive only: เพิ่มคอลัมน์ใหม่ 2 คอลัมน์ในตาราง accounts ที่มีอยู่แล้ว
-- (nullable — มีผลเฉพาะบัญชีประเภท credit_card) ไม่มีการลบ/แก้ไขข้อมูลเดิม
-- บัญชีเก่าทั้งหมด (รวมบัตรเครดิตที่เพิ่มไว้ก่อนหน้านี้) จะมีค่าเป็น NULL
-- จนกว่าจะแก้ไขบัญชีเพื่อระบุวันสรุปยอด/วันครบกำหนดชำระ
-- =====================================================================

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS statement_day smallint,
  ADD COLUMN IF NOT EXISTS due_day smallint;

-- จำกัดค่าให้เป็นวันที่ของเดือนจริง (1-31) เท่านั้น ถ้ามีการระบุ
ALTER TABLE public.accounts
  DROP CONSTRAINT IF EXISTS accounts_statement_day_check;
ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_statement_day_check
  CHECK (statement_day IS NULL OR statement_day BETWEEN 1 AND 31);

ALTER TABLE public.accounts
  DROP CONSTRAINT IF EXISTS accounts_due_day_check;
ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_due_day_check
  CHECK (due_day IS NULL OR due_day BETWEEN 1 AND 31);

-- =====================================================================
-- คำแนะนำในการ ROLLBACK (ย้อนกลับ migration นี้)
-- =====================================================================
-- ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS accounts_statement_day_check;
-- ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS accounts_due_day_check;
-- ALTER TABLE public.accounts DROP COLUMN IF EXISTS statement_day;
-- ALTER TABLE public.accounts DROP COLUMN IF EXISTS due_day;
-- =====================================================================
