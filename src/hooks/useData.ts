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
          current_ad_account:ad_accounts!pages_current_ad_account_id_fkey(name),
          manager:profiles!pages_current_manager_id_fkey(name),
          page_tags(tag_id, tags(id, name, color))
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
      if (!user?.teamId) {
        throw new Error("Você precisa estar vinculado a um time para cadastrar páginas.");
      }
      const rows = pages.map((p) => ({
        ...p,
        team_id: user.teamId,
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
    mutationFn: async (bms: { name: string; bm_id_facebook?: string } | { name: string; bm_id_facebook?: string }[]) => {
      if (!user?.teamId) {
        throw new Error("Você precisa estar vinculado a um time para cadastrar BMs.");
      }
      const bmsArray = Array.isArray(bms) ? bms : [bms];
      const rows = bmsArray.map(bm => ({
        ...bm,
        team_id: user.teamId
      }));
      const { error } = await supabase.from("bms").insert(rows as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bms"] });
      qc.invalidateQueries({ queryKey: ["activity_logs"] });
    },
  });
};

export const useUpdateBm = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from("bms")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bms"] });
      qc.invalidateQueries({ queryKey: ["activity_logs"] });
    },
  });
};

export const useAdAccounts = () => {
  return useQuery({
    queryKey: ["ad_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_accounts")
        .select(`
          *,
          bm:bms(name),
          manager:profiles!ad_accounts_current_manager_id_fkey(name)
        `)
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
    mutationFn: async (accs: { name: string; bm_id?: string; status?: string } | { name: string; bm_id?: string; status?: string }[]) => {
      if (!user?.teamId) {
        throw new Error("Você precisa estar vinculado a um time para cadastrar contas de anúncios.");
      }
      const accsArray = Array.isArray(accs) ? accs : [accs];
      const rows = accsArray.map(acc => ({
        ...acc,
        team_id: user.teamId
      }));
      const { error } = await supabase.from("ad_accounts").insert(rows as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ad_accounts"] });
      qc.invalidateQueries({ queryKey: ["activity_logs"] });
    },
  });
};

export const useTeamMembers = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["team_members", user?.teamId],
    queryFn: async () => {
      if (!user?.teamId) return [];
      // Use explicit join with alias for clarity
      const { data, error } = await supabase
        .from("profiles")
        .select("*, roles:user_roles!user_roles_user_id_profiles_fkey(role)")
        .eq("team_id", user.teamId)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!user?.teamId,
  });
};

export const useAllUsers = () => {
  return useQuery({
    queryKey: ["all_users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, team:teams(name), roles:user_roles!user_roles_user_id_profiles_fkey(role)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
};

export const useTeams = () => {
  return useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
};

export const useAdminUpdateUserTeam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, teamId }: { userId: string; teamId: string | null }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ team_id: teamId })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all_users"] });
      qc.invalidateQueries({ queryKey: ["team_members"] });
    },
  });
};

export const useAdminDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc("admin_delete_user" as any, { _target_user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all_users"] });
      qc.invalidateQueries({ queryKey: ["team_members"] });
    },
  });
};

export const useRemoveMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc("remove_team_member" as any, { _target_user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team_members"] });
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
    mutationFn: async (items: {
      profile: Omit<FbProfile, "id" | "created_at" | "team_id" | "created_by">;
      bmLinks?: { bm_id: string; role_in_bm: string }[];
    } | {
      profile: Omit<FbProfile, "id" | "created_at" | "team_id" | "created_by">;
      bmLinks?: { bm_id: string; role_in_bm: string }[];
    }[]) => {
      const itemsArray = Array.isArray(items) ? items : [items];

      if (!user?.teamId) {
        throw new Error("Você precisa estar vinculado a um time para cadastrar perfis.");
      }

      for (const item of itemsArray) {
        const { data, error } = await supabase
          .from("facebook_profiles")
          .insert({
            ...item.profile,
            team_id: user.teamId,
            created_by: user.id,
          } as any)
          .select()
          .single();
        if (error) throw error;

        if (item.bmLinks && item.bmLinks.length > 0) {
          const { error: linkError } = await supabase.from("profile_bm_links").insert(
            item.bmLinks.map((link) => ({
              ...link,
              profile_id: data.id,
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

export const useBulkUpdateProfiles = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Partial<FbProfile> }) => {
      const { error } = await supabase
        .from("facebook_profiles")
        .update(updates as any)
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facebook_profiles"] });
      qc.invalidateQueries({ queryKey: ["activity_logs"] });
    },
  });
};

export const useDeleteProfiles = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("facebook_profiles").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["facebook_profiles"] });
      qc.invalidateQueries({ queryKey: ["activity_logs"] });
    },
  });
};

