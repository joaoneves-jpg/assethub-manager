import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Page = {
  id: string;
  name: string;
  url: string | null;
  status: string;
  origin_bm_id: string | null;
  current_bm_id: string | null;
  current_ad_account_id: string | null;
  current_manager_id: string | null;
  account_status: string | null;
  usage_date: string | null;
  created_at: string;
  team_id: string;
  origin_bm?: { name: string } | null;
  current_bm?: { name: string } | null;
  current_ad_account?: { name: string } | null;
  manager?: { name: string } | null;
};

export const usePages = () => {
  return useQuery({
    queryKey: ["pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select(`
          *,
          origin_bm:bms!pages_origin_bm_id_fkey(name),
          current_bm:bms!pages_current_bm_id_fkey(name),
          current_ad_account:ad_accounts!pages_current_ad_account_id_fkey(name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Page[];
    },
  });
};

export const useCreatePage = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (pages: { name: string; url?: string; origin_bm_id?: string; status?: string }[]) => {
      const rows = pages.map((p) => ({
        ...p,
        team_id: user!.teamId!,
      }));
      const { error } = await supabase.from("pages").insert(rows as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pages"] }),
  });
};

export const useBulkUpdatePages = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Record<string, any> }) => {
      const { error } = await supabase
        .from("pages")
        .update(updates)
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pages"] }),
  });
};

export const useDeletePages = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("pages").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pages"] }),
  });
};

export const useBms = () => {
  return useQuery({
    queryKey: ["bms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bms").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateBm = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (bm: { name: string; bm_id_facebook?: string }) => {
      const { error } = await supabase.from("bms").insert({ ...bm, team_id: user!.teamId! } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bms"] }),
  });
};

export const useAdAccounts = () => {
  return useQuery({
    queryKey: ["ad_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_accounts")
        .select("*, bm:bms(name)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateAdAccount = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (acc: { name: string; bm_id?: string }) => {
      const { error } = await supabase.from("ad_accounts").insert({ ...acc, team_id: user!.teamId! } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ad_accounts"] }),
  });
};

export const useTeamMembers = () => {
  return useQuery({
    queryKey: ["team_members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
};

export type FbProfile = {
  id: string;
  name: string;
  email_login: string | null;
  profile_link: string | null;
  status: string;
  role_in_bm: string | null;
  date_received: string | null;
  date_blocked: string | null;
  created_at: string;
  team_id: string;
};

export const useFbProfiles = () => {
  return useQuery({
    queryKey: ["facebook_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facebook_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FbProfile[];
    },
  });
};

export const useCreateFbProfile = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (profile: Omit<FbProfile, "id" | "created_at" | "team_id">) => {
      const { error } = await supabase.from("facebook_profiles").insert({ ...profile, team_id: user!.teamId! } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["facebook_profiles"] }),
  });
};

export const useActivityLogs = (entityType?: string, entityId?: string) => {
  return useQuery({
    queryKey: ["activity_logs", entityType, entityId],
    queryFn: async () => {
      let query = supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(50);
      if (entityType) query = query.eq("entity_type", entityType as any);
      if (entityId) query = query.eq("entity_id", entityId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!entityType || !entityId,
  });
};
