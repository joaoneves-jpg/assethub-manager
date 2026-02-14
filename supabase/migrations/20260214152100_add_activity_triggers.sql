-- Trigger para registrar alterações em páginas
CREATE OR REPLACE FUNCTION public.log_page_changes()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _user_name text;
  _changes jsonb;
BEGIN
  -- Get user name
  SELECT name INTO _user_name FROM public.profiles WHERE id = auth.uid();

  -- Build changes object
  IF TG_OP = 'INSERT' THEN
    _changes = jsonb_build_object(
      'name', NEW.name,
      'status', NEW.status,
      'origin_bm_id', NEW.origin_bm_id,
      'current_bm_id', NEW.current_bm_id,
      'current_ad_account_id', NEW.current_ad_account_id,
      'current_manager_id', NEW.current_manager_id,
      'usage_date', NEW.usage_date
    );
    
    INSERT INTO public.activity_logs (
      team_id, user_id, user_name, entity_type, entity_id, action_type, changes
    ) VALUES (
      NEW.team_id, auth.uid(), _user_name, 'page', NEW.id, 'create', _changes
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    _changes = jsonb_build_object();
    
    IF OLD.name IS DISTINCT FROM NEW.name THEN
      _changes = _changes || jsonb_build_object('name', jsonb_build_object('old', OLD.name, 'new', NEW.name));
    END IF;
    
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      _changes = _changes || jsonb_build_object('status', jsonb_build_object('old', OLD.status, 'new', NEW.status));
    END IF;
    
    IF OLD.current_bm_id IS DISTINCT FROM NEW.current_bm_id THEN
      _changes = _changes || jsonb_build_object('current_bm_id', jsonb_build_object('old', OLD.current_bm_id, 'new', NEW.current_bm_id));
    END IF;
    
    IF OLD.current_ad_account_id IS DISTINCT FROM NEW.current_ad_account_id THEN
      _changes = _changes || jsonb_build_object('current_ad_account_id', jsonb_build_object('old', OLD.current_ad_account_id, 'new', NEW.current_ad_account_id));
    END IF;
    
    IF OLD.current_manager_id IS DISTINCT FROM NEW.current_manager_id THEN
      _changes = _changes || jsonb_build_object('current_manager_id', jsonb_build_object('old', OLD.current_manager_id, 'new', NEW.current_manager_id));
    END IF;
    
    IF OLD.usage_date IS DISTINCT FROM NEW.usage_date THEN
      _changes = _changes || jsonb_build_object('usage_date', jsonb_build_object('old', OLD.usage_date, 'new', NEW.usage_date));
    END IF;
    
    IF OLD.account_status IS DISTINCT FROM NEW.account_status THEN
      _changes = _changes || jsonb_build_object('account_status', jsonb_build_object('old', OLD.account_status, 'new', NEW.account_status));
    END IF;
    
    -- Only log if there are actual changes
    IF _changes != '{}'::jsonb THEN
      INSERT INTO public.activity_logs (
        team_id, user_id, user_name, entity_type, entity_id, action_type, changes
      ) VALUES (
        NEW.team_id, auth.uid(), _user_name, 'page', NEW.id, 'update', _changes
      );
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    _changes = jsonb_build_object(
      'name', OLD.name,
      'status', OLD.status
    );
    
    INSERT INTO public.activity_logs (
      team_id, user_id, user_name, entity_type, entity_id, action_type, changes
    ) VALUES (
      OLD.team_id, auth.uid(), _user_name, 'page', OLD.id, 'delete', _changes
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger para registrar alterações em perfis do Facebook
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _user_name text;
  _changes jsonb;
BEGIN
  -- Get user name
  SELECT name INTO _user_name FROM public.profiles WHERE id = auth.uid();

  -- Build changes object
  IF TG_OP = 'INSERT' THEN
    _changes = jsonb_build_object(
      'name', NEW.name,
      'email_login', NEW.email_login,
      'status', NEW.status,
      'role_in_bm', NEW.role_in_bm,
      'date_received', NEW.date_received
    );
    
    INSERT INTO public.activity_logs (
      team_id, user_id, user_name, entity_type, entity_id, action_type, changes
    ) VALUES (
      NEW.team_id, auth.uid(), _user_name, 'profile', NEW.id, 'create', _changes
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    _changes = jsonb_build_object();
    
    IF OLD.name IS DISTINCT FROM NEW.name THEN
      _changes = _changes || jsonb_build_object('name', jsonb_build_object('old', OLD.name, 'new', NEW.name));
    END IF;
    
    IF OLD.email_login IS DISTINCT FROM NEW.email_login THEN
      _changes = _changes || jsonb_build_object('email_login', jsonb_build_object('old', OLD.email_login, 'new', NEW.email_login));
    END IF;
    
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      _changes = _changes || jsonb_build_object('status', jsonb_build_object('old', OLD.status, 'new', NEW.status));
    END IF;
    
    IF OLD.role_in_bm IS DISTINCT FROM NEW.role_in_bm THEN
      _changes = _changes || jsonb_build_object('role_in_bm', jsonb_build_object('old', OLD.role_in_bm, 'new', NEW.role_in_bm));
    END IF;
    
    IF OLD.date_received IS DISTINCT FROM NEW.date_received THEN
      _changes = _changes || jsonb_build_object('date_received', jsonb_build_object('old', OLD.date_received, 'new', NEW.date_received));
    END IF;
    
    IF OLD.date_blocked IS DISTINCT FROM NEW.date_blocked THEN
      _changes = _changes || jsonb_build_object('date_blocked', jsonb_build_object('old', OLD.date_blocked, 'new', NEW.date_blocked));
    END IF;
    
    -- Only log if there are actual changes
    IF _changes != '{}'::jsonb THEN
      INSERT INTO public.activity_logs (
        team_id, user_id, user_name, entity_type, entity_id, action_type, changes
      ) VALUES (
        NEW.team_id, auth.uid(), _user_name, 'profile', NEW.id, 'update', _changes
      );
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    _changes = jsonb_build_object(
      'name', OLD.name,
      'status', OLD.status
    );
    
    INSERT INTO public.activity_logs (
      team_id, user_id, user_name, entity_type, entity_id, action_type, changes
    ) VALUES (
      OLD.team_id, auth.uid(), _user_name, 'profile', OLD.id, 'delete', _changes
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_page_change ON public.pages;
DROP TRIGGER IF EXISTS on_profile_change ON public.facebook_profiles;

-- Create triggers
CREATE TRIGGER on_page_change
  AFTER INSERT OR UPDATE OR DELETE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.log_page_changes();

CREATE TRIGGER on_profile_change
  AFTER INSERT OR UPDATE OR DELETE ON public.facebook_profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_profile_changes();
