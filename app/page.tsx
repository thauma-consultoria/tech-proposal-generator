"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FormStep from "@/components/FormStep";
import ScopeEditor from "@/components/ScopeEditor";
import PricingEditor from "@/components/PricingEditor";
import CustomSectionsEditor from "@/components/CustomSectionsEditor";
import UserMenu from "@/components/UserMenu";
import {
  getProposal,
  insertProposal,
  updateProposal,
} from "@/lib/supabase/proposals";
import {
  syncPayloadImages,
  payloadWithSignedImages,
} from "@/lib/supabase/imageSync";
import { buildPdfFilename } from "@/lib/filename";
import {
  ProposalData,
  ScopeItem,
  PriceItem,
  HourlyRate,
  CustomSection,
  DEFAULT_HOURLY_RATES,
  DEFAULT_SECAO_B,
  DEFAULT_SECAO_C,
  DEFAULT_SECAO_D,
  DEFAULT_SECAO_E,
  DEFAULT_SECAO_F,
  DEFAULT_PAGAMENTO,
  DEFAULT_PRAZO,
} from "@/lib/types";

function generateId() {
  return Math.random().toString(36).slice(2);
}

const TOTAL_STEPS = 6;
const STEP_LABELS = ["Identificação", "Escopo", "Seções B–F", "Preço", "Condições", "Revisão"];

function todayPtBR(): string {
  const now = new Date();
  const months = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  return `${now.getDate().toString().padStart(2, "0")} de ${months[now.getMonth()]} de ${now.getFullYear()}`;
}

