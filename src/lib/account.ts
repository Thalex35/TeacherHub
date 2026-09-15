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
  max_students: number;
  max_classes: number;
  max_storage_bytes: number;
};

export type AccountUsage = {
  user_id: string;
  students_count: number;
  classes_count: number;
  storage_bytes: number;
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

export async function listAccountUsage() {
  const { data, error } = await supabase.rpc("admin_account_usage" as never);
  if (error) throw new Error(error.message);
  return (data ?? []) as AccountUsage[];
}

export async function updateAccountLimits(
  id: string,
  limits: Pick<AccountProfile, "max_students" | "max_classes" | "max_storage_bytes">,
) {
  const { error } = await profiles()
    .update(limits as never)
    .eq("id", id);
  if (error) throw new Error(error.message);
}
