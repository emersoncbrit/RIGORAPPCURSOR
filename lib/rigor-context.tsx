import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Contract {
  id: string;
  rule: string;
  deadlineHour: number;
  deadlineMinute: number;
  duration: number;
  startDate: string;
  signed: boolean;
}

export interface DayRecord {
  date: string;
  completed: boolean;
  failed: boolean;
  critical: boolean;
  justification?: string;
}

export interface Squad {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

interface RigorState {
  contract: Contract | null;
  dayRecords: DayRecord[];
  squads: Squad[];
  lockedUntil: string | null;
}

interface RigorContextValue {
  contract: Contract | null;
  dayRecords: DayRecord[];
  squads: Squad[];
  lockedUntil: string | null;
  isLoading: boolean;
  signContract: (rule: string, deadlineHour: number, deadlineMinute: number, duration: number) => Promise<void>;
  markDone: () => Promise<void>;
  createSquad: (name: string) => Promise<void>;
  joinSquad: (code: string) => Promise<boolean>;
  leaveSquad: (id: string) => Promise<void>;
  getDayNumber: () => number;
  getCompletedCount: () => number;
  getFailedCount: () => number;
  getCurrentStreak: () => number;
  getBestStreak: () => number;
  getCompletionRate: () => number;
  getDaysRemaining: () => number;
  getCurrentDeadline: () => { hour: number; minute: number };
  isTodayCompleted: () => boolean;
  isTodayFailed: () => boolean;
  getTodayRecord: () => DayRecord | undefined;
  resetAll: () => Promise<void>;
}

const STORAGE_KEY = '@rigor_state';

const RigorContext = createContext<RigorContextValue | null>(null);

function generateCode(): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getDateStr(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  return Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

export function RigorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RigorState>({
    contract: null,
    dayRecords: [],
    squads: [],
    lockedUntil: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as RigorState;
        setState(parsed);
        checkForMissedDays(parsed);
      }
    } catch (e) {
      console.error('Failed to load state:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveState = async (newState: RigorState) => {
    setState(newState);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  };

  const checkForMissedDays = (currentState: RigorState) => {
    if (!currentState.contract) return;
    const today = getDateStr();
    const startDate = currentState.contract.startDate;
    const dayNum = daysBetween(startDate, today);
    const records = [...currentState.dayRecords];
    let changed = false;

    for (let i = 0; i < dayNum; i++) {
      const d = new Date(startDate + 'T00:00:00');
      d.setDate(d.getDate() + i);
      const dateStr = getDateStr(d);
      const existing = records.find(r => r.date === dateStr);
      if (!existing) {
        records.push({
          date: dateStr,
          completed: false,
          failed: true,
          critical: true,
        });
        changed = true;
      }
    }

    if (changed) {
      const newState = { ...currentState, dayRecords: records };
      saveState(newState);
    }
  };

  const signContract = useCallback(async (rule: string, deadlineHour: number, deadlineMinute: number, duration: number) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const contract: Contract = {
      id,
      rule,
      deadlineHour,
      deadlineMinute,
      duration,
      startDate: getDateStr(),
      signed: true,
    };
    const newState = { ...state, contract, dayRecords: [] };
    await saveState(newState);
  }, [state]);

  const markDone = useCallback(async () => {
    const today = getDateStr();
    const existing = state.dayRecords.find(r => r.date === today);
    if (existing && existing.completed) return;

    const records = state.dayRecords.filter(r => r.date !== today);
    records.push({
      date: today,
      completed: true,
      failed: false,
      critical: false,
    });
    const newState = { ...state, dayRecords: records };
    await saveState(newState);
  }, [state]);

  const createSquad = useCallback(async (name: string) => {
    const squad: Squad = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name,
      code: generateCode(),
      createdAt: getDateStr(),
    };
    const newState = { ...state, squads: [...state.squads, squad] };
    await saveState(newState);
  }, [state]);

