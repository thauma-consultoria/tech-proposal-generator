import { createClient } from "./client";

export const BUCKET = "proposal-images";

export async function uploadImage(dataUrl: string): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Faça login novamente.");

  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Formato de imagem inválido");
  const contentType = match[1];
  const base64 = match[2];
  const ext = (contentType.split("/")[1] || "jpg").replace("+xml", "");

  const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const path = `${user.id}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, binary, {
    contentType,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function deleteImages(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) throw error;
}

export async function getSignedUrl(
  path: string,
  expiresIn = 3600,
): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
