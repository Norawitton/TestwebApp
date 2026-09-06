// lifeTypes.ts — Task, CalendarEvent, ShoppingItem interfaces for ออมกัน

export type TaskCategory = "chore" | "errand" | "finance" | "health" | "other";
export type TaskPriority = "low" | "normal" | "high";

export interface Task {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  priority: TaskPriority;
  dueDate?: string;   // ISO 8601
  category: TaskCategory;
  createdAt: string;
}

export type EventCategory = "bill" | "appointment" | "reminder" | "personal" | "other";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startAt: string;    // ISO 8601
  endAt?: string;
  allDay: boolean;
  color: string;
  category: EventCategory;
  createdAt: string;
}

export type ShoppingCategory = "food" | "household" | "personal" | "health" | "other";

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  unit?: string;
  estimatedPrice?: number;
  checked: boolean;
  category: ShoppingCategory;
  listName: string;
  createdAt: string;
}
