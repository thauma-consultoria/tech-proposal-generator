-- ── SCHEMA: Proposta Generator ──────────────────────────────────────────
-- Base compartilhada: qualquer usuário autenticado vê e edita tudo.
-- created_by / updated_by existem para rastreabilidade (quem mexeu).
-- ────────────────────────────────────────────────────────────────────────

-- Tabela principal
create table public.proposals (
  id            uuid primary key default gen_random_uuid(),
  created_by    uuid not null references auth.users(id) on delete restrict,
  updated_by    uuid not null references auth.users(id) on delete restrict,
  numero        text not null,
  revisao       text,
  cliente       text not null,
  assunto       text not null,
  data_proposta text not null,
  payload       jsonb not null,
  parent_id     uuid references public.proposals(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_proposals_parent     on public.proposals(parent_id);
create index idx_proposals_created_at on public.proposals(created_at desc);
create index idx_proposals_cliente    on public.proposals(cliente);

-- Trigger para manter updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_proposals_updated
before update on public.proposals
for each row execute function public.set_updated_at();

-- Imagens do escopo (usado na Fase 2)
create table public.proposal_images (
  id             uuid primary key default gen_random_uuid(),
  proposal_id    uuid not null references public.proposals(id) on delete cascade,
  scope_item_id  text not null,
  storage_path   text not null,
  fonte          text,
  descricao      text,
  sort_order     int  not null default 0,
  created_at     timestamptz not null default now()
);

create index idx_images_proposal   on public.proposal_images(proposal_id);
create index idx_images_scope_item on public.proposal_images(scope_item_id);

-- ── RLS ────────────────────────────────────────────────────────────────
alter table public.proposals       enable row level security;
alter table public.proposal_images enable row level security;

create policy "auth read proposals"
  on public.proposals for select
  to authenticated using (true);

create policy "auth insert proposals"
  on public.proposals for insert
  to authenticated with check (auth.uid() = created_by);

create policy "auth update proposals"
  on public.proposals for update
  to authenticated using (true)
  with check (auth.uid() = updated_by);

create policy "auth delete proposals"
  on public.proposals for delete
  to authenticated using (true);

create policy "auth read images"
  on public.proposal_images for select
  to authenticated using (true);

create policy "auth insert images"
  on public.proposal_images for insert
  to authenticated with check (true);

create policy "auth update images"
  on public.proposal_images for update
  to authenticated using (true) with check (true);

create policy "auth delete images"
  on public.proposal_images for delete
  to authenticated using (true);
