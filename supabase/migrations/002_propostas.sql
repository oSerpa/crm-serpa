-- Etapa 4: propostas e seus dados de contato.
-- Rode este arquivo inteiro no SQL Editor do Supabase (pode rodar mais de uma vez).

create table if not exists perfil (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  nome text,
  whatsapp text,
  email text,
  cidade text,
  chave_pix text,
  rodape text
);

create table if not exists propostas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  numero bigint generated always as identity,
  lead_id uuid not null references leads on delete cascade,
  servico_id uuid references servicos on delete set null,
  titulo text not null,
  itens jsonb not null default '[]'::jsonb,  -- [{ "descricao": "...", "valor": 100 }]
  desconto numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  prazo_dias int,
  validade date,
  condicoes text,
  status text not null check (status in ('rascunho','enviada','aceita','recusada')) default 'rascunho',
  aceita_em timestamptz,
  criado_em timestamptz not null default now()
);
create index if not exists propostas_lead on propostas(lead_id);

alter table perfil enable row level security;
alter table propostas enable row level security;
drop policy if exists dono on perfil;
create policy dono on perfil for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists dono on propostas;
create policy dono on propostas for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Projetos novos do Supabase não dão permissão automática em tabelas criadas pelo SQL Editor.
-- Sem isto aparece "42501 permission denied". O RLS acima continua limitando cada usuário aos próprios dados.
grant select, insert, update, delete on public.propostas, public.perfil to authenticated;
grant usage, select on all sequences in schema public to authenticated;
notify pgrst, 'reload schema';
