"use client";

import { CustomSection } from "@/lib/types";

interface Props {
  sections: CustomSection[];
  onChange: (sections: CustomSection[]) => void;
}

function generateId() {
  return Math.random().toString(36).slice(2);
}

export default function CustomSectionsEditor({ sections, onChange }: Props) {
  function add() {
    onChange([...sections, { id: generateId(), letra: "", titulo: "", conteudo: "" }]);
  }

  function remove(id: string) {
    onChange(sections.filter((s) => s.id !== id));
  }

  function update(id: string, field: keyof CustomSection, value: string) {
    onChange(sections.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  return (
    <div className="space-y-4">
      {sections.map((sec, idx) => (
        <div key={sec.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7BAF7A] uppercase tracking-wider">
              Seção Extra {idx + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(sec.id)}
              className="text-gray-400 hover:text-red-500 transition text-sm"
            >
              ✕ Remover
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Letra / Código
              </label>
              <input
                type="text"
                value={sec.letra}
                onChange={(e) => update(sec.id, "letra", e.target.value)}
                placeholder="K"
                maxLength={5}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Título da Seção
              </label>
              <input
                type="text"
                value={sec.titulo}
                onChange={(e) => update(sec.id, "titulo", e.target.value)}
                placeholder="Ex: Garantias e Responsabilidades"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Conteúdo
            </label>
            <textarea
              value={sec.conteudo}
              onChange={(e) => update(sec.id, "conteudo", e.target.value)}
              rows={4}
              placeholder="Texto da seção... Use linha em branco para separar parágrafos."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent resize-none"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="w-full border-2 border-dashed border-[#7BAF7A] text-[#7BAF7A] rounded-xl py-3 text-sm font-semibold hover:bg-[#EBF4EB] transition"
      >
        + Adicionar seção personalizada
      </button>
    </div>
  );
}
