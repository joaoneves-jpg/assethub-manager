import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Page = {
  id: string;
  name: string;
  fb_page_id: string | null;
  url: string | null;
  status: string;
  origin_bm_id: string | null;
  current_bm_id: string | null;
  current_ad_account_id: string | null;
  current_manager_id: string | null;
  current_fb_profile_id: string | null;
  account_status: string | null;
  usage_date: string | null;
  created_at: string;
  team_id: string;
  origin_bm?: { name: string } | null;
  current_bm?: { name: string } | null;
  current_ad_account?: { name: string } | null;
  manager?: { name: string } | null;
  fb_profile?: { name: string } | null;
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
          current_ad_account:ad_accounts!pages_current_ad_account_id_fkey(name),
          manager:profiles!pages_current_manager_id_fkey(name),
          fb_profile:facebook_profiles!pages_current_fb_profile_id_fkey(name)
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

export const useUpdatePage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase
        .from("pages")
        .update(updates)
        .eq("id", id);
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
      const { data, error } = await supabase
        .from("bms")
        .select(`
          *,
          ad_accounts(id, name),
          pages_origin:pages!pages_origin_bm_id_fkey(id, name),
          pages_current:pages!pages_current_bm_id_fkey(id, name)
        `)
        .order("name");
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

export const useUpdateAdAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from("ad_accounts")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ad_accounts"] }),
  });
};

export const useCreateAdAccount = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (acc: { name: string; bm_id?: string; status?: string }) => {
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
  date_received: string | null;
  date_blocked: string | null;
  created_at: string;
  team_id: string;
  created_by: string | null;
  creator?: { name: string } | null;
};

export type FbProfileBmLink = {
  id: string;
  profile_id: string;
  bm_id: string;
  status: string | null;
  role_in_bm: string | null;
  bm?: { name: string } | null;
};

export const useFbProfiles = () => {
  return useQuery({
    queryKey: ["facebook_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facebook_profiles")
        .select("*, creator:profiles!facebook_profiles_created_by_fkey(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as FbProfile[];
    },
  });
};

export const useCreateFbProfile = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      profile,
      bmLinks,
    }: {
      profile: Omit<FbProfile, "id" | "created_at" | "team_id" | "created_by">;
      bmLinks?: { bm_id: string; role_in_bm: string }[];
    }) => {
      const { data, error } = await supabase
        .from("facebook_profiles")
        .insert({
          ...profile,
          team_id: user!.teamId!,
          created_by: user!.id,
        } as any)
        .select()
        .single();
      if (error) throw error;

      if (bmLinks && bmLinks.length > 0) {
        const { error: linkError } = await supabase.from("profile_bm_links").insert(
          bmLinks.map((link) => ({
            ...link,
            profile_id: data.id,
            status: "ativo", // Maintain default status in DB
          }))
        );
        if (linkError) throw linkError;
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facebook_profiles"] });
      qc.invalidateQueries({ queryKey: ["activity_logs"] });
    },
  });
};

export const useUpdateFbProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
      bmLinks,
    }: {
      id: string;
      updates: Partial<FbProfile>;
      bmLinks?: { bm_id: string; role_in_bm: string }[];
    }) => {
      const { error } = await supabase
        .from("facebook_profiles")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;

      if (bmLinks !== undefined) {
        // Simple approach: delete all and re-insert
        await supabase.from("profile_bm_links").delete().eq("profile_id", id);
        if (bmLinks.length > 0) {
          const { error: linkError } = await supabase.from("profile_bm_links").insert(
            bmLinks.map((link) => ({
              ...link,
              profile_id: id,
              status: "ativo",
            }))
          );
          if (linkError) throw linkError;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facebook_profiles"] });
      qc.invalidateQueries({ queryKey: ["activity_logs"] });
    },
  });
};

export const useFbProfileLinks = (profileId: string) => {
  return useQuery({
    queryKey: ["facebook_profile_links", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_bm_links")
        .select("*, bm:bms(name)")
        .eq("profile_id", profileId);
      if (error) throw error;
      return data as unknown as FbProfileBmLink[];
    },
    enabled: !!profileId,
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

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (updates: { name?: string; email?: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team_members"] });
    },
  });
};
