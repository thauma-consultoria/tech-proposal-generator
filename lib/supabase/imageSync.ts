import type { ProposalData, ScopeImage } from "../types";
import { uploadImage, deleteImages, getSignedUrl } from "./storage";

export function collectPaths(payload: ProposalData): string[] {
  return (payload.escopoItens ?? []).flatMap(
    (item) =>
      (item.imagens ?? [])
        .map((img) => img.path)
        .filter((p): p is string => !!p),
  );
}

// Upload de base64 novas → substitui dataUrl por path.
// Também limpa orphans (paths que existiam antes e sumiram).
export async function syncPayloadImages(
  payload: ProposalData,
  previousPayload?: ProposalData,
): Promise<ProposalData> {
  const newEscopo = await Promise.all(
    payload.escopoItens.map(async (item) => {
      if (!item.imagens || item.imagens.length === 0) return item;
      const imagens: ScopeImage[] = await Promise.all(
        item.imagens.map(async (img) => {
          if (img.path) return { ...img, dataUrl: undefined };
          if (img.dataUrl?.startsWith("data:")) {
            const path = await uploadImage(img.dataUrl);
            return { ...img, path, dataUrl: undefined };
          }
          return img;
        }),
      );
      return { ...item, imagens };
    }),
  );

  const newPayload: ProposalData = { ...payload, escopoItens: newEscopo };

  if (previousPayload) {
    const oldPaths = collectPaths(previousPayload);
    const newPaths = collectPaths(newPayload);
    const orphans = oldPaths.filter((p) => !newPaths.includes(p));
    if (orphans.length > 0) await deleteImages(orphans);
  }

  return newPayload;
}

// Converte paths em signed URLs antes de mandar pro server renderizar o PDF.
// Resiliente: se uma imagem não resolve (path inexistente / "Object not found"),
// ela fica com dataUrl undefined (o template a ignora) e o índice do item é
// reportado em `itensComImagemFaltando` para que a UI possa avisar o usuário.
export async function payloadWithSignedImages(
  payload: ProposalData,
): Promise<{ payload: ProposalData; itensComImagemFaltando: number[] }> {
  const itensComImagemFaltando: number[] = [];

  const newEscopo = await Promise.all(
    payload.escopoItens.map(async (item, idx) => {
      if (!item.imagens || item.imagens.length === 0) return item;
      let faltando = false;
      const imagens: ScopeImage[] = await Promise.all(
        item.imagens.map(async (img) => {
          if (img.path) {
            try {
              const url = await getSignedUrl(img.path);
              return { ...img, dataUrl: url };
            } catch {
              faltando = true;
              return { ...img, dataUrl: undefined };
            }
          }
          // Sem path: só é válida se tiver um dataUrl base64 ainda não salvo.
          if (!img.dataUrl) faltando = true;
          return img;
        }),
      );
      if (faltando) itensComImagemFaltando.push(idx);
      return { ...item, imagens };
    }),
  );

  return {
    payload: { ...payload, escopoItens: newEscopo },
    itensComImagemFaltando,
  };
}
