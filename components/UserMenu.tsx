"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UserMenu() {
  const [email, setEmail] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (!email) return null;

  return (
    <div className="ml-auto flex items-center gap-3">
      <span className="text-xs text-gray-500 hidden sm:inline">{email}</span>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="text-xs font-semibold text-gray-500 hover:text-gray-800 disabled:opacity-50 transition px-3 py-1.5 rounded-md border border-gray-200 hover:border-gray-300"
      >
        {loggingOut ? "Saindo..." : "Sair"}
      </button>
    </div>
  );
}
