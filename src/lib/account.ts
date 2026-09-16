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
  last_seen_at: string | null;
  max_students: number;
  max_classes: number;
  max_storage_bytes: number;
  onboarding_completed_at: string | null;
};

export type AccountUsage = {
  user_id: string;
  students_count: number;
  classes_count: number;
  storage_bytes: number;
};

export type ActivitySummary = {
  active_today: number;
  active_week: number;
  logins_today: number;
  registrations_today: number;
  registrations_week: number;
};

export type RecentActivity = {
  event_id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  event_type: "login" | "app_access";
  created_at: string;
};

export type LoginHistoryEntry = {
  id: string;
  created_at: string;
  event_type: "login" | "app_access";
};

export type FeatureRequest = {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "open" | "planned" | "completed" | "declined";
  created_at: string;
  updated_at: string;
  requester_name?: string | null;
  requester_email?: string | null;
};

export type SupportRequest = {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  screenshot_path: string | null;
  status: "open" | "in_progress" | "resolved";
  created_at: string;
  updated_at: string;
  screenshot_url?: string | null;
  requester_name?: string | null;
  requester_email?: string | null;
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

export async function listMyLoginHistory() {
  const { data, error } = await supabase
    .from("activity_events" as never)
    .select("id, created_at, event_type")
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .eq("event_type", "login")
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw new Error(error.message);
  return (data ?? []) as LoginHistoryEntry[];
}

export async function updateAccountName(fullName: string) {
  const { error } = await supabase.rpc(
    "update_my_profile_name" as never,
    { next_full_name: fullName } as never,
  );
  if (error) throw new Error(error.message);
}

export async function deleteMyAccount() {
  const { error } = await supabase.rpc("delete_my_account" as never);
  if (error) throw new Error(error.message);
}

export async function createFeatureRequest(values: Pick<FeatureRequest, "subject" | "description" | "priority">) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("You must be signed in to submit a feature request.");
  const { error } = await supabase.from("feature_requests" as never).insert({
    ...values,
    user_id: user.user.id,
  } as never);
  if (error) throw new Error(error.message);
}

export async function createSupportRequest(values: { subject: string; message: string; screenshot?: File | null }) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("You must be signed in to contact support.");
  let screenshotPath: string | null = null;
  if (values.screenshot) {
    screenshotPath = `${user.user.id}/${crypto.randomUUID()}-${values.screenshot.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("support-screenshots").upload(screenshotPath, values.screenshot, { contentType: values.screenshot.type, upsert: false });
    if (error) throw new Error(error.message);
  }
  const { error } = await supabase.from("support_requests" as never).insert({ user_id: user.user.id, subject: values.subject, message: values.message, screenshot_path: screenshotPath } as never);
  if (error) throw new Error(error.message);
}

export async function listSupportRequests() {
  const { data, error } = await supabase.from("support_requests" as never).select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const profiles = await listAccountProfiles();
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  return Promise.all((data ?? []).map(async (item) => {
    const row = item as SupportRequest;
    const requester = profileById.get(row.user_id);
    const signed = row.screenshot_path ? await supabase.storage.from("support-screenshots").createSignedUrl(row.screenshot_path, 3600) : { data: null };
    return { ...row, screenshot_url: signed.data?.signedUrl ?? null, requester_name: requester?.full_name, requester_email: requester?.email };
  }));
}

export async function updateSupportRequestStatus(id: string, status: SupportRequest["status"]) {
  const { error } = await supabase.from("support_requests" as never).update({ status, updated_at: new Date().toISOString() } as never).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listFeatureRequests() {
  const { data, error } = await supabase
    .from("feature_requests" as never)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const profiles = await listAccountProfiles();
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  return (data ?? []).map((item) => {
    const row = item as FeatureRequest;
    const requester = profileById.get(row.user_id);
    return { ...row, requester_name: requester?.full_name, requester_email: requester?.email };
  });
}

export async function updateFeatureRequestStatus(id: string, status: FeatureRequest["status"]) {
  const { error } = await supabase.from("feature_requests" as never).update({ status, updated_at: new Date().toISOString() } as never).eq("id", id);
  if (error) throw new Error(error.message);
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

export async function recordActivity(eventType: "login" | "app_access") {
  const { error } = await supabase.rpc(
    "record_activity" as never,
    { activity_type: eventType } as never,
  );
  if (error) throw new Error(error.message);
}

export async function getActivitySummary() {
  const { data, error } = await supabase.rpc("admin_activity_summary" as never);
  if (error) throw new Error(error.message);
  return ((data as ActivitySummary[] | null)?.[0] ?? {
    active_today: 0,
    active_week: 0,
    logins_today: 0,
    registrations_today: 0,
    registrations_week: 0,
  }) as ActivitySummary;
}

export async function listRecentActivity() {
  const { data, error } = await supabase.rpc("admin_recent_activity" as never);
  if (error) throw new Error(error.message);
  return (data ?? []) as RecentActivity[];
}

export async function markOnboardingComplete() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  const { error } = await profiles()
    .update({ onboarding_completed_at: new Date().toISOString() } as never)
    .eq("id", data.user.id);
  if (error) throw new Error(error.message);
}
