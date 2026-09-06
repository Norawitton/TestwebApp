// Life services — Supabase CRUD for household_tasks, calendar_events, shopping_items

import { supabase } from "@/lib/supabase";
import { CalendarEvent, ShoppingItem, Task } from "@/lib/lifeTypes";

// ---------------- Helpers ----------------

async function getUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("ไม่ได้เข้าสู่ระบบ");
  return session.user.id;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------- Row mappers ----------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    done: row.done,
    priority: row.priority,
    dueDate: row.due_date ?? undefined,
    category: row.category ?? undefined,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToEvent(row: any): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    startAt: row.start_at,
    endAt: row.end_at ?? undefined,
    allDay: row.all_day,
    color: row.color ?? undefined,
    category: row.category ?? undefined,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToShoppingItem(row: any): ShoppingItem {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity ?? undefined,
    unit: row.unit ?? undefined,
    estimatedPrice: row.estimated_price ?? undefined,
    checked: row.checked,
    category: row.category ?? undefined,
    listName: row.list_name,
    createdAt: row.created_at,
  };
}

// ---------------- Tasks ----------------

export async function listTasks(): Promise<Task[]> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("household_tasks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToTask);
}

export async function createTask(
  input: Pick<Task, "title" | "description" | "priority" | "dueDate" | "category">,
): Promise<Task> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("household_tasks")
    .insert({
      id: uid("task"),
      user_id: userId,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority,
      due_date: input.dueDate ?? null,
      category: input.category ?? null,
      done: false,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToTask(data);
}

export async function updateTask(
  id: string,
  patch: Partial<Pick<Task, "title" | "description" | "priority" | "dueDate" | "category" | "done">>,
): Promise<Task | null> {
  const userId = await getUserId();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbPatch: Record<string, any> = {};
  if (patch.title !== undefined) dbPatch.title = patch.title;
  if (patch.description !== undefined) dbPatch.description = patch.description;
  if (patch.priority !== undefined) dbPatch.priority = patch.priority;
  if (patch.dueDate !== undefined) dbPatch.due_date = patch.dueDate;
  if (patch.category !== undefined) dbPatch.category = patch.category;
  if (patch.done !== undefined) dbPatch.done = patch.done;

  const { data, error } = await supabase
    .from("household_tasks")
    .update(dbPatch)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data ? rowToTask(data) : null;
}

export async function deleteTask(id: string): Promise<boolean> {
  const userId = await getUserId();
  const { error } = await supabase
    .from("household_tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
  return true;
}

export async function toggleTask(id: string, done: boolean): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase
    .from("household_tasks")
    .update({ done })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

// ---------------- Calendar Events ----------------

export async function listEvents(yearMonth?: string): Promise<CalendarEvent[]> {
  const userId = await getUserId();
  let query = supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId);
  if (yearMonth) {
    query = query.like("start_at", `${yearMonth}%`);
  }
  const { data, error } = await query.order("start_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToEvent);
}

export async function createEvent(
  input: Pick<CalendarEvent, "title" | "description" | "startAt" | "endAt" | "allDay" | "color" | "category">,
): Promise<CalendarEvent> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      id: uid("event"),
      user_id: userId,
      title: input.title,
      description: input.description ?? null,
      start_at: input.startAt,
      end_at: input.endAt ?? null,
      all_day: input.allDay,
      color: input.color ?? null,
      category: input.category ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToEvent(data);
}

export async function updateEvent(
  id: string,
  patch: Partial<Pick<CalendarEvent, "title" | "description" | "startAt" | "endAt" | "allDay" | "color" | "category">>,
): Promise<CalendarEvent | null> {
  const userId = await getUserId();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbPatch: Record<string, any> = {};
  if (patch.title !== undefined) dbPatch.title = patch.title;
  if (patch.description !== undefined) dbPatch.description = patch.description;
  if (patch.startAt !== undefined) dbPatch.start_at = patch.startAt;
  if (patch.endAt !== undefined) dbPatch.end_at = patch.endAt;
  if (patch.allDay !== undefined) dbPatch.all_day = patch.allDay;
  if (patch.color !== undefined) dbPatch.color = patch.color;
  if (patch.category !== undefined) dbPatch.category = patch.category;

  const { data, error } = await supabase
    .from("calendar_events")
    .update(dbPatch)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data ? rowToEvent(data) : null;
}

export async function deleteEvent(id: string): Promise<boolean> {
  const userId = await getUserId();
  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
  return true;
}

// ---------------- Shopping Items ----------------

export async function listShoppingItems(listName?: string): Promise<ShoppingItem[]> {
  const userId = await getUserId();
  let query = supabase
    .from("shopping_items")
    .select("*")
    .eq("user_id", userId);
  if (listName) {
    query = query.eq("list_name", listName);
  }
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToShoppingItem);
}

export async function createShoppingItem(
  input: Pick<ShoppingItem, "name" | "quantity" | "unit" | "estimatedPrice" | "category" | "listName">,
): Promise<ShoppingItem> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("shopping_items")
    .insert({
      id: uid("shop"),
      user_id: userId,
      name: input.name,
      quantity: input.quantity ?? null,
      unit: input.unit ?? null,
      estimated_price: input.estimatedPrice ?? null,
      category: input.category ?? null,
      list_name: input.listName,
      checked: false,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToShoppingItem(data);
}

export async function toggleShoppingItem(id: string, checked: boolean): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase
    .from("shopping_items")
    .update({ checked })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function deleteShoppingItem(id: string): Promise<boolean> {
  const userId = await getUserId();
  const { error } = await supabase
    .from("shopping_items")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
  return true;
}

export async function clearCheckedItems(listName?: string): Promise<void> {
  const userId = await getUserId();
  let query = supabase
    .from("shopping_items")
    .delete()
    .eq("user_id", userId)
    .eq("checked", true);
  if (listName) {
    query = query.eq("list_name", listName);
  }
  const { error } = await query;
  if (error) throw error;
}
