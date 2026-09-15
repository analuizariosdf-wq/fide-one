"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { toInitials } from "@/lib/utils";

export interface CurrentProfile {
  name: string;
  email: string;
  initials: string;
  roleName: string | null;
}

/** Loads the signed-in user's profile (+ role name) for display in the Header. */
export function useCurrentProfile() {
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (active) setLoading(false);
        return;
      }

      const { data: profileRow } = await supabase
        .from("profiles")
        .select("name, email, role_id")
        .eq("id", user.id)
        .single();

      if (!active) return;

      if (profileRow) {
        let roleName: string | null = null;

        if (profileRow.role_id) {
          const { data: roleRow } = await supabase
            .from("roles")
            .select("name")
            .eq("id", profileRow.role_id)
            .single();
          roleName = roleRow?.name ?? null;
        }

        if (!active) return;

        setProfile({
          name: profileRow.name,
          email: profileRow.email,
          initials: toInitials(profileRow.name),
          roleName,
        });
      }
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return { profile, loading };
}
