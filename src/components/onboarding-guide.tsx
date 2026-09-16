import { ArrowRight, Check, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { markOnboardingComplete } from "@/lib/account";

const STEPS = [
  {
    title: "Set up your school",
    text: "Open Settings and enter your school name and teacher name. Save this first so reports use the correct identity.",
  },
  {
    title: "Create the academic structure",
    text: "In Settings, create an academic year, then create the periods that belong to that year.",
  },
  {
    title: "Add your subjects",
    text: "Open Settings > Subjects and add the subjects you teach. Subjects are used when creating classes.",
  },
  {
    title: "Create classes",
    text: "Open Classes and create each class. A class is required before you can add students.",
  },
  {
    title: "Add students",
    text: "Open Students and add students to an existing class. Students cannot be created without a class.",
  },
  {
    title: "Build your teaching plan",
    text: "Use Curriculum to create units and topics, then use Planner, Assignments, Attendance, and Gradebook as your daily workflow.",
  },
] as const;

export function OnboardingGuide({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  const finish = async () => {
    try {
      await markOnboardingComplete();
    } finally {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/55 px-4 py-6">
      <div className="w-full max-w-lg rounded-xl bg-background p-6 shadow-2xl ring-1 ring-border sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
              Getting started
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Your TeacherHub setup path</h2>
          </div>
          <button
            type="button"
            onClick={() => void finish()}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close guide"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-6 flex gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((item, index) => (
            <div
              key={item.title}
              className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
        <div className="mt-8 min-h-36">
          <div className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
            {step === STEPS.length - 1 ? (
              <Check className="size-5" />
            ) : (
              <span className="font-display text-lg font-semibold">{step + 1}</span>
            )}
          </div>
          <h3 className="mt-5 text-xl font-semibold">{current.title}</h3>
          <p className="mt-2 leading-7 text-muted-foreground">{current.text}</p>
        </div>
        <div className="mt-8 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => void finish()}>
            Skip guide
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((value) => value + 1)}>
              Next <ArrowRight className="ml-2 size-4" />
            </Button>
          ) : (
            <Button onClick={() => void finish()}>
              Finish setup guide <Check className="ml-2 size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
