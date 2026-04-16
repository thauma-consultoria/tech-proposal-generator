import { createClient } from "./client";
import type { ProposalData } from "../types";
import { collectPaths } from "./imageSync";
import { deleteImages } from "./storage";

export interface ProposalRow {
  id: string;
  numero: string;
  revisao: string | null;
  cliente: string;
  assunto: string;
  data_proposta: string;
  payload: ProposalData;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export async function listProposals(): Promise<ProposalRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as ProposalRow[];
}

export async function getProposal(id: string): Promise<ProposalRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as ProposalRow;
}

export async function insertProposal(
  payload: ProposalData,
  parentId?: string | null,
): Promise<ProposalRow> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Faça login novamente.");

  const { data, error } = await supabase
    .from("proposals")
    .insert({
      created_by: user.id,
      updated_by: user.id,
      numero: payload.numero,
      revisao: payload.revisao ?? null,
      cliente: payload.cliente,
      assunto: payload.assunto,
      data_proposta: payload.data,
      payload,
      parent_id: parentId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ProposalRow;
}

export async function updateProposal(
  id: string,
  payload: ProposalData,
): Promise<ProposalRow> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Faça login novamente.");

  const { data, error } = await supabase
    .from("proposals")
    .update({
      updated_by: user.id,
      numero: payload.numero,
      revisao: payload.revisao ?? null,
      cliente: payload.cliente,
      assunto: payload.assunto,
      data_proposta: payload.data,
      payload,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ProposalRow;
}

export async function deleteProposal(id: string): Promise<void> {
  const supabase = createClient();
  const { data: prop } = await supabase
    .from("proposals")
    .select("payload")
    .eq("id", id)
    .single();
  if (prop?.payload) {
    const paths = collectPaths(prop.payload as ProposalData);
    if (paths.length > 0) {
      try {
        await deleteImages(paths);
      } catch {
        // Não bloquear a exclusão da linha por falha de Storage.
      }
    }
  }
  const { error } = await supabase.from("proposals").delete().eq("id", id);
  if (error) throw error;
}
