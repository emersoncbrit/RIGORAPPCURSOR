import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import { supabase, createAuthClient, createUserClient } from "./supabase";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      accessToken?: string;
    }
  }
}

async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.userId = user.id;
    req.accessToken = token;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {

  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const authClient = createAuthClient();
      const { data, error } = await authClient.auth.signUp({ email, password });
      if (error) return res.status(400).json({ error: error.message });

      res.json({
        user: data.user ? { id: data.user.id, email: data.user.email } : null,
        session: data.session,
        confirmEmail: !data.session,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const authClient = createAuthClient();
      const { data, error } = await authClient.auth.signInWithPassword({ email, password });
      if (error) return res.status(400).json({ error: error.message });

      res.json({
        user: { id: data.user.id, email: data.user.email },
        session: data.session,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const authClient = createAuthClient();
      const { error } = await authClient.auth.resetPasswordForEmail(email);
      if (error) return res.status(400).json({ error: error.message });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/logout", async (_req: Request, res: Response) => {
    res.json({ success: true });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      res.json({ user: { id: user.id, email: user.email } });
    } catch (e: any) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    try {
      const { refresh_token } = req.body;
      const authClient = createAuthClient();
      const { data, error } = await authClient.auth.refreshSession({ refresh_token });
      if (error) return res.status(401).json({ error: error.message });

      res.json({
        user: data.user ? { id: data.user.id, email: data.user.email } : null,
        session: data.session,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/contract", authMiddleware, async (req: Request, res: Response) => {
    try {
      const db = createUserClient(req.accessToken!);
      const { data, error } = await db
        .from("contracts")
        .select("*")
        .eq("user_id", req.userId!)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const startDate = data.started_at ? String(data.started_at).split('T')[0] : data.started_at;
        res.json({
          contract: {
            id: data.id,
            rule: data.rule,
            deadline_hour: data.deadline_hour,
            deadline_minute: data.deadline_minute,
            duration: data.duration_days,
            start_date: startDate,
            signed: true,
          }
        });
      } else {
        res.json({ contract: null });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/contract", authMiddleware, async (req: Request, res: Response) => {
    try {
      const db = createUserClient(req.accessToken!);
      const { rule, deadline_hour, deadline_minute, duration, start_date } = req.body;
      const startDate = new Date(start_date + 'T00:00:00');
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + duration);
      const ends_at = endDate.toISOString().split('T')[0];

      const { data, error } = await db
        .from("contracts")
        .insert({
          user_id: req.userId!,
          rule,
          deadline_hour,
          deadline_minute,
          duration_days: duration,
          started_at: start_date,
          ends_at,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      const createdStartDate = data.started_at ? String(data.started_at).split('T')[0] : data.started_at;
      res.json({
        contract: {
          id: data.id,
          rule: data.rule,
          deadline_hour: data.deadline_hour,
          deadline_minute: data.deadline_minute,
          duration: data.duration_days,
          start_date: createdStartDate,
          signed: true,
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/records", authMiddleware, async (req: Request, res: Response) => {
    try {
      const db = createUserClient(req.accessToken!);
      const { data, error } = await db
        .from("day_records")
        .select("*")
        .eq("user_id", req.userId!)
        .order("date", { ascending: true });

      if (error) throw error;

      const records = (data || []).map((r: any) => ({
        id: r.id,
        contract_id: r.contract_id,
        date: r.date,
        completed: r.completed,
        failed: !r.completed,
        critical: false,
        justification: null,
      }));

      res.json({ records });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/records", authMiddleware, async (req: Request, res: Response) => {
    try {
      const db = createUserClient(req.accessToken!);
      const { contract_id, date, completed } = req.body;

      const { data: rpcResult, error: rpcError } = await db
        .rpc('mark_day_complete', { p_contract_id: contract_id });

      if (rpcError) throw rpcError;

      const today = date || new Date().toISOString().split('T')[0];
      res.json({
        record: {
          id: rpcResult?.record_id || Date.now().toString(),
          contract_id,
          date: today,
          completed: true,
          failed: false,
          critical: false,
          justification: null,
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/squads", authMiddleware, async (req: Request, res: Response) => {
    try {
      const db = createUserClient(req.accessToken!);
      const { data: memberships, error: memberError } = await db
        .from("squad_members")
        .select("squad_id")
        .eq("user_id", req.userId!);

      if (memberError) throw memberError;

      if (!memberships || memberships.length === 0) {
        return res.json({ squads: [] });
      }

      const squadIds = memberships.map((m: any) => m.squad_id);
      const { data: squads, error } = await db
        .from("squads")
        .select("*")
        .in("id", squadIds);

      if (error) throw error;
      res.json({ squads: squads || [] });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/squads", authMiddleware, async (req: Request, res: Response) => {
    try {
      const db = createUserClient(req.accessToken!);
      const { name, code } = req.body;
      const { data: squad, error } = await db
        .from("squads")
        .insert({ name, code, created_by: req.userId! })
        .select()
        .single();

      if (error) throw error;

      await db
        .from("squad_members")
        .insert({ squad_id: squad.id, user_id: req.userId! });

      res.json({ squad });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/squads/join", authMiddleware, async (req: Request, res: Response) => {
    try {
      const db = createUserClient(req.accessToken!);
      const { code } = req.body;
      const { data: squad, error: findError } = await db
        .from("squads")
        .select("*")
        .eq("code", code)
        .maybeSingle();

      if (findError) throw findError;
      if (!squad) {
        return res.status(404).json({ error: "Squad not found" });
      }

      const { data: existing } = await db
        .from("squad_members")
        .select("id")
        .eq("squad_id", squad.id)
        .eq("user_id", req.userId!)
        .maybeSingle();

      if (existing) {
        return res.status(400).json({ error: "Already a member" });
      }

      await db
        .from("squad_members")
        .insert({ squad_id: squad.id, user_id: req.userId! });

      res.json({ squad });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/squads/:squadId/members", authMiddleware, async (req: Request, res: Response) => {
    try {
      const db = createUserClient(req.accessToken!);
      const { squadId } = req.params;

      const { data: myMembership } = await db
        .from("squad_members")
        .select("id")
        .eq("squad_id", squadId)
        .eq("user_id", req.userId!)
        .maybeSingle();

      if (!myMembership) {
        return res.status(403).json({ error: "Not a member of this squad" });
      }

      const { data: members, error: membersError } = await db
        .from("squad_members")
        .select("user_id, joined_at")
        .eq("squad_id", squadId);

      if (membersError) throw membersError;

      const memberStats = await Promise.all(
        (members || []).map(async (m: any) => {
          let completedDays = 0;
          let failedDays = 0;
          let displayName = "Membro";

          try {
            const { data: records } = await db
              .from("day_records")
              .select("completed")
              .eq("user_id", m.user_id);

            if (records) {
              completedDays = records.filter((r: any) => r.completed).length;
              failedDays = records.filter((r: any) => !r.completed).length;
            }
          } catch {}

          if (m.user_id === req.userId) {
            try {
              const { data: { user } } = await supabase.auth.getUser(req.accessToken!);
              if (user?.email) {
                displayName = user.email.split("@")[0];
              }
            } catch {}
          }

          return {
            user_id: m.user_id,
            display_name: displayName,
            is_me: m.user_id === req.userId,
            completed_days: completedDays,
            failed_days: failedDays,
            joined_at: m.joined_at,
          };
        })
      );

      memberStats.sort((a, b) => b.completed_days - a.completed_days);

      res.json({ members: memberStats });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/squads/:squadId", authMiddleware, async (req: Request, res: Response) => {
    try {
      const db = createUserClient(req.accessToken!);
      const { squadId } = req.params;
      const { error } = await db
        .from("squad_members")
        .delete()
        .eq("squad_id", squadId)
        .eq("user_id", req.userId!);

      if (error) throw error;
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/reset", authMiddleware, async (req: Request, res: Response) => {
    try {
      const db = createUserClient(req.accessToken!);
      await db.from("day_records").delete().eq("user_id", req.userId!);
      await db.from("squad_members").delete().eq("user_id", req.userId!);
      await db.from("contracts").delete().eq("user_id", req.userId!);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
