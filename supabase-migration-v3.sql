-- =====================================================================
-- Migration v3: ออมกัน (AomGun) — เพิ่มสถานะรายการ (pending/completed)
-- Additive only: เพิ่มคอลัมน์ใหม่ 1 คอลัมน์ในตาราง transactions ที่มีอยู่แล้ว
-- ไม่มีการลบ/แก้ไขข้อมูลเดิม รายการเก่าทั้งหมดจะกลายเป็น 'completed' อัตโนมัติ
-- =====================================================================

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed';

-- จำกัดค่าที่ยอมรับได้ให้ตรงกับ TypeScript (completed | pending)
ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_status_check CHECK (status IN ('completed', 'pending'));

-- =====================================================================
-- คำแนะนำในการ ROLLBACK (ย้อนกลับ migration นี้)
-- =====================================================================
-- ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
-- ALTER TABLE public.transactions DROP COLUMN IF EXISTS status;
-- =====================================================================