// ── Seção colapsável ──────────────────────────────────────────────────────────
function SectionField({
  letra, titulo, value, onChange, rows = 4,
}: {
  letra: string; titulo: string; value: string;
  onChange: (v: string) => void; rows?: number;
}) {
  const [open, setOpen] = useState(false);
  const preview = value.split("\n")[0].slice(0, 80) + (value.length > 80 ? "…" : "");

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#7BAF7A] min-w-[18px]">{letra}.</span>
          <span className="text-sm font-semibold text-gray-700">{titulo}</span>
        </div>
        <span className="text-gray-400 text-lg leading-none">{open ? "−" : "+"}</span>
      </button>
      {!open && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-400 truncate">{preview}</p>
        </div>
      )}
      {open && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            className="w-full mt-3 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent resize-y"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Separe parágrafos com uma linha em branco.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Linha de resumo ───────────────────────────────────────────────────────────
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[100px] pt-0.5">{label}</span>
      <span className="text-gray-800 font-medium text-sm">{value}</span>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Home() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [loadingProposal, setLoadingProposal] = useState(false);
  const [lastSavedPayload, setLastSavedPayload] =
    useState<ProposalData | null>(null);

  // Etapa 1 — Identificação
  const [numero, setNumero] = useState("");
  const [revisao, setRevisao] = useState("");
  const [cidade, setCidade] = useState("Belo Horizonte");
  const [dataStr, setDataStr] = useState(todayPtBR());
  const [cliente, setCliente] = useState("");
  const [contato, setContato] = useState("");
  const [assunto, setAssunto] = useState("");
  const [assinaturaNome, setAssinaturaNome] = useState("");
  const [assinaturaCrea, setAssinaturaCrea] = useState("");

  // Etapa 2 — Escopo
  const [escopoItens, setEscopoItens] = useState<ScopeItem[]>([{ id: generateId(), descricao: "" }]);

  // Etapa 3 — Seções B–F
  const [secaoB, setSecaoB] = useState(DEFAULT_SECAO_B);
  const [secaoC, setSecaoC] = useState(DEFAULT_SECAO_C);
  const [secaoD, setSecaoD] = useState(DEFAULT_SECAO_D);
  const [secaoE, setSecaoE] = useState(DEFAULT_SECAO_E);
  const [secaoF, setSecaoF] = useState(DEFAULT_SECAO_F);

  // Etapa 4 — Preço
  const [precoItens, setPrecoItens] = useState<PriceItem[]>([{ id: generateId(), descricao: "", valor: 0 }]);
  const [precoItensAdicionais, setPrecoItensAdicionais] = useState<PriceItem[]>([]);
  const [horasTecnicas, setHorasTecnicas] = useState<HourlyRate[]>(DEFAULT_HOURLY_RATES);

  // Etapa 5 — Condições + Extras
  const [pagamento, setPagamento] = useState(DEFAULT_PAGAMENTO);
  const [prazo, setPrazo] = useState(DEFAULT_PRAZO);
  const [secoesExtras, setSecoesExtras] = useState<CustomSection[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) return;
    setLoadingProposal(true);
    getProposal(id)
      .then((row) => {
        const p = row.payload;
        setNumero(p.numero);
        setRevisao(p.revisao ?? "");
        setCidade(p.cidade);
        setDataStr(p.data);
        setCliente(p.cliente);
        setContato(p.contato);
        setAssunto(p.assunto);
        setAssinaturaNome(p.assinaturaNome ?? "");
        setAssinaturaCrea(p.assinaturaCrea ?? "");
        setEscopoItens(p.escopoItens);
        setSecaoB(p.secaoB);
        setSecaoC(p.secaoC);
        setSecaoD(p.secaoD);
        setSecaoE(p.secaoE);
        setSecaoF(p.secaoF);
        setPrecoItens(p.precoItens);
        setPrecoItensAdicionais(p.precoItensAdicionais ?? []);
        setHorasTecnicas(p.horasTecnicas);
        setPagamento(p.pagamento);
        setPrazo(p.prazo);
        setSecoesExtras(p.secoesExtras);
        setEditingId(row.id);
        setLastSavedPayload(p);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Erro ao carregar proposta"),
      )
      .finally(() => setLoadingProposal(false));
  }, []);

  function buildPayload(): ProposalData {
    return {
      numero, revisao: revisao || undefined,
      cidade, data: dataStr,
      cliente, contato, assunto,
      assinaturaNome: assinaturaNome || undefined,
      assinaturaCrea: assinaturaCrea || undefined,
      escopoItens,
      secaoB, secaoC, secaoD, secaoE, secaoF,
      precoItens,
      precoItensAdicionais: precoItensAdicionais.filter((i) => i.descricao.trim()),
      horasTecnicas,
      pagamento, prazo,
      secoesExtras,
    };
  }

  async function handleSave(mode: "new" | "update" | "newRevision") {
    setSaving(true);
    setError("");
    setSaveMsg("");
    try {
      const raw = buildPayload();
      // Upload das base64, cleanup de orphans (só em update — newRevision preserva imagens originais)
      const previous = mode === "update" ? lastSavedPayload ?? undefined : undefined;
      const synced = await syncPayloadImages(raw, previous);

      // Propaga paths de volta pro state, pra não re-uploadar no próximo save.
      setEscopoItens(synced.escopoItens);

      let id: string;
      if (mode === "update" && editingId) {
        const row = await updateProposal(editingId, synced);
        id = row.id;
        setSaveMsg("Proposta atualizada.");
      } else if (mode === "newRevision" && editingId) {
        const row = await insertProposal(synced, editingId);
        id = row.id;
        setSaveMsg("Nova revisão salva.");
      } else {
        const row = await insertProposal(synced);
        id = row.id;
        setSaveMsg("Proposta salva.");
      }
      setEditingId(id);
      setLastSavedPayload(synced);
      window.history.replaceState(null, "", `/?id=${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setError("");
    try {
      const { payload, itensComImagemFaltando } =
        await payloadWithSignedImages(buildPayload());

      if (itensComImagemFaltando.length > 0) {
        const listaItens = itensComImagemFaltando
          .map((i) => {
            const desc = escopoItens[i]?.descricao?.trim() ?? "";
            const trecho = desc ? ` ("${desc.slice(0, 40)}${desc.length > 40 ? "..." : ""}")` : "";
            return `Item ${i + 1}${trecho}`;
          })
          .join(", ");
        const ok = window.confirm(
          `Você marcou imagem em ${listaItens}, mas o arquivo não foi inserido ou não foi encontrado.\n\nGerar o PDF mesmo assim, sem essa(s) imagem(ns)?`,
        );
        if (!ok) return;
      }

      const res = await fetch("/api/gerar-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro desconhecido");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = buildPdfFilename({ numero, revisao, cliente, assunto });
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao gerar PDF");
    } finally {
      setLoading(false);
    }
  }

  const total = precoItens.reduce((s, i) => s + i.valor, 0);

  const canNextMap: Record<number, boolean> = {
    1: !!(numero && cidade && dataStr && cliente && contato && assunto),
    2: escopoItens.length > 0 && escopoItens.every((i) => i.descricao.trim()),
    3: !!(secaoB.trim() && secaoC.trim() && secaoD.trim() && secaoE.trim() && secaoF.trim()),
    4: precoItens.length > 0 && precoItens.every((i) => i.descricao.trim() && i.valor > 0),
    5: !!(pagamento.trim() && prazo.trim()),
    6: true,
  };
  const canNext = canNextMap[step] ?? true;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 shadow-sm">
        <div className="bg-[#1A1A1A] rounded-md px-3 py-1.5 flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Tech Estrutural" className="h-7 w-auto" />
        </div>
        <div className="h-6 w-px bg-gray-200" />
        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          {editingId ? "Editando Proposta" : "Nova Proposta"}
        </span>
        <Link
          href="/propostas"
          className="text-xs font-semibold text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-md transition"
        >
          Histórico
        </Link>
        <UserMenu />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Step indicator */}
        <div className="flex items-center mb-8">
          {STEP_LABELS.map((label, idx) => {
            const s = idx + 1;
            const active = s === step;
            const done = s < step;
            return (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    done ? "bg-[#7BAF7A] text-white"
                    : active ? "bg-[#1A1A1A] text-white ring-4 ring-[#7BAF7A]/30"
                    : "bg-gray-200 text-gray-400"
                  }`}>
                    {done ? "✓" : s}
                  </div>
                  <span className={`text-xs font-medium whitespace-nowrap ${active ? "text-gray-800" : "text-gray-400"}`}>
                    {label}
                  </span>
                </div>
                {idx < STEP_LABELS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-4 ${done ? "bg-[#7BAF7A]" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {/* ── STEP 1: Identificação ── */}
          <FormStep step={1} currentStep={step} title="Identificação da Proposta">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Número *</label>
                  <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)}
                    placeholder="PR-013/2026"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Revisão</label>
                  <input type="text" value={revisao} onChange={(e) => setRevisao(e.target.value)}
                    placeholder="Rev. 3 (opcional)"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Cidade *</label>
                  <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Data *</label>
                  <input type="text" value={dataStr} onChange={(e) => setDataStr(e.target.value)}
                    placeholder="04 de fevereiro de 2026"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Cliente *</label>
                <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)}
                  placeholder="Nome da empresa ou cliente"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Responsável pela Proposta *
                </label>
                <input type="text" value={contato} onChange={(e) => setContato(e.target.value)}
                  placeholder="Nome do responsável pela proposta"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Assunto / Título do Projeto *</label>
                <input type="text" value={assunto} onChange={(e) => setAssunto(e.target.value)}
                  placeholder="Ex: Projeto executivo de fundação para obra em Contagem/MG"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent" />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  Assinatura do PDF
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <p className="text-xs text-gray-400 -mt-2">
                Aparece como linha de assinatura ao final da proposta. Opcional — deixe em branco para gerar só o traço.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nome do Signatário</label>
                  <input type="text" value={assinaturaNome} onChange={(e) => setAssinaturaNome(e.target.value)}
                    placeholder="Nome de quem assina"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">CREA</label>
                  <input type="text" value={assinaturaCrea} onChange={(e) => setAssinaturaCrea(e.target.value)}
                    placeholder="Ex: MG-123456/D"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent" />
                </div>
              </div>
            </div>
          </FormStep>

          {/* ── STEP 2: Escopo ── */}
          <FormStep step={2} currentStep={step} title="Escopo dos Serviços (Seção A)">
            <ScopeEditor items={escopoItens} onChange={setEscopoItens} />
          </FormStep>

          {/* ── STEP 3: Seções B–F ── */}
          <FormStep step={3} currentStep={step} title="Seções Técnicas (B–F)">
            <p className="text-xs text-gray-400 mb-4">
              Todas as seções vêm com texto padrão. Clique em qualquer uma para editar.
            </p>
            <div className="space-y-3">
              <SectionField letra="B" titulo="Organização dos Trabalhos" value={secaoB} onChange={setSecaoB} />
              <SectionField letra="C" titulo="Normas e Critérios de Cálculo" value={secaoC} onChange={setSecaoC} />
              <SectionField letra="D" titulo="Metodologia de Cálculo" value={secaoD} onChange={setSecaoD} />
              <SectionField letra="E" titulo="Condições e Informações sob responsabilidade do Contratante" value={secaoE} onChange={setSecaoE} rows={6} />
              <SectionField letra="F" titulo="Revisões e Serviços Adicionais" value={secaoF} onChange={setSecaoF} />
            </div>
          </FormStep>

          {/* ── STEP 4: Preço ── */}
          <FormStep step={4} currentStep={step} title="Preço e Horas Técnicas (Seção G)">
            <PricingEditor
              items={precoItens}
              onItemsChange={setPrecoItens}
              extraItems={precoItensAdicionais}
              onExtraItemsChange={setPrecoItensAdicionais}
              hourlyRates={horasTecnicas}
              onRatesChange={setHorasTecnicas}
            />
          </FormStep>

          {/* ── STEP 5: Condições + Extras ── */}
          <FormStep step={5} currentStep={step} title="Condições e Seções Adicionais">
            <div className="space-y-5">
              <SectionField letra="H" titulo="Condições de Pagamento" value={pagamento} onChange={setPagamento} rows={3} />
              <SectionField letra="J" titulo="Prazos de Entrega" value={prazo} onChange={setPrazo} rows={2} />

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Seções Personalizadas
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <CustomSectionsEditor sections={secoesExtras} onChange={setSecoesExtras} />
              </div>
            </div>
          </FormStep>

          {/* ── STEP 6: Revisão ── */}
          <FormStep step={6} currentStep={step} title="Revisão Final">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                <Row label="Proposta" value={`${numero}${revisao ? ` — ${revisao}` : ""}`} />
                <Row label="Cliente" value={cliente} />
                <Row label="Responsável" value={contato} />
                <Row label="Data" value={`${cidade}, ${dataStr}`} />
                <Row label="Assunto" value={assunto} />
                {(assinaturaNome || assinaturaCrea) && (
                  <Row
                    label="Assinatura"
                    value={[assinaturaNome, assinaturaCrea ? `CREA ${assinaturaCrea}` : ""].filter(Boolean).join(" — ")}
                  />
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Escopo — {escopoItens.length} {escopoItens.length === 1 ? "item" : "itens"}
                </p>
                <ul className="space-y-1">
                  {escopoItens.map((item, idx) => (
                    <li key={item.id} className="flex gap-2 text-sm text-gray-700">
                      <span className="text-[#7BAF7A] font-semibold min-w-[52px]">Item {idx + 1}</span>
                      <span>{item.descricao}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Preço — {precoItens.length} {precoItens.length === 1 ? "item" : "itens"}
                </p>
                <ul className="space-y-1">
                  {precoItens.map((item, idx) => (
                    <li key={item.id} className="flex justify-between text-sm text-gray-700">
                      <span>
                        <span className="text-[#7BAF7A] font-semibold mr-2">Item {idx + 1}</span>
                        {item.descricao}
                      </span>
                      <span className="font-medium">
                        {item.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex justify-end">
                  <span className="bg-[#EBF4EB] text-[#1A7A1A] font-bold text-sm px-4 py-1.5 rounded-lg">
                    Total: {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>
              </div>

              {precoItensAdicionais.filter((i) => i.descricao.trim()).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Serviços Complementares (não somados ao total)
                  </p>
                  <ul className="space-y-1">
                    {precoItensAdicionais
                      .filter((i) => i.descricao.trim())
                      .map((item, idx) => (
                        <li key={item.id} className="flex justify-between text-sm text-gray-700">
                          <span>
                            <span className="text-[#7BAF7A] font-semibold mr-2">Item {idx + 1}</span>
                            {item.descricao}
                          </span>
                          <span className="font-medium">
                            {item.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {secoesExtras.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Seções Extras — {secoesExtras.length}
                  </p>
                  <ul className="space-y-1">
                    {secoesExtras.map((s) => (
                      <li key={s.id} className="text-sm text-gray-700">
                        <span className="text-[#7BAF7A] font-semibold mr-2">{s.letra}.</span>
                        {s.titulo}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              {saveMsg && (
                <div className="bg-[#EBF4EB] border border-[#7BAF7A]/40 text-[#1A7A1A] rounded-lg px-4 py-3 text-sm">
                  {saveMsg}
                </div>
              )}

              {editingId ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSave("update")}
                    disabled={saving || loading}
                    className="bg-white hover:bg-gray-50 disabled:bg-gray-100 border border-gray-300 text-gray-800 font-semibold py-3 rounded-xl transition text-sm"
                  >
                    {saving ? "Salvando..." : "Atualizar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave("newRevision")}
                    disabled={saving || loading}
                    className="bg-[#7BAF7A] hover:bg-[#6a9e69] disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition text-sm"
                  >
                    {saving ? "Salvando..." : "Salvar como nova revisão"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSave("new")}
                  disabled={saving || loading}
                  className="w-full bg-[#7BAF7A] hover:bg-[#6a9e69] disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition text-sm"
                >
                  {saving ? "Salvando..." : "Salvar proposta"}
                </button>
              )}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || saving}
                className="w-full bg-[#1A1A1A] hover:bg-[#333] disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition text-sm tracking-wide flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Gerando PDF...
                  </>
                ) : (
                  "⬇ Gerar e Baixar PDF"
                )}
              </button>
            </div>
          </FormStep>

          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            <button type="button" onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-800 disabled:opacity-0 transition">
              ← Voltar
            </button>
            {step < TOTAL_STEPS && (
              <button type="button" onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
                disabled={!canNext}
                className="px-6 py-2.5 bg-[#7BAF7A] hover:bg-[#6a9e69] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl text-sm transition">
                Próximo →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
