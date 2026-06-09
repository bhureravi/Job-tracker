"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function AuthActions() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      setSignedIn(!!data.user);
      setLoading(false);
    };

    load();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  if (loading) return null;

  if (!signedIn) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link href="/sign-in" className="rounded-xl border px-4 py-2 hover:bg-muted">
          Sign In
        </Link>
        <Link href="/sign-up" className="rounded-xl bg-black px-4 py-2 text-white">
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-xl border px-4 py-2 text-sm hover:bg-muted"
    >
      Sign Out
    </button>
  );
}