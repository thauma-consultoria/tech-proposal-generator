"use client";

import { useState } from "react";
import FormStep from "@/components/FormStep";
import ScopeEditor from "@/components/ScopeEditor";
import PricingEditor from "@/components/PricingEditor";
import {
  ProposalData,
  ScopeItem,
  PriceItem,
  HourlyRate,
  DEFAULT_HOURLY_RATES,
  SOFTWARES_DISPONIVEIS,
} from "@/lib/types";

function generateId() {
  return Math.random().toString(36).slice(2);
}

const TOTAL_STEPS = 5;

const STEP_LABELS = [
  "Identificação",
  "Escopo",
  "Preço",
  "Condições",
  "Revisão",
];

function todayPtBR(): string {
  const now = new Date();
  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${now.getDate().toString().padStart(2, "0")} de ${months[now.getMonth()]} de ${now.getFullYear()}`;
}

export default function Home() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [numero, setNumero] = useState("");
  const [revisao, setRevisao] = useState("");
  const [cidade, setCidade] = useState("Belo Horizonte");
  const [data, setData] = useState(todayPtBR());
  const [cliente, setCliente] = useState("");
  const [contato, setContato] = useState("");
  const [assunto, setAssunto] = useState("");

  const [escopoItens, setEscopoItens] = useState<ScopeItem[]>([
    { id: generateId(), descricao: "" },
  ]);

  const [softwareCalculo, setSoftwareCalculo] = useState<string[]>(["TQS", "SAP2000"]);

  const [precoItens, setPrecoItens] = useState<PriceItem[]>([
    { id: generateId(), descricao: "", valor: 0 },
  ]);
  const [horasTecnicas, setHorasTecnicas] = useState<HourlyRate[]>(DEFAULT_HOURLY_RATES);

  const [pagamento, setPagamento] = useState(
    "30% (trinta por cento) na aceitação da proposta e 70% (setenta por cento) em faturas mensais durante o desenvolvimento dos serviços."
  );
  const [prazo, setPrazo] = useState("A ser definido em comum acordo entre as partes.");

  function toggleSoftware(sw: string) {
    setSoftwareCalculo((prev) =>
      prev.includes(sw) ? prev.filter((s) => s !== sw) : [...prev, sw]
    );
  }

  function buildPayload(): ProposalData {
    return {
      numero,
      revisao: revisao || undefined,
      cidade,
      data,
      cliente,
      contato,
      assunto,
      escopoItens,
      softwareCalculo,
      precoItens,
      horasTecnicas,
      pagamento,
      prazo,
    };
  }

  async function handleGenerate() {
    setLoading(true);
    setError("");
    try {
      const payload = buildPayload();
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
      a.download = `${numero.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao gerar PDF");
    } finally {
      setLoading(false);
    }
  }

  const total = precoItens.reduce((s, i) => s + i.valor, 0);
  const canNext1 = !!(numero && cidade && data && cliente && contato && assunto);
  const canNext2 = escopoItens.length > 0 && escopoItens.every((i) => i.descricao.trim());
  const canNext3 = precoItens.length > 0 && precoItens.every((i) => i.descricao.trim() && i.valor > 0);
  const canNext4 = !!(pagamento.trim() && prazo.trim());

  const canNextMap: Record<number, boolean> = { 1: canNext1, 2: canNext2, 3: canNext3, 4: canNext4, 5: true };
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
          Gerador de Propostas
        </span>
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
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      done
                        ? "bg-[#7BAF7A] text-white"
                        : active
                        ? "bg-[#1A1A1A] text-white ring-4 ring-[#7BAF7A]/30"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {done ? "✓" : s}
                  </div>
                  <span
                    className={`text-xs font-medium whitespace-nowrap ${
                      active ? "text-gray-800" : "text-gray-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {idx < STEP_LABELS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 mb-4 ${
                      done ? "bg-[#7BAF7A]" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {/* STEP 1: Identificação */}
          <FormStep step={1} currentStep={step} title="Identificação da Proposta">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Número da Proposta *
                  </label>
                  <input
                    type="text"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    placeholder="PR-013/2026"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Revisão
                  </label>
                  <input
                    type="text"
                    value={revisao}
                    onChange={(e) => setRevisao(e.target.value)}
                    placeholder="Rev. 3 (opcional)"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Data *
                  </label>
                  <input
                    type="text"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    placeholder="04 de fevereiro de 2026"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Cliente *
                </label>
                <input
                  type="text"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Nome da empresa ou cliente"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Responsável Técnico (Tech Estrutural) *
                </label>
                <input
                  type="text"
                  value={contato}
                  onChange={(e) => setContato(e.target.value)}
                  placeholder="Profissional da Tech Estrutural que elaborou a proposta"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Assunto / Título do Projeto *
                </label>
                <input
                  type="text"
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                  placeholder="Ex: Projeto executivo de fundação para obra em Contagem/MG"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent"
                />
              </div>
            </div>
          </FormStep>

          {/* STEP 2: Escopo */}
          <FormStep step={2} currentStep={step} title="Escopo dos Serviços (Seção A)">
            <ScopeEditor items={escopoItens} onChange={setEscopoItens} />
          </FormStep>

          {/* STEP 3: Preço */}
          <FormStep step={3} currentStep={step} title="Preço e Horas Técnicas (Seção G)">
            <PricingEditor
              items={precoItens}
              onItemsChange={setPrecoItens}
              hourlyRates={horasTecnicas}
              onRatesChange={setHorasTecnicas}
            />
          </FormStep>

          {/* STEP 4: Condições */}
          <FormStep step={4} currentStep={step} title="Condições Gerais">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Softwares de Cálculo (Seção D)
                </label>
                <div className="flex flex-wrap gap-2">
                  {SOFTWARES_DISPONIVEIS.map((sw) => (
                    <button
                      key={sw}
                      type="button"
                      onClick={() => toggleSoftware(sw)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        softwareCalculo.includes(sw)
                          ? "bg-[#7BAF7A] border-[#7BAF7A] text-white"
                          : "bg-white border-gray-200 text-gray-500 hover:border-[#7BAF7A]"
                      }`}
                    >
                      {sw}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Condições de Pagamento (Seção H)
                </label>
                <textarea
                  value={pagamento}
                  onChange={(e) => setPagamento(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Prazo de Entrega (Seção J)
                </label>
                <textarea
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent resize-none"
                />
              </div>
            </div>
          </FormStep>

          {/* STEP 5: Revisão */}
          <FormStep step={5} currentStep={step} title="Revisão Final">
            <div className="space-y-4 text-sm">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <Row label="Proposta" value={`${numero}${revisao ? ` — ${revisao}` : ""}`} />
                <Row label="Cliente" value={cliente} />
                <Row label="Resp. Técnico" value={contato} />
                <Row label="Data" value={`${cidade}, ${data}`} />
                <Row label="Assunto" value={assunto} />
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Escopo — {escopoItens.length} {escopoItens.length === 1 ? "item" : "itens"}
                </p>
                <ul className="space-y-1">
                  {escopoItens.map((item, idx) => (
                    <li key={item.id} className="flex gap-2 text-sm text-gray-700">
                      <span className="text-[#7BAF7A] font-semibold min-w-[52px]">
                        Item {idx + 1}
                      </span>
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
                        <span className="text-[#7BAF7A] font-semibold mr-2">
                          Item {idx + 1}
                        </span>
                        {item.descricao}
                      </span>
                      <span className="font-medium">
                        {item.valor.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex justify-end">
                  <span className="bg-[#EBF4EB] text-[#1A7A1A] font-bold text-sm px-4 py-1.5 rounded-lg">
                    Total:{" "}
                    {total.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
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
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-800 disabled:opacity-0 transition"
            >
              ← Voltar
            </button>
            {step < TOTAL_STEPS && (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
                disabled={!canNext}
                className="px-6 py-2.5 bg-[#7BAF7A] hover:bg-[#6a9e69] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl text-sm transition"
              >
                Próximo →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[80px] pt-0.5">
        {label}
      </span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}
