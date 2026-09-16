import { createFileRoute } from "@tanstack/react-router";
import { Check, Clock3, Lightbulb, MessageSquare, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { listFeatureRequests, updateFeatureRequestStatus, type FeatureRequest } from "@/lib/account";
import { PageIntro } from "./admin.index";

export const Route = createFileRoute("/admin/feature-requests")({
  ssr: false,
  component: FeatureRequestsPage,
});

function FeatureRequestsPage() {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [filter, setFilter] = useState<FeatureRequest["status"] | "all">("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setRequests(await listFeatureRequests());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load feature requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const changeStatus = async (request: FeatureRequest, status: FeatureRequest["status"]) => {
    try {
      await updateFeatureRequestStatus(request.id, status);
      setRequests((current) => current.map((item) => item.id === request.id ? { ...item, status } : item));
      toast.success("Feature request updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update request.");
    }
  };

  const visible = filter === "all" ? requests : requests.filter((request) => request.status === filter);
  const openCount = requests.filter((request) => request.status === "open").length;

  return (
    <div>
      <PageIntro title="Feature requests" description="Read ideas submitted by teachers and track their progress." />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Summary icon={Lightbulb} label="Total requests" value={requests.length} />
        <Summary icon={Clock3} label="Needs review" value={openCount} tone="warning" />
        <Summary icon={Check} label="Completed" value={requests.filter((request) => request.status === "completed").length} tone="success" />
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        {(["all", "open", "planned", "completed", "declined"] as const).map((value) => <Button key={value} size="sm" variant={filter === value ? "default" : "outline"} onClick={() => setFilter(value)} className="capitalize">{value === "all" ? "All requests" : value}</Button>)}
      </div>
      <section className="admin-card admin-card--plain mt-6 overflow-hidden">
        {loading ? <p className="p-6 text-sm text-muted-foreground">Loading feature requests...</p> : visible.length === 0 ? <div className="p-12 text-center"><MessageSquare className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-medium">No feature requests</p><p className="mt-1 text-sm text-muted-foreground">Submitted ideas will appear here.</p></div> : <div className="divide-y divide-border">{visible.map((request) => <article key={request.id} className="p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{request.subject}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${request.priority === "high" ? "bg-red-100 text-red-700" : request.priority === "low" ? "bg-slate-100 text-slate-700" : "bg-amber-100 text-amber-800"}`}>{request.priority} priority</span><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium capitalize text-emerald-800">{request.status}</span></div><p className="mt-2 text-sm text-muted-foreground">From {request.requester_name || request.requester_email || "Teacher"} · {new Date(request.created_at).toLocaleString()}</p></div><Lightbulb className="size-5 text-primary" /></div><p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-foreground">{request.description}</p><div className="mt-5 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => void changeStatus(request, "planned")}>Plan</Button><Button size="sm" onClick={() => void changeStatus(request, "completed")}><Check className="mr-1 size-4" />Complete</Button><Button size="sm" variant="ghost" onClick={() => void changeStatus(request, "declined")}><X className="mr-1 size-4" />Decline</Button></div></article>)}</div>}
      </section>
    </div>
  );
}

function Summary({ icon: Icon, label, value, tone = "default" }: { icon: typeof Lightbulb; label: string; value: number; tone?: "default" | "warning" | "success" }) {
  const background = tone === "warning" ? "admin-card--peach" : tone === "success" ? "admin-card--mint" : "admin-card--sky";
  return <div className={`admin-card ${background} flex items-center gap-4 p-5`}><Icon className="size-5 text-primary" /><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div></div>;
}
