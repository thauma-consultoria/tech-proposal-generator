"use client";

import { ScopeItem, ScopeImage } from "@/lib/types";
import ScopeImageEditor from "./ScopeImageEditor";

interface Props {
  items: ScopeItem[];
  onChange: (items: ScopeItem[]) => void;
}

function generateId() {
  return Math.random().toString(36).slice(2);
}

export default function ScopeEditor({ items, onChange }: Props) {
  function add() {
    onChange([...items, { id: generateId(), descricao: "" }]);
  }

  function remove(id: string) {
    onChange(items.filter((i) => i.id !== id));
  }

  function update(id: string, descricao: string) {
    onChange(items.map((i) => (i.id === id ? { ...i, descricao } : i)));
  }

  function updateImages(id: string, imagens: ScopeImage[]) {
    onChange(items.map((i) => (i.id === id ? { ...i, imagens } : i)));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...items];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  }

  function moveDown(index: number) {
    if (index === items.length - 1) return;
    const next = [...items];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div
          key={item.id}
          className="border border-gray-100 rounded-xl p-3 bg-white"
        >
          <div className="flex gap-2 items-start">
            <div className="flex flex-col gap-1 pt-2">
              <button
                type="button"
                onClick={() => moveUp(idx)}
                disabled={idx === 0}
                className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed transition"
                title="Mover para cima"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveDown(idx)}
                disabled={idx === items.length - 1}
                className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed transition"
                title="Mover para baixo"
              >
                ▼
              </button>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-bold text-[#7BAF7A] min-w-[52px]">
                Item {idx + 1}
              </span>
              <textarea
                value={item.descricao}
                onChange={(e) => update(item.id, e.target.value)}
                rows={2}
                placeholder="Descrição do item de escopo..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent resize-none"
              />
            </div>
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="mt-2 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
              title="Remover item"
            >
              ✕
            </button>
          </div>
          <ScopeImageEditor
            images={item.imagens ?? []}
            onChange={(imgs) => updateImages(item.id, imgs)}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full border-2 border-dashed border-[#7BAF7A] text-[#7BAF7A] rounded-lg py-2.5 text-sm font-semibold hover:bg-[#EBF4EB] transition"
      >
        + Adicionar item de escopo
      </button>
    </div>
  );
}
