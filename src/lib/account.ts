import { supabase } from "@/integrations/supabase/client";

export type AccountProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "user";
  account_status: "pending" | "approved" | "rejected" | "suspended";
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
};

const profiles = () => supabase.from("profiles" as never);

export async function getAccountProfile(userId: string) {
  const { data, error } = await profiles().select("*").eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as AccountProfile | null) ?? null;
}

export async function listAccountProfiles() {
  const { data, error } = await profiles().select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as AccountProfile[];
}

export async function updateAccountStatus(
  id: string,
  accountStatus: AccountProfile["account_status"],
  approvedBy: string,
) {
  const { error } = await profiles()
    .update({
      account_status: accountStatus,
      approved_at: accountStatus === "approved" ? new Date().toISOString() : null,
      approved_by: accountStatus === "approved" ? approvedBy : null,
    } as never)
    .eq("id", id);
  if (error) throw new Error(error.message);
}
