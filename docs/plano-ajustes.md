# Plano de Ajustes — Proposta Generator

> Registro de decisões e plano de execução em 3 fases.
> Criado em 2026-04-16.

---

## Fase 1 — Margens do PDF (executada)

**Problema:** margens em 0mm no puppeteer com padding aplicado no wrapper HTML.
Na página 1 funcionava; a partir da página 2, o texto colava na borda (ver `PR-1.pdf`).

**Correção aplicada:**
- `app/api/gerar-pdf/route.ts` — margens puppeteer para `{ top: 20mm, bottom: 22mm, left: 20mm, right: 20mm }`.
- `lib/template.ts` — removido `padding: 16mm 20mm 10mm 20mm` do wrapper principal.
- Footer mantido, pois já usava `padding: 0 20mm` que continua alinhado.

---

## Fase 2 — Imagens no escopo

**Objetivo:** permitir anexar imagens em cada item de escopo, com **fonte** (renderizada no PDF) e **descrição/explicação**.

**Escopo:**
- Estender `ScopeItem` com `imagens?: ScopeImage[]`
- Novo tipo `ScopeImage { id; url; fonte; descricao }`
- `ScopeEditor` ganha upload por item (resize no canvas para não estourar payload)
- Template PDF renderiza figura + legenda + fonte com `break-inside: avoid`

**Decisão pendente:** subir imagens direto no Supabase Storage ao fazer upload, já pensando na Fase 3 (recomendado) — ou manter base64 temporário. A decisão depende do timing da Fase 3.

---

## Fase 3 — Histórico de propostas (Supabase)

**Decisões do Pedro (2026-04-16):**
- Até 2 usuários — autenticação simples (Supabase Auth email/senha serve).
- Ao editar, o usuário **escolhe**: criar nova revisão OU sobrescrever a atual.
- Supabase ainda precisa ser configurado (projeto + env vars no Railway).

**Schema proposto:**

```sql
proposals (
  id uuid pk,
  numero text,
  revisao text,
  cliente text,
  assunto text,
  data_proposta text,
  payload jsonb,            -- ProposalData completo
  parent_id uuid nullable,  -- aponta para a proposta-mãe (para revisões)
  created_at timestamptz,
  updated_at timestamptz,
  user_id uuid
)

proposal_images (
  id uuid pk,
  proposal_id uuid fk,
  storage_path text,
  fonte text,
  descricao text,
  scope_item_id text         -- link com o item de escopo no payload
)
```

**`parent_id`** = quando o usuário clica "criar nova revisão", a nova linha aponta para a anterior. Sobrescrever = update direto na linha existente.

**Stack e tarefas:**
- Criar projeto Supabase (free tier)
- Habilitar Storage bucket `proposal-images`
- RLS: apenas usuários autenticados podem ler/escrever suas propostas
- Instalar `@supabase/supabase-js` no Next.js
- Telas: `/propostas` (lista), `/propostas/[id]` (edição)
- Ações: Salvar, Salvar como nova revisão, Duplicar, Excluir
- Env vars no Railway: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (apenas server-side)

---

## Ordem de execução

1. Fase 1 — margens (feita)
2. Configurar Supabase (Pedro) — schema rodado, auth configurada, bucket criado — FEITO
3. Fase 3 infra base — `@supabase/supabase-js` + `@supabase/ssr`, clients em `lib/supabase/{client,server}.ts` — FEITO
4. Fase 3 auth — `/login`, `middleware.ts`, `UserMenu` — FEITO
5. Fase 3 UX — `/propostas` (lista), editar via `?id=`, salvar/atualizar/nova revisão/duplicar/excluir — FEITO
6. Fase 2 — imagens no escopo (usando Supabase Storage) — FEITO
7. Migração `middleware.ts` → `proxy.ts` (Next 16 deprecation) — FEITO

## Env vars necessárias

**Local (`.env.local`, ignorado pelo git):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Railway (produção):**
- `NEXT_PUBLIC_SUPABASE_URL` — mesma URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — mesma anon key
- `SUPABASE_SERVICE_ROLE_KEY` — **só** se formos usar operações admin server-side (ex: excluir usuário). Não necessário por enquanto.
