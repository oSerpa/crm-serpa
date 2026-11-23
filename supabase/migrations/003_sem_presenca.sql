-- Fila "Completar contatos": marca leads que não têm presença online em lugar nenhum.
-- Rode no SQL Editor do Supabase (pode rodar mais de uma vez).
alter table leads add column if not exists sem_presenca boolean not null default false;
notify pgrst, 'reload schema';
