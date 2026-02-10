import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import { apiRequest, getApiUrl } from '@/lib/query-client';
import { useAuth } from '@/lib/auth-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetch } from 'expo/fetch';

export interface Contract {
  id: string;
  rule: string;
  deadline_hour: number;
  deadline_minute: number;
  duration: number;
  start_date: string;
  signed: boolean;
}

export interface DayRecord {
  id?: string;
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
  created_at: string;
}

interface RigorContextValue {
  contract: Contract | null;
  dayRecords: DayRecord[];
  squads: Squad[];
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
  resetProgress: () => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const AUTH_TOKEN_KEY = '@rigor_auth_token';

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
  const { user, isAuthenticated } = useAuth();
  const [contract, setContract] = useState<Contract | null>(null);
  const [dayRecords, setDayRecords] = useState<DayRecord[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadAllData();
    } else {
      setContract(null);
      setDayRecords([]);
      setSquads([]);
    }
  }, [isAuthenticated, user?.id]);

  const getAuthHeader = async (): Promise<Record<string, string>> => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token) return { Authorization: `Bearer ${token}` };
    } catch {}
    return {};
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const baseUrl = getApiUrl();
      const authHeaders = await getAuthHeader();

      const [contractRes, recordsRes, squadsRes] = await Promise.all([
        fetch(new URL('/api/contract', baseUrl).toString(), { headers: authHeaders }),
        fetch(new URL('/api/records', baseUrl).toString(), { headers: authHeaders }),
        fetch(new URL('/api/squads', baseUrl).toString(), { headers: authHeaders }),
      ]);

      if (contractRes.ok) {
        const contractData = await contractRes.json();
        setContract(contractData.contract || null);
      }

      if (recordsRes.ok) {
        const recordsData = await recordsRes.json();
        setDayRecords(recordsData.records || []);
      }

      if (squadsRes.ok) {
        const squadsData = await squadsRes.json();
        setSquads(squadsData.squads || []);
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = useCallback(async () => {
    if (isAuthenticated) await loadAllData();
  }, [isAuthenticated]);

  const signContract = useCallback(async (rule: string, deadlineHour: number, deadlineMinute: number, duration: number) => {
    if (!isAuthenticated) return;
    try {
      const res = await apiRequest('POST', '/api/contract', {
        rule,
        deadline_hour: deadlineHour,
        deadline_minute: deadlineMinute,
        duration,
        start_date: getDateStr(),
      });
      const data = await res.json();
      setContract(data.contract);
      setDayRecords([]);
    } catch (e) {
      console.error('Failed to sign contract:', e);
    }
  }, [isAuthenticated]);

  const markDone = useCallback(async () => {
    if (!isAuthenticated || !contract) return;
    const today = getDateStr();
    try {
      const res = await apiRequest('POST', '/api/records', {
        contract_id: contract.id,
        date: today,
        completed: true,
        failed: false,
        critical: false,
      });
      const data = await res.json();
      setDayRecords(prev => {
        const filtered = prev.filter(r => r.date !== today);
        return [...filtered, data.record];
      });
    } catch (e) {
      console.error('Failed to mark done:', e);
    }
  }, [isAuthenticated, contract]);

  const createSquad = useCallback(async (name: string) => {
    if (!isAuthenticated) return;
    try {
      const code = generateCode();
      const res = await apiRequest('POST', '/api/squads', { name, code });
      const data = await res.json();
      setSquads(prev => [...prev, data.squad]);
    } catch (e) {
      console.error('Failed to create squad:', e);
    }
  }, [isAuthenticated]);

  const joinSquad = useCallback(async (code: string): Promise<boolean> => {
    if (!isAuthenticated) return false;
    try {
      const res = await apiRequest('POST', '/api/squads/join', { code });
      const data = await res.json();
      setSquads(prev => [...prev, data.squad]);
      return true;
    } catch (e) {
      return false;
    }
  }, [isAuthenticated]);

  const leaveSquad = useCallback(async (id: string) => {
    if (!isAuthenticated) return;
    try {
      await apiRequest('DELETE', `/api/squads/${id}`);
      setSquads(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error('Failed to leave squad:', e);
    }
  }, [isAuthenticated]);

  const getDayNumber = useCallback((): number => {
    if (!contract) return 0;
    const today = getDateStr();
    return daysBetween(contract.start_date, today) + 1;
  }, [contract]);

  const getCompletedCount = useCallback((): number => {
    return dayRecords.filter(r => r.completed).length;
  }, [dayRecords]);

  const getFailedCount = useCallback((): number => {
    return dayRecords.filter(r => r.failed).length;
  }, [dayRecords]);

  const getCurrentStreak = useCallback((): number => {
    if (!contract) return 0;
    let streak = 0;
    const today = getDateStr();
    const sorted = [...dayRecords]
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
  }, [contract, dayRecords]);

  const getBestStreak = useCallback((): number => {
    if (!contract || dayRecords.length === 0) return 0;
    const sorted = [...dayRecords].sort((a, b) => a.date.localeCompare(b.date));
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
  }, [contract, dayRecords]);

  const getCompletionRate = useCallback((): number => {
    const total = dayRecords.length;
    if (total === 0) return 0;
    const completed = dayRecords.filter(r => r.completed).length;
    return Math.round((completed / total) * 100);
  }, [dayRecords]);

  const getDaysRemaining = useCallback((): number => {
    if (!contract) return 0;
    return Math.max(0, contract.duration - getDayNumber());
  }, [contract, getDayNumber]);

  const getCurrentDeadline = useCallback((): { hour: number; minute: number } => {
    if (!contract) return { hour: 23, minute: 0 };
    const streak = getCurrentStreak();
    const reductions = Math.floor(streak / 7);
    let totalMinutes = contract.deadline_hour * 60 + contract.deadline_minute;
    totalMinutes -= reductions * 30;
    if (totalMinutes < 0) totalMinutes = 0;
    return {
      hour: Math.floor(totalMinutes / 60),
      minute: totalMinutes % 60,
    };
  }, [contract, getCurrentStreak]);

  const isTodayCompleted = useCallback((): boolean => {
    const today = getDateStr();
    return dayRecords.some(r => r.date === today && r.completed);
  }, [dayRecords]);

  const isTodayFailed = useCallback((): boolean => {
    const today = getDateStr();
    return dayRecords.some(r => r.date === today && r.failed);
  }, [dayRecords]);

  const getTodayRecord = useCallback((): DayRecord | undefined => {
    const today = getDateStr();
    return dayRecords.find(r => r.date === today);
  }, [dayRecords]);

  const resetAll = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      await apiRequest('DELETE', '/api/reset');
      setContract(null);
      setDayRecords([]);
      setSquads([]);
    } catch (e) {
      console.error('Failed to reset:', e);
    }
  }, [isAuthenticated]);

  const resetProgress = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) return false;
    try {
      await apiRequest('DELETE', '/api/reset-progress');
      setContract(null);
      setDayRecords([]);
      return true;
    } catch (e) {
      console.error('Failed to reset progress:', e);
      return false;
    }
  }, [isAuthenticated]);

  const value = useMemo(() => ({
    contract,
    dayRecords,
    squads,
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
    resetProgress,
    refreshData,
  }), [contract, dayRecords, squads, isLoading, signContract, markDone, createSquad, joinSquad, leaveSquad, getDayNumber, getCompletedCount, getFailedCount, getCurrentStreak, getBestStreak, getCompletionRate, getDaysRemaining, getCurrentDeadline, isTodayCompleted, isTodayFailed, getTodayRecord, resetAll, resetProgress, refreshData]);

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
