
-- Drop existing tables (they don't match the new architecture)
DROP TABLE IF EXISTS page_history CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS ad_accounts CASCADE;
DROP TABLE IF EXISTS business_managers CASCADE;
DROP TABLE IF EXISTS managers CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'auxiliar');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_team_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT team_id FROM public.profiles WHERE id = _user_id
$$;

-- BMs table
CREATE TABLE public.bms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  bm_id_facebook text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bms ENABLE ROW LEVEL SECURITY;

-- Ad Accounts table
CREATE TABLE public.ad_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  bm_id uuid REFERENCES public.bms(id) ON DELETE SET NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;

-- Pages table (core)
CREATE TYPE public.page_status AS ENUM ('disponivel', 'em_uso', 'caiu', 'restrita');
CREATE TYPE public.account_status_type AS ENUM ('ativo', 'rejeitado', 'desativado', 'em_analise');

CREATE TABLE public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text,
  status page_status NOT NULL DEFAULT 'disponivel',
  origin_bm_id uuid REFERENCES public.bms(id) ON DELETE SET NULL,
  current_bm_id uuid REFERENCES public.bms(id) ON DELETE SET NULL,
  current_ad_account_id uuid REFERENCES public.ad_accounts(id) ON DELETE SET NULL,
  current_manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  account_status account_status_type,
  usage_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Facebook Profiles table
CREATE TYPE public.fb_profile_status AS ENUM ('ativo', 'analise', 'bloqueado');
CREATE TYPE public.bm_role AS ENUM ('administrador', 'anunciante');

CREATE TABLE public.facebook_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  email_login text,
  profile_link text,
  status fb_profile_status NOT NULL DEFAULT 'analise',
  role_in_bm bm_role DEFAULT 'anunciante',
  date_received date,
  date_blocked date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.facebook_profiles ENABLE ROW LEVEL SECURITY;

-- Pivot table for facebook_profiles <-> bms
CREATE TABLE public.profile_bm_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.facebook_profiles(id) ON DELETE CASCADE,
  bm_id uuid NOT NULL REFERENCES public.bms(id) ON DELETE CASCADE,
  UNIQUE(profile_id, bm_id)
);
ALTER TABLE public.profile_bm_links ENABLE ROW LEVEL SECURITY;

-- Activity logs table
CREATE TYPE public.entity_type AS ENUM ('page', 'profile', 'bm', 'ad_account');
CREATE TYPE public.action_type AS ENUM ('create', 'update', 'delete');

CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text,
  entity_type entity_type NOT NULL,
  entity_id uuid NOT NULL,
  action_type action_type NOT NULL,
  changes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Team isolation for all tables

-- Teams: users can see their own team
CREATE POLICY "Users see own team" ON public.teams FOR SELECT TO authenticated
  USING (id = public.get_user_team_id(auth.uid()));
CREATE POLICY "Admins manage teams" ON public.teams FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: users see team members
CREATE POLICY "Users see team profiles" ON public.profiles FOR SELECT TO authenticated
  USING (team_id = public.get_user_team_id(auth.uid()) OR id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "Admins manage profiles" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles: only admins + users see their own
CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Team-isolated tables (bms, ad_accounts, pages, facebook_profiles, profile_bm_links, activity_logs)
CREATE POLICY "Team isolation" ON public.bms FOR ALL TO authenticated
  USING (team_id = public.get_user_team_id(auth.uid()));

CREATE POLICY "Team isolation" ON public.ad_accounts FOR ALL TO authenticated
  USING (team_id = public.get_user_team_id(auth.uid()));

CREATE POLICY "Team isolation" ON public.pages FOR ALL TO authenticated
  USING (team_id = public.get_user_team_id(auth.uid()));

CREATE POLICY "Team isolation" ON public.facebook_profiles FOR ALL TO authenticated
  USING (team_id = public.get_user_team_id(auth.uid()));

CREATE POLICY "Team isolation" ON public.profile_bm_links FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.facebook_profiles fp
      WHERE fp.id = profile_id AND fp.team_id = public.get_user_team_id(auth.uid())
    )
  );

CREATE POLICY "Team isolation" ON public.activity_logs FOR ALL TO authenticated
  USING (team_id = public.get_user_team_id(auth.uid()));

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
