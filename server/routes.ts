import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { supabase } from "./supabase";

export async function registerRoutes(app: Express): Promise<Server> {

  app.get("/api/contract/:deviceId", async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.params;
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("device_id", deviceId)
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

  app.post("/api/contract", async (req: Request, res: Response) => {
    try {
      const { device_id, rule, deadline_hour, deadline_minute, duration, start_date } = req.body;
      const { data, error } = await supabase
        .from("contracts")
        .insert({
          device_id,
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

  app.get("/api/records/:deviceId", async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.params;
      const { data, error } = await supabase
        .from("day_records")
        .select("*")
        .eq("device_id", deviceId)
        .order("date", { ascending: true });

      if (error) throw error;
      res.json({ records: data || [] });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/records", async (req: Request, res: Response) => {
    try {
      const { device_id, contract_id, date, completed, failed, critical, justification } = req.body;

      const { data: existing } = await supabase
        .from("day_records")
        .select("id")
        .eq("device_id", device_id)
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
          .insert({ device_id, contract_id, date, completed, failed, critical, justification })
          .select()
          .single();
        if (error) throw error;
        res.json({ record: data });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/squads/:deviceId", async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.params;
      const { data: memberships, error: memberError } = await supabase
        .from("squad_members")
        .select("squad_id")
        .eq("device_id", deviceId);

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

  app.post("/api/squads", async (req: Request, res: Response) => {
    try {
      const { device_id, name, code } = req.body;
      const { data: squad, error } = await supabase
        .from("squads")
        .insert({ name, code, created_by: device_id })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from("squad_members")
        .insert({ squad_id: squad.id, device_id });

      res.json({ squad });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/squads/join", async (req: Request, res: Response) => {
    try {
      const { device_id, code } = req.body;
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
        .eq("device_id", device_id)
        .maybeSingle();

      if (existing) {
        return res.status(400).json({ error: "Already a member" });
      }

      await supabase
        .from("squad_members")
        .insert({ squad_id: squad.id, device_id });

      res.json({ squad });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/squads/:squadId/:deviceId", async (req: Request, res: Response) => {
    try {
      const { squadId, deviceId } = req.params;
      const { error } = await supabase
        .from("squad_members")
        .delete()
        .eq("squad_id", squadId)
        .eq("device_id", deviceId);

      if (error) throw error;
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/reset/:deviceId", async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.params;
      await supabase.from("day_records").delete().eq("device_id", deviceId);
      await supabase.from("squad_members").delete().eq("device_id", deviceId);
      await supabase.from("contracts").delete().eq("device_id", deviceId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
