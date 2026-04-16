import Link from "next/link";
import ProposalList from "@/components/ProposalList";
import UserMenu from "@/components/UserMenu";

export const dynamic = "force-dynamic";

export default function PropostasPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 shadow-sm">
        <div className="bg-[#1A1A1A] rounded-md px-3 py-1.5 flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Tech Estrutural" className="h-7 w-auto" />
        </div>
        <div className="h-6 w-px bg-gray-200" />
        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Histórico de Propostas
        </span>
        <UserMenu />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">Propostas</h1>
          <Link
            href="/"
            className="bg-[#7BAF7A] hover:bg-[#6a9e69] text-white font-semibold px-4 py-2 rounded-xl text-sm transition"
          >
            + Nova proposta
          </Link>
        </div>

        <ProposalList />
      </div>
    </div>
  );
}
