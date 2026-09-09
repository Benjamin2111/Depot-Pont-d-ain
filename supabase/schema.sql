-- ============================================================
-- SCHEMA — Dépôt Pont-d'Ain — Gestion de stock
-- A coller entièrement dans Supabase > SQL Editor > New query > Run
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- 1. PROFILS UTILISATEURS (lié à auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  role text not null default 'ouvrier' check (role in ('ouvrier','responsable')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);

-- création des profils uniquement via le trigger ci-dessous (service role) : pas de policy insert publique
create policy "profiles_update_by_responsable" on public.profiles
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='responsable'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role='responsable'));

-- Fonction utilitaire : l'utilisateur courant est-il responsable ?
create or replace function public.is_responsable()
returns boolean
language sql stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'responsable');
$$;

-- Crée automatiquement un profil quand un compte est créé (via l'API admin de l'appli)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, role, active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name',''),
    coalesce(new.raw_user_meta_data->>'last_name',''),
    coalesce(new.raw_user_meta_data->>'role','ouvrier'),
    true
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. FAMILLES DE PRODUITS
-- ============================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null default '📦',
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories_select_all" on public.categories
  for select to authenticated using (true);

create policy "categories_write_responsable" on public.categories
  for all to authenticated
  using (public.is_responsable()) with check (public.is_responsable());

-- ============================================================
-- 3. CHANTIERS
-- ============================================================
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text default '',
  ref text default '',
  status text not null default 'actif' check (status in ('actif','termine')),
  created_at timestamptz not null default now()
);

alter table public.sites enable row level security;

create policy "sites_select_all" on public.sites
  for select to authenticated using (true);

create policy "sites_write_responsable" on public.sites
  for all to authenticated
  using (public.is_responsable()) with check (public.is_responsable());

-- ============================================================
-- 4. PRODUITS
-- ============================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  name text not null,
  category_id uuid references public.categories(id),
  unit text not null default 'pièce',
  stock numeric not null default 0,
  stock_min numeric not null default 0,
  stock_secu numeric not null default 0,
  stock_max numeric not null default 0,
  location text default '',
  photo_url text default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "products_select_all" on public.products
  for select to authenticated using (true);

create policy "products_write_responsable" on public.products
  for insert to authenticated with check (public.is_responsable());

create policy "products_update_responsable" on public.products
  for update to authenticated
  using (public.is_responsable()) with check (public.is_responsable());

-- ============================================================
-- 5. INVENTAIRES (sessions de comptage)
-- ============================================================
create table if not exists public.inventories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id),
  user_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.inventories enable row level security;

create policy "inventories_all_responsable" on public.inventories
  for all to authenticated
  using (public.is_responsable()) with check (public.is_responsable());

create table if not exists public.inventory_lines (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid references public.inventories(id) on delete cascade,
  product_id uuid references public.products(id),
  theoretical numeric not null,
  counted numeric not null,
  gap numeric not null,
  created_at timestamptz not null default now()
);

alter table public.inventory_lines enable row level security;

create policy "inventory_lines_all_responsable" on public.inventory_lines
  for all to authenticated
  using (public.is_responsable()) with check (public.is_responsable());

-- ============================================================
-- 6. MOUVEMENTS DE STOCK (historique + calcul automatique du stock)
-- ============================================================
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  user_id uuid references public.profiles(id),
  type text not null check (type in ('entree','sortie','correction','inventaire')),
  qty numeric not null,
  stock_before numeric,
  stock_after numeric,
  site_id uuid references public.sites(id),
  inventory_id uuid references public.inventories(id),
  note text default '',
  created_at timestamptz not null default now()
);

alter table public.stock_movements enable row level security;

-- Un ouvrier ne voit que ses propres mouvements ; un responsable voit tout
create policy "movements_select" on public.stock_movements
  for select to authenticated
  using (public.is_responsable() or user_id = auth.uid());

-- Tout utilisateur connecté peut tenter d'insérer un mouvement ;
-- le trigger ci-dessous vérifie le rôle et la quantité disponible.
create policy "movements_insert" on public.stock_movements
  for insert to authenticated with check (true);

-- Aucune modification ni suppression : historique inviolable
-- (aucune policy update/delete = interdit par défaut avec RLS)

