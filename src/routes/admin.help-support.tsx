import { createFileRoute } from "@tanstack/react-router";
import { Check, Clock3, Headphones, Image as ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { listSupportRequests, updateSupportRequestStatus, type SupportRequest } from "@/lib/account";
import { PageIntro } from "./admin.index";

export const Route = createFileRoute("/admin/help-support")({
  ssr: false,
  component: HelpSupportPage,
});

function HelpSupportPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setRequests(await listSupportRequests());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load support requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const changeStatus = async (request: SupportRequest, status: SupportRequest["status"]) => {
    try {
      await updateSupportRequestStatus(request.id, status);
      setRequests((current) => current.map((item) => item.id === request.id ? { ...item, status } : item));
      toast.success("Support request updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update support request.");
    }
  };

  return <div>
    <PageIntro title="Help & support" description="Review teacher questions, messages, and attached screenshots." />
    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      <Summary icon={Headphones} label="Total requests" value={requests.length} />
      <Summary icon={Clock3} label="Open" value={requests.filter((request) => request.status === "open").length} />
      <Summary icon={Check} label="Resolved" value={requests.filter((request) => request.status === "resolved").length} />
    </div>
    <section className="admin-card admin-card--plain mt-6 overflow-hidden">
      {loading ? <p className="p-6 text-sm text-muted-foreground">Loading support requests...</p> : requests.length === 0 ? <div className="p-12 text-center"><Headphones className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-medium">No support requests</p><p className="mt-1 text-sm text-muted-foreground">Teacher messages will appear here.</p></div> : <div className="divide-y divide-border">{requests.map((request) => <article key={request.id} className="p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{request.subject}</h2><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium capitalize text-amber-800">{request.status.replace("_", " ")}</span></div><p className="mt-2 text-sm text-muted-foreground">From {request.requester_name || request.requester_email || "Teacher"} · {new Date(request.created_at).toLocaleString()}</p></div><Headphones className="size-5 text-primary" /></div><p className="mt-5 whitespace-pre-wrap text-sm leading-6">{request.message}</p>{request.screenshot_url ? <a className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary underline" href={request.screenshot_url} target="_blank" rel="noreferrer"><ImageIcon className="size-4" />View attached screenshot</a> : null}<div className="mt-5 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => void changeStatus(request, "in_progress")}>In progress</Button><Button size="sm" onClick={() => void changeStatus(request, "resolved")}><Check className="mr-1 size-4" />Resolve</Button></div></article>)}</div>}
    </section>
  </div>;
}

function Summary({ icon: Icon, label, value }: { icon: typeof Headphones; label: string; value: number }) {
  return <div className="admin-card admin-card--sky flex items-center gap-4 p-5"><Icon className="size-5 text-primary" /><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div></div>;
}