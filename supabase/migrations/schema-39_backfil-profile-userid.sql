UPDATE public.profiles p
SET user_id = u.id
FROM auth.users u
WHERE p.user_id IS NULL AND p.id = u.id;
