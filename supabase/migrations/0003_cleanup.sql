-- Cleanup function to purge anonymous / expired triage sessions older than 30 days
create or replace function public.cleanup_expired_triage_sessions()
returns integer language plpgsql security definer as $$
declare
  deleted_count integer;
begin
  delete from public.triage_sessions
  where user_id is null
    and created_at < now() - interval '30 days';
  
  get diagnostics deleted_count = row_count;
  return deleted_count;
end $$;