-- ---- Fonction : applique le mouvement sur le produit, de façon sécurisée ----
create or replace function public.apply_stock_movement()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role text;
  v_current numeric;
begin
  select role into v_role from public.profiles where id = auth.uid();
  if v_role is null then
    raise exception 'Utilisateur inconnu ou inactif';
  end if;

  select stock into v_current from public.products where id = new.product_id for update;
  if v_current is null then
    raise exception 'Produit introuvable';
  end if;

  new.user_id := auth.uid();
  new.stock_before := v_current;

  if new.type = 'sortie' then
    if new.qty is null or new.qty <= 0 then
      raise exception 'Quantité invalide';
    end if;
    if new.qty > v_current then
      raise exception 'Stock insuffisant (disponible: %)', v_current;
    end if;
    new.stock_after := v_current - new.qty;

  elsif new.type = 'entree' then
    if v_role <> 'responsable' then
      raise exception 'Seul un responsable peut enregistrer une entrée de stock';
    end if;
    if new.qty is null or new.qty <= 0 then
      raise exception 'Quantité invalide';
    end if;
    new.stock_after := v_current + new.qty;

  elsif new.type in ('correction','inventaire') then
    if v_role <> 'responsable' then
      raise exception 'Seul un responsable peut corriger le stock';
    end if;
    -- pour une correction / un inventaire, "qty" transporte le NOUVEAU stock absolu
    new.stock_after := new.qty;
    new.qty := new.stock_after - v_current; -- on stocke ensuite l'écart réel pour l'historique

  else
    raise exception 'Type de mouvement inconnu';
  end if;

  update public.products set stock = new.stock_after where id = new.product_id;

  return new;
end;
$$;

drop trigger if exists trg_apply_stock_movement on public.stock_movements;
create trigger trg_apply_stock_movement
  before insert on public.stock_movements
  for each row execute function public.apply_stock_movement();

-- ============================================================
-- 7. TEMPS RÉEL — active la réplication pour la synchro live
-- ============================================================
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.stock_movements;
alter publication supabase_realtime add table public.sites;
alter publication supabase_realtime add table public.categories;

-- ============================================================
-- 8. DONNÉES DE DÉMONSTRATION
-- ============================================================
insert into public.categories (name, icon) values
  ('Vis / Fixation','🔩'),
  ('Maçonnerie','🧱'),
  ('Clôture','🚧'),
  ('Portail / Portillon','🚪'),
  ('Motorisation','⚙️'),
  ('Électricité','⚡'),
  ('Consommables','🧴'),
  ('Pergola / Carport','🏗️'),
  ('Outillage / Petit matériel','🔧'),
  ('Autre','📦')
on conflict do nothing;

insert into public.sites (name, address, ref, status) values
  ('Chantier Dupont', 'Pont-d''Ain', '2026-045', 'actif'),
  ('Chantier Martin', 'Pont-d''Ain', '2026-046', 'actif'),
  ('Chantier Bernard', 'Pont-d''Ain', '2026-041', 'termine')
on conflict do nothing;

insert into public.products (ref, name, category_id, unit, stock, stock_min, stock_secu, stock_max, location)
select 'VIS560','Vis 5x60', id, 'pièce', 850, 300, 500, 1500, 'Rack A2' from public.categories where name='Vis / Fixation'
union all
select 'CHEV8','Cheville Ø8', id, 'pièce', 400, 150, 250, 800, 'Rack B1' from public.categories where name='Maçonnerie'
union all
select 'BOMJ','Bombe de marquage jaune', id, 'pièce', 18, 5, 10, 40, 'Rack C3' from public.categories where name='Consommables'
union all
select 'DISQ125','Disque diamant béton 125', id, 'pièce', 6, 10, 15, 50, 'Rack C4' from public.categories where name='Consommables'
union all
select 'CABLE15','Câble électrique 1.5mm²', id, 'm', 60, 50, 80, 300, 'Rack D2' from public.categories where name='Électricité'
on conflict (ref) do nothing;

-- ============================================================
-- FIN — passez ensuite à la création du premier compte responsable
-- (voir README.md, étape "Créer le compte administrateur")
-- ============================================================
