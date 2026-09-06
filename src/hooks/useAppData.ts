"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Account,
  Budget,
  SavingGoal,
  Transaction,
  UserProfile,
} from "@/lib/types";
import * as db from "@/lib/services/database";

interface AppData {
  loading: boolean;
  transactions: Transaction[];
  accounts: Account[];
  budget: Budget | null;
  goals: SavingGoal[];
  profile: UserProfile | null;
  refresh: () => Promise<void>;
  addTransaction: (input: Omit<Transaction, "id" | "createdAt">) => Promise<void>;
  editTransaction: (id: string, patch: Partial<Transaction>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  saveBudget: (patch: Partial<Budget>) => Promise<void>;
  addGoal: (input: Omit<SavingGoal, "id">) => Promise<void>;
  editGoal: (id: string, patch: Partial<SavingGoal>) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  saveProfile: (patch: Partial<UserProfile>) => Promise<void>;
}

export function useAppData(): AppData {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [tx, acc, bud, gl, pf] = await Promise.all([
      db.listTransactions(),
      db.listAccounts(),
      db.getBudget(),
      db.listGoals(),
      db.getProfile(),
    ]);
    setTransactions(tx);
    setAccounts(acc);
    setBudget(bud);
    setGoals(gl);
    setProfile(pf);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addTransaction = useCallback(async (input: Omit<Transaction, "id" | "createdAt">) => {
    await db.createTransaction(input);
    await refresh();
  }, [refresh]);

  const editTransaction = useCallback(async (id: string, patch: Partial<Transaction>) => {
    await db.updateTransaction(id, patch);
    await refresh();
  }, [refresh]);

  const removeTransaction = useCallback(async (id: string) => {
    await db.deleteTransaction(id);
    await refresh();
  }, [refresh]);

  const saveBudget = useCallback(async (patch: Partial<Budget>) => {
    const next = await db.updateBudget(patch);
    setBudget(next);
  }, []);

  const addGoal = useCallback(async (input: Omit<SavingGoal, "id">) => {
    await db.createGoal(input);
    await refresh();
  }, [refresh]);

  const editGoal = useCallback(async (id: string, patch: Partial<SavingGoal>) => {
    await db.updateGoal(id, patch);
    await refresh();
  }, [refresh]);

  const removeGoal = useCallback(async (id: string) => {
    await db.deleteGoal(id);
    await refresh();
  }, [refresh]);

  const saveProfile = useCallback(async (patch: Partial<UserProfile>) => {
    const next = await db.updateProfile(patch);
    setProfile(next);
  }, []);

  return {
    loading,
    transactions,
    accounts,
    budget,
    goals,
    profile,
    refresh,
    addTransaction,
    editTransaction,
    removeTransaction,
    saveBudget,
    addGoal,
    editGoal,
    removeGoal,
    saveProfile,
  };
}
