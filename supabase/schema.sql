-- CRM Serpa: rode este arquivo inteiro no SQL Editor do Supabase.
-- Cada linha pertence ao usuário logado (RLS), então só você vê seus dados.

create table if not exists servicos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  nome text not null,
  descricao text,
  preco numeric(10,2),
  mensagem_padrao text, -- texto pronto para WhatsApp/direct (usado na etapa 3)
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  nome text not null,
  tipo text check (tipo in ('mei','autonomo','empresa','loja','outro')) default 'outro',
  categoria text,           -- ex: barbearia, salão, loja de roupa
  telefone text,
  whatsapp text,
  email text,
  instagram text,
  facebook text,
  site text,
  cidade text,
  endereco text,
  origem text check (origem in ('maps','instagram','facebook','indicacao','outro')) default 'outro',
  status text not null check (status in ('novo','contatado','proposta','fechado','perdido')) default 'novo',
  servico_id uuid references servicos on delete set null,
  valor_estimado numeric(10,2),
  observacoes text,
  id_externo text,          -- id do lugar no Maps/OSM, evita importar duplicado (etapa 2)
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create unique index if not exists leads_id_externo_uniq on leads(user_id, id_externo) where id_externo is not null;

create table if not exists interacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  lead_id uuid not null references leads on delete cascade,
  canal text check (canal in ('whatsapp','instagram','facebook','ligacao','email','presencial','outro')) default 'whatsapp',
  descricao text not null,
  criado_em timestamptz not null default now()
);

create table if not exists lembretes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  lead_id uuid not null references leads on delete cascade,
  data date not null,
  descricao text not null,
  feito boolean not null default false,
  criado_em timestamptz not null default now()
);

create or replace function set_atualizado_em() returns trigger language plpgsql as $$
begin new.atualizado_em = now(); return new; end $$;
drop trigger if exists leads_atualizado on leads;
create trigger leads_atualizado before update on leads for each row execute function set_atualizado_em();

alter table servicos enable row level security;
alter table leads enable row level security;
alter table interacoes enable row level security;
alter table lembretes enable row level security;

do $$
declare t text;
begin
  foreach t in array array['servicos','leads','interacoes','lembretes'] loop
    execute format('drop policy if exists dono on %I', t);
    execute format('create policy dono on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;
