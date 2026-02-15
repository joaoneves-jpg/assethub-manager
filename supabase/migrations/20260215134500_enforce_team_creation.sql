-- Migration to enforce team membership for asset creation and ensure persistence
-- Date: 2026-02-15

-- 1. Ensure all asset tables have a CHECK constraint or policy that prevents insertion without a team
-- Table: bms
DROP POLICY IF EXISTS "Team isolation" ON public.bms;
CREATE POLICY "Team isolation" ON public.bms FOR ALL TO authenticated
  USING (team_id = public.get_user_team_id(auth.uid()))
  WITH CHECK (
    team_id = public.get_user_team_id(auth.uid()) AND 
    team_id IS NOT NULL
  );

-- Table: ad_accounts
DROP POLICY IF EXISTS "Team isolation" ON public.ad_accounts;
CREATE POLICY "Team isolation" ON public.ad_accounts FOR ALL TO authenticated
  USING (team_id = public.get_user_team_id(auth.uid()))
  WITH CHECK (
    team_id = public.get_user_team_id(auth.uid()) AND 
    team_id IS NOT NULL
  );

-- Table: pages
DROP POLICY IF EXISTS "Team isolation" ON public.pages;
CREATE POLICY "Team isolation" ON public.pages FOR ALL TO authenticated
  USING (team_id = public.get_user_team_id(auth.uid()))
  WITH CHECK (
    team_id = public.get_user_team_id(auth.uid()) AND 
    team_id IS NOT NULL
  );

-- Table: facebook_profiles
DROP POLICY IF EXISTS "Team isolation" ON public.facebook_profiles;
CREATE POLICY "Team isolation" ON public.facebook_profiles FOR ALL TO authenticated
  USING (team_id = public.get_user_team_id(auth.uid()))
  WITH CHECK (
    team_id = public.get_user_team_id(auth.uid()) AND 
    team_id IS NOT NULL
  );

-- Note: The function public.get_user_team_id returns the user's current team.
-- If they are removed from the team, get_user_team_id will return NULL.
-- Existing assets will remain in the tables with their original team_id.
-- However, the user who left the team will no longer have access to them due to the USING clause.
-- This effectively "keeps the assets in the account (team)" while removing individual access.
