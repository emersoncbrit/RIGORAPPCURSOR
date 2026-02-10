import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import { supabase, createAuthClient } from "./supabase";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
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
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("device_id", req.userId!)
        .eq("signed", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      res.json({ contract: data });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/contract", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { rule, deadline_hour, deadline_minute, duration, start_date } = req.body;
      const { data, error } = await supabase
        .from("contracts")
        .insert({
          device_id: req.userId!,
          rule,
          deadline_hour,
          deadline_minute,
          duration,
          start_date,
          signed: true,
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ contract: data });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/records", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from("day_records")
        .select("*")
        .eq("device_id", req.userId!)
        .order("date", { ascending: true });

      if (error) throw error;
      res.json({ records: data || [] });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/records", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { contract_id, date, completed, failed, critical, justification } = req.body;

      const { data: existing } = await supabase
        .from("day_records")
        .select("id")
        .eq("device_id", req.userId!)
        .eq("date", date)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("day_records")
          .update({ completed, failed, critical, justification })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        res.json({ record: data });
      } else {
        const { data, error } = await supabase
          .from("day_records")
          .insert({ device_id: req.userId!, contract_id, date, completed, failed, critical, justification })
          .select()
          .single();
        if (error) throw error;
        res.json({ record: data });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/squads", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { data: memberships, error: memberError } = await supabase
        .from("squad_members")
        .select("squad_id")
        .eq("device_id", req.userId!);

      if (memberError) throw memberError;

      if (!memberships || memberships.length === 0) {
        return res.json({ squads: [] });
      }

      const squadIds = memberships.map((m: any) => m.squad_id);
      const { data: squads, error } = await supabase
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
      const { name, code } = req.body;
      const { data: squad, error } = await supabase
        .from("squads")
        .insert({ name, code, created_by: req.userId! })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from("squad_members")
        .insert({ squad_id: squad.id, device_id: req.userId! });

      res.json({ squad });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/squads/join", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      const { data: squad, error: findError } = await supabase
        .from("squads")
        .select("*")
        .eq("code", code)
        .maybeSingle();

      if (findError) throw findError;
      if (!squad) {
        return res.status(404).json({ error: "Squad not found" });
      }

      const { data: existing } = await supabase
        .from("squad_members")
        .select("id")
        .eq("squad_id", squad.id)
        .eq("device_id", req.userId!)
        .maybeSingle();

      if (existing) {
        return res.status(400).json({ error: "Already a member" });
      }

      await supabase
        .from("squad_members")
        .insert({ squad_id: squad.id, device_id: req.userId! });

      res.json({ squad });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/squads/:squadId", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { squadId } = req.params;
      const { error } = await supabase
        .from("squad_members")
        .delete()
        .eq("squad_id", squadId)
        .eq("device_id", req.userId!);

      if (error) throw error;
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/reset", authMiddleware, async (req: Request, res: Response) => {
    try {
      await supabase.from("day_records").delete().eq("device_id", req.userId!);
      await supabase.from("squad_members").delete().eq("device_id", req.userId!);
      await supabase.from("contracts").delete().eq("device_id", req.userId!);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
