
-- supabase/migrations/schema-36_fix-profiles-and-add-rls.sql

-- 1. Drop the existing public profile read access policy
DROP POLICY IF EXISTS "Allow public select on profiles" ON public.profiles;

-- 2. Drop the existing foreign key constraint on profiles table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_id_fkey' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
  END IF;
END;
$$;

-- 3. Add a user_id column to the profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id uuid;

-- 4. Update the user_id column with the id from the auth.users table
UPDATE public.profiles p SET user_id = u.id FROM auth.users u WHERE p.id = u.id;

-- 5. Add a foreign key constraint to the user_id column
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 6. Enable RLS on all relevant tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

-- 7. Add RLS policies for all relevant tables
CREATE POLICY "Allow users to view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to view their own user data" ON public.users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow users to view their own addresses" ON public.addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to insert their own addresses" ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to update their own addresses" ON public.addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow users to delete their own addresses" ON public.addresses FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to insert their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to view their own order items" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.orders
    WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Allow users to manage their own credentials" ON public.user_credentials FOR ALL USING (auth.uid() = user_id);

