import { Megaphone } from "lucide-react";
import type { FeaturedAnnouncement } from "../types";

interface HomeAnnouncementBannerProps {
  announcement: FeaturedAnnouncement;
}

export function HomeAnnouncementBanner({
  announcement,
}: HomeAnnouncementBannerProps) {
  return (
    <section className="border-b border-emerald-100 bg-emerald-50/70">
      <div className="container mx-auto max-w-5xl px-4 py-3">
        <div className="flex items-start gap-3 text-left">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
            {announcement.iconEmoji ? (
              <span aria-hidden>{announcement.iconEmoji}</span>
            ) : (
              <Megaphone size={16} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
              {announcement.type || "Comunicado"}
            </p>
            <h2 className="mt-0.5 text-sm font-black uppercase leading-tight text-slate-900">
              {announcement.title}
            </h2>
            <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-slate-600">
              {announcement.content}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
