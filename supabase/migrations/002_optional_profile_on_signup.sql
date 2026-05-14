-- Make handle_new_user skip profile insert when no nickname is provided.
-- Email sign-up users choose their username after confirming their email
-- (the existing nickname_setup modal flow handles this).
-- Google OAuth users who already supply a nickname continue to work unchanged.
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  if new.raw_user_meta_data->>'nickname' is not null then
    insert into public.profiles (id, nickname)
    values (new.id, new.raw_user_meta_data->>'nickname');
  end if;
  return new;
end;
$$;
