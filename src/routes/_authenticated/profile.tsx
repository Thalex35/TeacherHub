import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  KeyRound,
  LogOut,
  Mail,
  Trash2,
  UserCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { createFeatureRequest, deleteMyAccount, listMyLoginHistory, updateAccountName, type LoginHistoryEntry } from "@/lib/account";
import { setLanguage, useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/profile")({
  ssr: false,
  head: () => ({ meta: [{ title: "Profile — TeacherHub" }] }),
  component: ProfilePage,
});

type Theme = "light" | "dark" | "system";
type Language = "en" | "fr" | "ht";
type DateFormat = "us" | "eu" | "iso";

function ProfilePage() {
  const { profile, user } = Route.useRouteContext();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("teacherhub-theme") as Theme) || "system");
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem("teacherhub-language") as Language) || "en");
  const [dateFormat, setDateFormat] = useState<DateFormat>(() => (localStorage.getItem("teacherhub-date-format") as DateFormat) || "us");
  const [rememberSidebar, setRememberSidebar] = useState(() => localStorage.getItem("teacherhub-remember-sidebar") !== "false");
  const [defaultView, setDefaultView] = useState(() => localStorage.getItem("teacherhub-default-view") || "/dashboard");
  const [emailNotifications, setEmailNotifications] = useState(() => localStorage.getItem("teacherhub-email-notifications") !== "false");
  const [notificationTypes, setNotificationTypes] = useState(() => localStorage.getItem("teacherhub-notification-types") || "submissions,grades,messages,announcements,system");
  const [frequency, setFrequency] = useState(() => localStorage.getItem("teacherhub-notification-frequency") || "instant");
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [showPasswords, setShowPasswords] = useState(false);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deletePassword, setDeletePassword] = useState("");
  const [history, setHistory] = useState<LoginHistoryEntry[]>([]);
  const [featureRequest, setFeatureRequest] = useState({ subject: "", description: "", priority: "medium" as "low" | "medium" | "high" });
  const [featureSaving, setFeatureSaving] = useState(false);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    setLanguage(language);
  }, [language]);

  useEffect(() => {
    void listMyLoginHistory().then(setHistory).catch(() => setHistory([]));
  }, []);

  const saveIdentity = async (field: "name" | "email") => {
    setSaving(true);
    try {
      if (field === "name") {
        if (fullName.trim().length < 2) throw new Error("Full name must be at least 2 characters.");
        await updateAccountName(fullName);
      } else {
        if (!email.includes("@")) throw new Error("Enter a valid email address.");
        const { error } = await supabase.auth.updateUser({ email: email.trim() });
        if (error) throw error;
        toast.success("Verification email sent to your new address.");
        setSaving(false);
        return;
      }
      toast.success("Changes saved successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async () => {
    if (passwords.next.length < 8 || !/[A-Z]/.test(passwords.next) || !/[0-9]/.test(passwords.next) || !/[^A-Za-z0-9]/.test(passwords.next)) {
      toast.error("Password must be 8+ characters with an uppercase letter, number, and special character.");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({ email: user.email ?? "", password: passwords.current });
      if (verifyError) throw new Error("Current password is incorrect.");
      const { error } = await supabase.auth.updateUser({ password: passwords.next });
      if (error) throw error;
      setPasswords({ current: "", next: "", confirm: "" });
      toast.success("Changes saved successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update password.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: user.email ?? "", password: deletePassword });
      if (error) throw new Error("Password verification failed.");
      await deleteMyAccount();
      await supabase.auth.signOut();
      void navigate({ to: "/auth" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete account.");
      setSaving(false);
    }
  };

  const persistPreference = (key: string, value: string) => localStorage.setItem(key, value);
  const toggleNotificationType = (type: string) => {
    const values = new Set(notificationTypes.split(",").filter(Boolean));
    values.has(type) ? values.delete(type) : values.add(type);
    const next = [...values].join(",");
    setNotificationTypes(next);
    persistPreference("teacherhub-notification-types", next);
  };

  const submitFeatureRequest = async () => {
    if (featureRequest.subject.trim().length < 2 || featureRequest.description.trim().length < 2) {
      toast.error("Please add a subject and describe your feature request.");
      return;
    }
    setFeatureSaving(true);
    try {
      await createFeatureRequest(featureRequest);
      setFeatureRequest({ subject: "", description: "", priority: "medium" });
      toast.success("Feature request submitted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit feature request.");
    } finally {
      setFeatureSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div><p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">TeacherHub</p><h1 className="mt-2 text-3xl font-bold">Profile</h1><p className="mt-2 text-sm text-muted-foreground">Manage your identity, security, preferences, and support options.</p></div>
        <div className="hidden rounded-xl border border-border bg-card px-4 py-3 text-right sm:block"><UserCircle className="ml-auto size-6 text-primary" /><p className="mt-1 text-sm font-semibold">{profile.full_name || "Teacher"}</p><p className="text-xs capitalize text-muted-foreground">{profile.role === "admin" ? t("admin") : "Teacher"}</p></div>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4"><TabsTrigger value="account">{t("account")}</TabsTrigger><TabsTrigger value="security">{t("security")}</TabsTrigger><TabsTrigger value="preferences">{t("preferences")}</TabsTrigger><TabsTrigger value="help">{t("helpSupport")}</TabsTrigger></TabsList>

        <TabsContent value="account"><section className="surface p-6"><SectionTitle icon={UserCircle} title="Account & identity" description="Keep your TeacherHub identity up to date." /><div className="mt-6 grid gap-6 md:grid-cols-2"><Field label="Full name" value={fullName} onChange={setFullName} required /><ReadOnly label="Role" value={profile.role === "admin" ? "Admin" : "Teacher"} /></div><div className="mt-6 flex flex-wrap gap-3"><Button onClick={() => void saveIdentity("name")} disabled={saving}>Save name</Button><span className="self-center text-xs text-muted-foreground">Changes saved securely to your account.</span></div><div className="mt-8 border-t border-border pt-6"><Field label="Email address" type="email" value={email} onChange={setEmail} required /><p className="mt-2 text-xs text-muted-foreground">A verification email will be sent when you change this address.</p><Button className="mt-4" variant="outline" onClick={() => void saveIdentity("email")} disabled={saving}><Mail className="mr-2 size-4" />Update email</Button></div></section></TabsContent>

        <TabsContent value="security"><div className="space-y-6"><section className="surface p-6"><SectionTitle icon={KeyRound} title="Security" description="Use a strong password to protect your workspace." /><div className="mt-6 grid gap-4 md:max-w-xl"><PasswordField label="Current password" value={passwords.current} onChange={(value) => setPasswords({ ...passwords, current: value })} visible={showPasswords} /><PasswordField label="New password" value={passwords.next} onChange={(value) => setPasswords({ ...passwords, next: value })} visible={showPasswords} /><PasswordField label="Confirm new password" value={passwords.confirm} onChange={(value) => setPasswords({ ...passwords, confirm: value })} visible={showPasswords} /><div className="flex items-center justify-between"><PasswordStrength value={passwords.next} /><button type="button" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground" onClick={() => setShowPasswords(!showPasswords)}>{showPasswords ? <EyeOff className="size-4" /> : <Eye className="size-4" />} {showPasswords ? "Hide" : "Show"} passwords</button></div><Button className="w-fit" onClick={() => void updatePassword()} disabled={saving}>Update password</Button></div></section><section className="rounded-xl border border-red-200 bg-red-50 p-6"><div className="flex gap-3"><AlertTriangle className="size-5 shrink-0 text-red-600" /><div><h2 className="font-semibold text-red-900">Delete account</h2><p className="mt-1 text-sm text-red-800">All your data, classes, and student records will be deleted.</p><Button variant="destructive" className="mt-4" onClick={() => setDeleteStep(1)}><Trash2 className="mr-2 size-4" />Delete Account</Button></div></div></section><section className="surface p-6"><SectionTitle icon={LogOut} title="Logout" description="End your current TeacherHub session." /><Button variant="outline" className="mt-5" onClick={async () => { await supabase.auth.signOut(); void navigate({ to: "/auth" }); }}><LogOut className="mr-2 size-4" />Logout</Button></section></div></TabsContent>

        <TabsContent value="preferences"><div className="space-y-6"><section className="surface p-6"><SectionTitle title="Display & UI preferences" description="Personalize how TeacherHub feels and behaves." /><div className="mt-6 grid gap-6 md:grid-cols-2"><PreferenceChoice label="Theme" value={theme} options={["light", "dark", "system"]} onChange={(value) => { setTheme(value as Theme); persistPreference("teacherhub-theme", value); }} /><PreferenceChoice label="Date format" value={dateFormat} options={["us", "eu", "iso"]} onChange={(value) => { setDateFormat(value as DateFormat); persistPreference("teacherhub-date-format", value); }} /><div className="space-y-2"><Label>Language</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={language} onChange={(event) => setLanguage(event.target.value as Language)}><option value="en">English</option><option value="fr">Français</option><option value="ht">Kreyòl Ayisyen</option></select><p className="text-xs text-muted-foreground">Applied immediately. Example date: {dateFormat === "iso" ? "2024-09-16" : dateFormat === "eu" ? "16/09/2024" : "09/16/2024"}</p></div><div className="flex items-center justify-between rounded-lg border border-border p-4"><div><Label>Remember sidebar state</Label><p className="mt-1 text-xs text-muted-foreground">Keep your navigation preference between sessions.</p></div><Switch checked={rememberSidebar} onCheckedChange={(value) => { setRememberSidebar(value); persistPreference("teacherhub-remember-sidebar", String(value)); }} /></div><div className="space-y-2"><Label>Default dashboard view</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={defaultView} onChange={(event) => { setDefaultView(event.target.value); persistPreference("teacherhub-default-view", event.target.value); }}><option value="/dashboard">Dashboard</option><option value="/students">Students</option><option value="/classes">Classes</option><option value="/calendar">Calendar</option><option value="/curriculum">Curriculum</option><option value="/planner">Planner</option></select></div></div></section><section className="surface p-6"><SectionTitle title="Notifications preferences" description="Choose which email updates you receive." /><div className="mt-6 flex items-center justify-between border-b border-border pb-5"><div><Label>Receive email notifications</Label><p className="mt-1 text-xs text-muted-foreground">Keep up with important workspace activity.</p></div><Switch checked={emailNotifications} onCheckedChange={(value) => { setEmailNotifications(value); persistPreference("teacherhub-email-notifications", String(value)); }} /></div>{emailNotifications ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{[["submissions", "Student submissions"], ["grades", "Grades posted"], ["messages", "Messages/Comments"], ["announcements", "Class announcements"], ["system", "System updates"]].map(([value, label]) => <label key={value} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={notificationTypes.split(",").includes(value)} onChange={() => toggleNotificationType(value)} className="size-4 accent-emerald-500" />{label}</label>)}</div> : null}<div className="mt-6 space-y-3"><Label>Notification frequency</Label>{[["instant", "Instant (as it happens)"], ["daily", "Daily digest (one email per day)"], ["weekly", "Weekly digest (one email per week)"]].map(([value, label]) => <label key={value} className="flex items-center gap-3 text-sm"><input type="radio" name="frequency" checked={frequency === value} onChange={() => { setFrequency(value); persistPreference("teacherhub-notification-frequency", value); }} className="accent-emerald-500" />{label}</label>)}</div></section></div></TabsContent>

        <TabsContent value="help"><div className="grid gap-6 lg:grid-cols-2"><section className="surface p-6"><SectionTitle title="Help & support" description="Get help or share feedback with the TeacherHub team." /><div className="mt-6 flex flex-wrap gap-3"><Button variant="outline" asChild><a href="https://help.teacherhub.com" target="_blank" rel="noreferrer">Visit Help Center <ExternalLink className="ml-2 size-4" /></a></Button><Button variant="outline" asChild><a href="https://github.com/teacherhub/teacherhub/issues" target="_blank" rel="noreferrer">Report a Bug <ExternalLink className="ml-2 size-4" /></a></Button><Button variant="outline" asChild><a href="https://help.teacherhub.com/faq" target="_blank" rel="noreferrer">Frequently Asked Questions <ExternalLink className="ml-2 size-4" /></a></Button></div><div className="mt-8 space-y-4"><Field label="Subject" value="" onChange={() => undefined} placeholder="How can we help?" /><div className="space-y-2"><Label>Message</Label><Textarea placeholder="Describe your question or issue..." /></div><Label className="block">Screenshot (optional)<Input type="file" className="mt-2" /></Label><Button onClick={() => toast.success("Your message sent! We'll reply within 24 hours.")}>Send to Support</Button></div></section><section className="surface p-6"><SectionTitle title="Request a feature" description="Tell us what would make TeacherHub better." /><div className="mt-6 space-y-4"><div className="space-y-2"><Label>Subject</Label><Input value={featureRequest.subject} onChange={(event) => setFeatureRequest({ ...featureRequest, subject: event.target.value })} placeholder="Feature title" /></div><div className="space-y-2"><Label>Description</Label><Textarea value={featureRequest.description} onChange={(event) => setFeatureRequest({ ...featureRequest, description: event.target.value })} placeholder="Describe the feature you need..." /></div><div className="space-y-2"><Label>Priority</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={featureRequest.priority} onChange={(event) => setFeatureRequest({ ...featureRequest, priority: event.target.value as "low" | "medium" | "high" })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div><Button onClick={() => void submitFeatureRequest()} disabled={featureSaving}>{featureSaving ? "Submitting..." : "Submit Feature Request"}</Button></div></section><section className="surface p-6 lg:col-span-2"><SectionTitle title="Login history" description="Your last 10 successful sign-ins." /><div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-3">Date/Time</th><th className="px-3 py-3">Device/Browser</th><th className="px-3 py-3">IP address</th><th className="px-3 py-3">Location</th></tr></thead><tbody className="divide-y divide-border">{history.map((entry) => <tr key={entry.id}><td className="px-3 py-3">{formatLoginDate(entry.created_at)}</td><td className="px-3 py-3">Current browser</td><td className="px-3 py-3 text-muted-foreground">Not available</td><td className="px-3 py-3 text-muted-foreground">Not available</td></tr>)}</tbody></table>{history.length === 0 ? <p className="py-5 text-sm text-muted-foreground">No login history available yet.</p> : null}</div></section></div></TabsContent>
      </Tabs>
      <p className="mt-8 text-center text-xs text-muted-foreground">TeacherHub v2.0.1 (Build: 2024.09.16)</p>

      <Dialog open={deleteStep > 0} onOpenChange={(open) => !open && setDeleteStep(0)}><DialogContent>{deleteStep === 1 ? <><DialogHeader><DialogTitle>Are you sure?</DialogTitle><DialogDescription>This action is permanent. All your data, classes, and student records will be deleted.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteStep(0)}>Cancel</Button><Button variant="destructive" onClick={() => setDeleteStep(2)}>Continue</Button></DialogFooter></> : <><DialogHeader><DialogTitle>Verify account deletion</DialogTitle><DialogDescription>Enter your current password to permanently delete your account.</DialogDescription></DialogHeader><Input type="password" placeholder="Current password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} /><DialogFooter><Button variant="outline" onClick={() => setDeleteStep(0)}>Cancel</Button><Button variant="destructive" disabled={!deletePassword || saving} onClick={() => void confirmDelete()}>{saving ? "Deleting..." : "Delete permanently"}</Button></DialogFooter></>}</DialogContent></Dialog>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, description }: { icon?: typeof UserCircle; title: string; description: string }) { return <div className="flex gap-3">{Icon ? <Icon className="mt-0.5 size-5 text-primary" /> : null}<div><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div></div>; }
function Field({ label, value, onChange, type = "text", placeholder, required }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean }) { return <div className="space-y-2"><Label>{label}{required ? " *" : ""}</Label><Input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} /></div>; }
function ReadOnly({ label, value }: { label: string; value: string }) { return <div className="space-y-2"><Label>{label}</Label><Input value={value} readOnly className="bg-muted" /></div>; }
function PasswordField({ label, value, onChange, visible }: { label: string; value: string; onChange: (value: string) => void; visible: boolean }) { return <div className="space-y-2"><Label>{label}</Label><Input type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} /></div>; }
function PasswordStrength({ value }: { value: string }) { const score = [value.length >= 8, /[A-Z]/.test(value), /[0-9]/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length; const label = score < 2 ? "Weak" : score < 4 ? "Fair" : "Strong"; return <p className={`text-xs font-medium ${score < 2 ? "text-red-600" : score < 4 ? "text-amber-600" : "text-emerald-600"}`}>Password strength: {label}</p>; }
function PreferenceChoice({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <fieldset className="space-y-3"><legend className="text-sm font-semibold">{label}</legend>{options.map((option) => <label key={option} className="flex items-center gap-3 text-sm capitalize"><input type="radio" name={label} checked={value === option} onChange={() => onChange(option)} className="accent-emerald-500" />{option}</label>)}</fieldset>; }
function formatLoginDate(value: string) { return new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).replace(",", " at"); }
function applyTheme(theme: Theme) { const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches); document.documentElement.classList.toggle("dark", dark); }
