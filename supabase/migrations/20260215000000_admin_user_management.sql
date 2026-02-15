
-- Function to delete a user from auth.users (requires security definer)
CREATE OR REPLACE FUNCTION public.admin_delete_user(_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem excluir usuários.';
  END IF;

  -- Delete from auth.users (cascades to profiles and other tables)
  DELETE FROM auth.users WHERE id = _target_user_id;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
