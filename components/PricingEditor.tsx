"use client";

import { PriceItem, HourlyRate } from "@/lib/types";

interface Props {
  items: PriceItem[];
  onItemsChange: (items: PriceItem[]) => void;
  hourlyRates: HourlyRate[];
  onRatesChange: (rates: HourlyRate[]) => void;
}

function generateId() {
  return Math.random().toString(36).slice(2);
}

function formatDisplay(value: number): string {
  if (!value) return "";
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function parseValue(str: string): number {
  const cleaned = str.replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

export default function PricingEditor({ items, onItemsChange, hourlyRates, onRatesChange }: Props) {
  const total = items.reduce((sum, i) => sum + i.valor, 0);

  function addItem() {
    onItemsChange([...items, { id: generateId(), descricao: "", valor: 0 }]);
  }

  function removeItem(id: string) {
    onItemsChange(items.filter((i) => i.id !== id));
  }

  function updateItem(id: string, field: "descricao" | "valor", value: string) {
    onItemsChange(
      items.map((i) =>
        i.id === id
          ? { ...i, [field]: field === "valor" ? parseValue(value) : value }
          : i
      )
    );
  }

  function updateRate(index: number, valorHora: number) {
    const next = [...hourlyRates];
    next[index] = { ...next[index], valorHora };
    onRatesChange(next);
  }

  return (
    <div className="space-y-6">
      {/* Pricing items */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Itens da Proposta
        </h3>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={item.id} className="flex gap-2 items-center">
              <span className="text-xs font-bold text-[#7BAF7A] min-w-[46px]">
                Item {idx + 1}
              </span>
              <input
                type="text"
                value={item.descricao}
                onChange={(e) => updateItem(item.id, "descricao", e.target.value)}
                placeholder="Descrição do serviço..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent"
              />
              <div className="relative w-36">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  R$
                </span>
                <input
                  type="text"
                  defaultValue={item.valor ? formatDisplay(item.valor) : ""}
                  onBlur={(e) => updateItem(item.id, "valor", e.target.value)}
                  placeholder="0,00"
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent"
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="mt-3 w-full border-2 border-dashed border-[#7BAF7A] text-[#7BAF7A] rounded-lg py-2.5 text-sm font-semibold hover:bg-[#EBF4EB] transition"
        >
          + Adicionar item
        </button>

        {/* Total */}
        {items.length > 0 && (
          <div className="mt-3 flex justify-end">
            <div className="bg-[#EBF4EB] border border-[#7BAF7A] rounded-lg px-5 py-2.5 text-right">
              <div className="text-xs font-semibold text-[#7BAF7A] uppercase tracking-wider">
                Total Geral
              </div>
              <div className="text-xl font-bold text-gray-800">
                {total.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hourly rates */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Tabela de Horas Técnicas
        </h3>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Profissional
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Valor/Hora
                </th>
              </tr>
            </thead>
            <tbody>
              {hourlyRates.map((rate, idx) => (
                <tr key={idx} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2.5 text-gray-700">{rate.cargo}</td>
                  <td className="px-4 py-2.5">
                    <div className="relative flex justify-end">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        R$
                      </span>
                      <input
                        type="number"
                        value={rate.valorHora}
                        onChange={(e) => updateRate(idx, parseFloat(e.target.value) || 0)}
                        className="w-28 border border-gray-200 rounded pl-8 pr-2 py-1 text-right text-sm focus:outline-none focus:ring-1 focus:ring-[#7BAF7A]"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
