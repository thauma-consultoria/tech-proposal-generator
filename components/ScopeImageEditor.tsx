"use client";

import { useEffect, useState } from "react";
import type { ScopeImage } from "@/lib/types";
import { resizeImageToDataUrl } from "@/lib/imageResize";
import { getSignedUrl } from "@/lib/supabase/storage";

interface Props {
  images: ScopeImage[];
  onChange: (imgs: ScopeImage[]) => void;
}

function generateId() {
  return Math.random().toString(36).slice(2);
}

export default function ScopeImageEditor({ images, onChange }: Props) {
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const missing = images.filter(
      (img) => img.path && !previewUrls[img.path],
    );
    if (missing.length === 0) return;
    (async () => {
      try {
        const entries = await Promise.all(
          missing.map(async (img) => {
            const url = await getSignedUrl(img.path!);
            return [img.path!, url] as const;
          }),
        );
        setPreviewUrls((prev) => ({
          ...prev,
          ...Object.fromEntries(entries),
        }));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar preview");
      }
    })();
  }, [images, previewUrls]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const news: ScopeImage[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const dataUrl = await resizeImageToDataUrl(file);
        news.push({ id: generateId(), dataUrl, fonte: "", descricao: "" });
      }
      onChange([...images, ...news]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao processar imagem");
    } finally {
      setBusy(false);
    }
  }

  function updateField(id: string, patch: Partial<ScopeImage>) {
    onChange(images.map((img) => (img.id === id ? { ...img, ...patch } : img)));
  }

  function remove(id: string) {
    onChange(images.filter((img) => img.id !== id));
  }

  return (
    <div className="mt-3 space-y-2">
      {images.map((img) => {
        const src = img.dataUrl ?? (img.path ? previewUrls[img.path] : "");
        return (
          <div
            key={img.id}
            className="flex gap-3 bg-gray-50 border border-gray-100 rounded-lg p-2.5"
          >
            {src ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={src}
                alt=""
                className="w-20 h-20 object-cover rounded-md flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center text-[10px] text-gray-400 flex-shrink-0">
                carregando
              </div>
            )}
            <div className="flex-1 space-y-1.5 min-w-0">
              <input
                type="text"
                value={img.descricao}
                onChange={(e) =>
                  updateField(img.id, { descricao: e.target.value })
                }
                placeholder="Descrição da imagem"
                className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent"
              />
              <input
                type="text"
                value={img.fonte}
                onChange={(e) =>
                  updateField(img.id, { fonte: e.target.value })
                }
                placeholder="Fonte (ex: ABNT NBR 6118:2023)"
                className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#7BAF7A] focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={() => remove(img.id)}
              className="self-start p-1 text-gray-400 hover:text-red-500 rounded-md transition"
              title="Remover imagem"
            >
              ✕
            </button>
          </div>
        );
      })}

      {error && (
        <div className="text-xs text-red-600 px-1">{error}</div>
      )}

      <label className="block border-2 border-dashed border-gray-300 rounded-lg py-2.5 text-center cursor-pointer hover:border-[#7BAF7A] hover:bg-[#EBF4EB]/30 transition text-xs font-semibold text-gray-500 hover:text-[#7BAF7A]">
        {busy ? "Processando..." : "+ Anexar imagem(ns)"}
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={busy}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
