import { Download, ExternalLink, FileText, Loader2, Presentation } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import type { TopicSlide } from "@/lib/types";

declare global {
  interface Window {
    desktopApp?: {
      isElectron: boolean;
      openPresentation: (url: string, fileName: string) => Promise<void>;
    };
  }
}

interface TopicSlideViewerProps {
  slide: TopicSlide | null;
  topicTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function isPowerPoint(slide: TopicSlide) {
  return slide.mime_type.includes("powerpoint") || /\.(pptx?|ppsx?)$/i.test(slide.file_name);
}

export function TopicSlideViewer({ slide, topicTitle, open, onOpenChange }: TopicSlideViewerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [openingPresentation, setOpeningPresentation] = useState(false);

  useEffect(() => {
    if (!open || !slide) {
      setSignedUrl(null);
      return;
    }

    let active = true;
    setLoading(true);
    void supabase.storage
      .from("topic-slides")
      .createSignedUrl(slide.storage_path, 60 * 60)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) return;
        setSignedUrl(data.signedUrl);
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [open, slide]);

  useEffect(() => {
    if (!open || !signedUrl || !slide || !isPowerPoint(slide) || !window.desktopApp?.isElectron) {
      return;
    }

    let active = true;
    setOpeningPresentation(true);
    void window.desktopApp
      .openPresentation(signedUrl, slide.file_name)
      .then(() => active && onOpenChange(false))
      .catch(() => undefined)
      .finally(() => active && setOpeningPresentation(false));

    return () => {
      active = false;
    };
  }, [open, onOpenChange, signedUrl, slide]);

  const openInPresentationApp = async () => {
    if (!signedUrl || !slide) return;

    if (!window.desktopApp?.isElectron) {
      window.open(signedUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setOpeningPresentation(true);
    try {
      await window.desktopApp.openPresentation(signedUrl, slide.file_name);
    } finally {
      setOpeningPresentation(false);
    }
  };

  const frameUrl =
    signedUrl && slide && isPowerPoint(slide)
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(signedUrl)}`
      : signedUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[100dvh] max-h-[100dvh] w-screen max-w-none gap-2 overflow-hidden border-0 bg-slate-950 p-2 text-white shadow-2xl sm:h-[min(92vh,900px)] sm:max-h-[92vh] sm:w-[min(96vw,1400px)] sm:gap-3 sm:rounded-xl sm:p-3">
        <DialogHeader className="relative flex-col items-stretch gap-2 pr-0 text-left sm:flex-row sm:items-center sm:justify-between sm:pr-10">
          <div className="min-w-0 pr-20 sm:pr-0">
            <DialogTitle className="flex items-center gap-2 truncate text-white">
              <Presentation className="size-5 shrink-0 text-cyan-300" />
              {topicTitle}
            </DialogTitle>
            <DialogDescription className="truncate text-slate-400">
              {slide?.file_name}
            </DialogDescription>
          </div>
          {signedUrl ? (
            <div className="absolute right-0 top-0 flex shrink-0 gap-1 sm:static">
              <Button
                asChild
                size="icon"
                variant="ghost"
                className="text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <a href={signedUrl} download={slide?.file_name} aria-label="Download slides">
                  <Download />
                </a>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-slate-300 hover:bg-white/10 hover:text-white"
                onClick={() => void openInPresentationApp().catch(() => undefined)}
                disabled={openingPresentation}
                aria-label="Open slides in presentation app"
                title="Open slides in presentation app"
              >
                {openingPresentation ? <Loader2 className="animate-spin" /> : <ExternalLink />}
              </Button>
            </div>
          ) : null}
        </DialogHeader>
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-md bg-slate-900 ring-1 ring-white/10 sm:rounded-lg">
          {loading ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-400">
              <Loader2 className="size-5 animate-spin" /> Preparing presentation...
            </div>
          ) : frameUrl ? (
            <iframe
              title={`${topicTitle} slides`}
              src={frameUrl}
              className="h-full w-full border-0 bg-white"
              allow="fullscreen"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-slate-400">
              <FileText className="size-10 text-cyan-300" />
              <p>That slide file could not be previewed.</p>
              {signedUrl ? (
                <Button asChild variant="secondary">
                  <a href={signedUrl} download={slide?.file_name}>
                    Download file
                  </a>
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
