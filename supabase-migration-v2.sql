-- =====================================================================
-- Migration v2: ออมกัน (AomGun) — เพิ่มตารางส่วนตัว 3 ตาราง
-- Tasks, Calendar Events, Shopping Items
-- ไม่มีการแก้ไขตารางเดิม (additive only)
-- =====================================================================

-- ---------------------------------------------------------------------
-- ตาราง: household_tasks — ภารกิจ / งานที่ต้องทำ
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS household_tasks (
  id             text        PRIMARY KEY,
  user_id        uuid        REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title          text        NOT NULL,
  description    text,
  done           boolean     NOT NULL DEFAULT false,
  priority       text        NOT NULL DEFAULT 'normal',  -- 'low' | 'normal' | 'high'
  due_date       timestamptz,
  category       text        NOT NULL DEFAULT 'other',   -- 'chore' | 'errand' | 'finance' | 'health' | 'other'
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- เปิด Row Level Security
ALTER TABLE household_tasks ENABLE ROW LEVEL SECURITY;

-- ลบ policy เดิมก่อน (ถ้ามี) แล้วสร้างใหม่
DROP POLICY IF EXISTS "household_tasks_owner_all" ON household_tasks;
CREATE POLICY "household_tasks_owner_all"
  ON household_tasks
  FOR ALL
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- ตาราง: calendar_events — กิจกรรม / นัดหมายในปฏิทิน
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calendar_events (
  id             text        PRIMARY KEY,
  user_id        uuid        REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title          text        NOT NULL,
  description    text,
  start_at       timestamptz NOT NULL,
  end_at         timestamptz,
  all_day        boolean     NOT NULL DEFAULT false,
  color          text        NOT NULL DEFAULT '#1689F5',
  category       text        NOT NULL DEFAULT 'other',   -- 'bill' | 'appointment' | 'reminder' | 'personal' | 'other'
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- เปิด Row Level Security
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- ลบ policy เดิมก่อน (ถ้ามี) แล้วสร้างใหม่
DROP POLICY IF EXISTS "calendar_events_owner_all" ON calendar_events;
CREATE POLICY "calendar_events_owner_all"
  ON calendar_events
  FOR ALL
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- ตาราง: shopping_items — รายการสิ่งของที่ต้องซื้อ
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shopping_items (
  id               text        PRIMARY KEY,
  user_id          uuid        REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name             text        NOT NULL,
  quantity         text        NOT NULL DEFAULT '1',
  unit             text,
  estimated_price  numeric,
  checked          boolean     NOT NULL DEFAULT false,
  category         text        NOT NULL DEFAULT 'other',   -- 'food' | 'household' | 'personal' | 'health' | 'other'
  list_name        text        NOT NULL DEFAULT 'ทั่วไป',
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- เปิด Row Level Security
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- ลบ policy เดิมก่อน (ถ้ามี) แล้วสร้างใหม่
DROP POLICY IF EXISTS "shopping_items_owner_all" ON shopping_items;
CREATE POLICY "shopping_items_owner_all"
  ON shopping_items
  FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================================
-- คำแนะนำในการ ROLLBACK (ย้อนกลับ migration นี้)
-- =====================================================================
-- หากต้องการลบการเปลี่ยนแปลงทั้งหมดของ migration นี้ ให้รันคำสั่งต่อไปนี้:
--
-- DROP POLICY IF EXISTS "shopping_items_owner_all"  ON shopping_items;
-- DROP POLICY IF EXISTS "calendar_events_owner_all" ON calendar_events;
-- DROP POLICY IF EXISTS "household_tasks_owner_all" ON household_tasks;
--
-- DROP TABLE IF EXISTS shopping_items;
-- DROP TABLE IF EXISTS calendar_events;
-- DROP TABLE IF EXISTS household_tasks;
--
-- หมายเหตุ: คำสั่ง DROP TABLE จะลบข้อมูลทั้งหมดในตารางอย่างถาวร
-- ควรสำรองข้อมูลก่อนดำเนินการ rollback เสมอ
-- =====================================================================