  const joinSquad = useCallback(async (code: string): Promise<boolean> => {
    const existing = state.squads.find(s => s.code === code);
    if (existing) return false;
    const squad: Squad = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: 'Squad ' + code.substring(0, 4).toUpperCase(),
      code,
      createdAt: getDateStr(),
    };
    const newState = { ...state, squads: [...state.squads, squad] };
    await saveState(newState);
    return true;
  }, [state]);

  const leaveSquad = useCallback(async (id: string) => {
    const newState = { ...state, squads: state.squads.filter(s => s.id !== id) };
    await saveState(newState);
  }, [state]);

  const getDayNumber = useCallback((): number => {
    if (!state.contract) return 0;
    const today = getDateStr();
    return daysBetween(state.contract.startDate, today) + 1;
  }, [state.contract]);

  const getCompletedCount = useCallback((): number => {
    return state.dayRecords.filter(r => r.completed).length;
  }, [state.dayRecords]);

  const getFailedCount = useCallback((): number => {
    return state.dayRecords.filter(r => r.failed).length;
  }, [state.dayRecords]);

  const getCurrentStreak = useCallback((): number => {
    if (!state.contract) return 0;
    let streak = 0;
    const today = getDateStr();
    const sorted = [...state.dayRecords]
      .filter(r => r.completed)
      .sort((a, b) => b.date.localeCompare(a.date));

    for (const record of sorted) {
      const d = new Date(today + 'T00:00:00');
      d.setDate(d.getDate() - streak);
      if (getDateStr(d) === record.date) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [state.contract, state.dayRecords]);

  const getBestStreak = useCallback((): number => {
    if (!state.contract || state.dayRecords.length === 0) return 0;
    const sorted = [...state.dayRecords].sort((a, b) => a.date.localeCompare(b.date));
    let best = 0;
    let current = 0;

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].completed) {
        current++;
        if (current > best) best = current;
      } else {
        current = 0;
      }
    }
    return best;
  }, [state.contract, state.dayRecords]);

  const getCompletionRate = useCallback((): number => {
    const total = state.dayRecords.length;
    if (total === 0) return 0;
    const completed = state.dayRecords.filter(r => r.completed).length;
    return Math.round((completed / total) * 100);
  }, [state.dayRecords]);

  const getDaysRemaining = useCallback((): number => {
    if (!state.contract) return 0;
    return Math.max(0, state.contract.duration - getDayNumber());
  }, [state.contract, getDayNumber]);

  const getCurrentDeadline = useCallback((): { hour: number; minute: number } => {
    if (!state.contract) return { hour: 23, minute: 0 };
    const streak = getCurrentStreak();
    const reductions = Math.floor(streak / 7);
    let totalMinutes = state.contract.deadlineHour * 60 + state.contract.deadlineMinute;
    totalMinutes -= reductions * 30;
    if (totalMinutes < 0) totalMinutes = 0;
    return {
      hour: Math.floor(totalMinutes / 60),
      minute: totalMinutes % 60,
    };
  }, [state.contract, getCurrentStreak]);

  const isTodayCompleted = useCallback((): boolean => {
    const today = getDateStr();
    return state.dayRecords.some(r => r.date === today && r.completed);
  }, [state.dayRecords]);

  const isTodayFailed = useCallback((): boolean => {
    const today = getDateStr();
    return state.dayRecords.some(r => r.date === today && r.failed);
  }, [state.dayRecords]);

  const getTodayRecord = useCallback((): DayRecord | undefined => {
    const today = getDateStr();
    return state.dayRecords.find(r => r.date === today);
  }, [state.dayRecords]);

  const resetAll = useCallback(async () => {
    const newState: RigorState = {
      contract: null,
      dayRecords: [],
      squads: [],
      lockedUntil: null,
    };
    await saveState(newState);
  }, []);

  const value = useMemo(() => ({
    contract: state.contract,
    dayRecords: state.dayRecords,
    squads: state.squads,
    lockedUntil: state.lockedUntil,
    isLoading,
    signContract,
    markDone,
    createSquad,
    joinSquad,
    leaveSquad,
    getDayNumber,
    getCompletedCount,
    getFailedCount,
    getCurrentStreak,
    getBestStreak,
    getCompletionRate,
    getDaysRemaining,
    getCurrentDeadline,
    isTodayCompleted,
    isTodayFailed,
    getTodayRecord,
    resetAll,
  }), [state, isLoading, signContract, markDone, createSquad, joinSquad, leaveSquad, getDayNumber, getCompletedCount, getFailedCount, getCurrentStreak, getBestStreak, getCompletionRate, getDaysRemaining, getCurrentDeadline, isTodayCompleted, isTodayFailed, getTodayRecord, resetAll]);

  return (
    <RigorContext.Provider value={value}>
      {children}
    </RigorContext.Provider>
  );
}

export function useRigor() {
  const context = useContext(RigorContext);
  if (!context) {
    throw new Error('useRigor must be used within a RigorProvider');
  }
  return context;
}
