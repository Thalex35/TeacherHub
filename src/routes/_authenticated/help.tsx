import { createFileRoute } from "@tanstack/react-router";
import { Bug, CircleHelp, ExternalLink, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { createSupportRequest } from "@/lib/account";

export const Route = createFileRoute("/_authenticated/help")({
  ssr: false,
  head: () => ({ meta: [{ title: "Help & Support — TeacherHub" }] }),
  component: HelpPage,
});

const FAQS = [
  ["How do I add students?", "Open Students from the navigation, then choose Add student. You can also import a spreadsheet from the student list."],
  ["How do I create a class?", "Open Classes, choose Add class, and complete the class details. Classes can then be used throughout your curriculum and gradebook."],
  ["How do I change my language or theme?", "Open your profile, select Preferences, then choose a language or theme. Your choice applies immediately and is saved for your workspace."],
  ["Why can’t I access a feature?", "Some features depend on your account approval, workspace limits, or the classes and students assigned to your account. Contact support if something looks incorrect."],
  ["How do I delete my account?", "Open your profile, go to Security, and choose Delete account. This permanently removes your account and workspace data."],
] as const;

function HelpPage() {
  const [bug, setBug] = useState({ subject: "", description: "" });
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const submitBug = async () => {
    if (bug.subject.trim().length < 2 || bug.description.trim().length < 2) {
      toast.error("Please add a short title and describe the problem.");
      return;
    }
    if (screenshot && (!screenshot.type.startsWith("image/") || screenshot.size > 5 * 1024 * 1024)) {
      toast.error("Please choose an image smaller than 5 MB.");
      return;
    }
    setSending(true);
    try {
      await createSupportRequest({ subject: `Bug report: ${bug.subject.trim()}`, message: bug.description.trim(), screenshot });
      setBug({ subject: "", description: "" });
      setScreenshot(null);
      toast.success("Bug report sent to the TeacherHub team.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send bug report.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">TeacherHub</p>
        <h1 className="mt-2 text-3xl font-bold">Help & support</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Find quick answers or send the support team a detailed bug report.</p>
      </header>

      <section id="faq" className="surface p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <CircleHelp className="mt-1 size-5 text-primary" />
          <div><h2 className="text-xl font-semibold">Frequently asked questions</h2><p className="mt-1 text-sm text-muted-foreground">Quick answers to common TeacherHub questions.</p></div>
        </div>
        <Accordion type="single" collapsible className="mt-6">
          {FAQS.map(([question, answer], index) => <AccordionItem key={question} value={`question-${index}`}><AccordionTrigger>{question}</AccordionTrigger><AccordionContent className="max-w-3xl leading-6 text-muted-foreground">{answer}</AccordionContent></AccordionItem>)}
        </Accordion>
      </section>

      <section id="bug" className="surface p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <Bug className="mt-1 size-5 text-primary" />
          <div><h2 className="text-xl font-semibold">Report a bug</h2><p className="mt-1 text-sm text-muted-foreground">Tell us what happened. Your report goes directly to the admin support inbox.</p></div>
        </div>
        <div className="mt-6 grid gap-5 md:max-w-2xl">
          <div className="space-y-2"><Label htmlFor="bug-subject">Short title</Label><Input id="bug-subject" value={bug.subject} onChange={(event) => setBug({ ...bug, subject: event.target.value })} placeholder="Example: Grades are not saving" /></div>
          <div className="space-y-2"><Label htmlFor="bug-description">What went wrong?</Label><Textarea id="bug-description" value={bug.description} onChange={(event) => setBug({ ...bug, description: event.target.value })} placeholder="Include the steps that caused the problem and what you expected to happen." rows={6} /></div>
          <div className="space-y-2"><Label htmlFor="bug-screenshot">Screenshot (optional)</Label><Input id="bug-screenshot" type="file" accept="image/*" onChange={(event) => setScreenshot(event.target.files?.[0] ?? null)} /><p className="text-xs text-muted-foreground">Image files up to 5 MB.</p></div>
          <Button className="w-fit" onClick={() => void submitBug()} disabled={sending}><Send className="mr-2 size-4" />{sending ? "Sending..." : "Send bug report"}</Button>
        </div>
      </section>

      <p className="text-sm text-muted-foreground">Need something else? Use the <a className="font-medium text-primary underline" href="mailto:support@teacherhub.com">support email <ExternalLink className="inline size-3" /></a>.</p>
    </div>
  );
}