export const useBulkUpdateBms = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: any }) => {
      const { error } = await supabase
        .from("bms")
        .update(updates)
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bms"] });
      qc.invalidateQueries({ queryKey: ["activity_logs"] });
    },
  });
};

export const useDeleteBms = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("bms").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bms"] });
      qc.invalidateQueries({ queryKey: ["activity_logs"] });
    },
  });
};

export const useBulkUpdateAdAccounts = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: any }) => {
      const { error } = await supabase
        .from("ad_accounts")
        .update(updates)
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ad_accounts"] });
      qc.invalidateQueries({ queryKey: ["activity_logs"] });
    },
  });
};

export const useDeleteAdAccounts = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("ad_accounts").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ad_accounts"] });
      qc.invalidateQueries({ queryKey: ["activity_logs"] });
    },
  });
};
export const useLogActivity = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({
      entity_type,
      entity_id,
      action_type,
      changes,
    }: {
      entity_type: "profile" | "bm" | "ad_account" | "page";
      entity_id: string;
      action_type: "create" | "update" | "delete";
      changes: any;
    }) => {
      const { error } = await supabase.from("activity_logs").insert({
        entity_type,
        entity_id,
        action_type,
        changes,
        user_id: user?.id,
        team_id: user?.teamId,
        user_name: user?.name || "Sistema",
      } as any);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["activity_logs", variables.entity_type, variables.entity_id] });
    },
  });
};

export const useCreateGestor = () => {
  return useMutation({
    mutationFn: async ({ email, name }: { email: string; name: string }) => {
      const { error } = await supabase.rpc("create_gestor_user" as any, { email, name });
      if (error) throw error;
    }
  });
};

export const useCreateAuxiliar = () => {
  return useMutation({
    mutationFn: async ({ email, name }: { email: string; name: string }) => {
      const { error } = await supabase.rpc("create_auxiliar_user" as any, { email, name });
      if (error) throw error;
    }
  });
};

export const useCreateGestorTeam = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("create_gestor_team" as any);
      if (error) throw error;
    },
    onSuccess: () => {
      // Refresh user profile after team creation because teamId changes
      // Actually AuthProvider handles state, we might need to refresh page or profile
      window.location.reload();
    }
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    }
  });
};

// Tags hooks
export type Tag = {
  id: string;
  name: string;
  color: string;
  team_id: string;
  created_at: string;
  created_by: string | null;
};

export const useTags = () => {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Tag[];
    },
  });
};

export const useCreateTag = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (tag: { name: string; color?: string }) => {
      if (!user?.teamId) {
        throw new Error("Você precisa estar vinculado a um time.");
      }
      const { data, error } = await supabase
        .from("tags")
        .insert({
          name: tag.name,
          color: tag.color || "#6366f1",
          team_id: user.teamId,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
    },
  });
};

export const useUpdateTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Tag> }) => {
      const { error } = await supabase
        .from("tags")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
    },
  });
};

export const useDeleteTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tags")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      qc.invalidateQueries({ queryKey: ["pages"] });
    },
  });
};

export const useAddPageTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ pageId, tagId }: { pageId: string; tagId: string }) => {
      const { error } = await supabase
        .from("page_tags")
        .insert({ page_id: pageId, tag_id: tagId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pages"] });
    },
  });
};

export const useRemovePageTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ pageId, tagId }: { pageId: string; tagId: string }) => {
      const { error } = await supabase
        .from("page_tags")
        .delete()
        .eq("page_id", pageId)
        .eq("tag_id", tagId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pages"] });
    },
  });
};
