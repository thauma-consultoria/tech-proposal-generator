"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  listProposals,
  deleteProposal,
  insertProposal,
  type ProposalRow,
} from "@/lib/supabase/proposals";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ProposalList() {
  const [rows, setRows] = useState<ProposalRow[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    try {
      const data = await listProposals();
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar propostas");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDelete(id: string, label: string) {
    if (!confirm(`Excluir a proposta ${label}? Esta ação não pode ser desfeita.`))
      return;
    setBusyId(id);
    try {
      await deleteProposal(id);
      setRows((prev) => prev?.filter((r) => r.id !== id) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDuplicate(row: ProposalRow) {
    setBusyId(row.id);
    try {
      const payload = {
        ...row.payload,
        numero: `${row.payload.numero} (cópia)`,
        revisao: undefined,
      };
      await insertProposal(payload);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao duplicar");
    } finally {
      setBusyId(null);
    }
  }

  if (rows === null && !error) {
    return <p className="text-sm text-gray-400">Carregando...</p>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
        {error}
      </div>
    );
  }

  if (rows && rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
        <p className="text-sm text-gray-500 mb-4">
          Nenhuma proposta salva ainda.
        </p>
        <Link
          href="/"
          className="inline-block bg-[#7BAF7A] hover:bg-[#6a9e69] text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition"
        >
          + Criar primeira proposta
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Proposta
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Cliente
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
              Assunto
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
              Atualizada
            </th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {rows!.map((row) => {
            const label = `${row.numero}${row.revisao ? ` — ${row.revisao}` : ""}`;
            const busy = busyId === row.id;
            return (
              <tr
                key={row.id}
                className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition"
              >
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-800">{row.numero}</div>
                  {row.revisao && (
                    <div className="text-xs text-[#7BAF7A] font-medium">
                      {row.revisao}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700">{row.cliente}</td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell max-w-xs truncate">
                  {row.assunto}
                </td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell text-xs">
                  {formatDate(row.updated_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/?id=${row.id}`}
                      className="text-xs font-semibold text-[#1A1A1A] hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-md transition"
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(row)}
                      disabled={busy}
                      className="text-xs font-semibold text-gray-600 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-md transition disabled:opacity-50"
                    >
                      Duplicar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(row.id, label)}
                      disabled={busy}
                      className="text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-100 px-3 py-1.5 rounded-md transition disabled:opacity-50"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
