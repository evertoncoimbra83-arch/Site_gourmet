export interface AnnouncementVisibilityInput {
  isActive?: boolean | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  createdAt?: Date | string | null;
  visibilityScope?: AnnouncementVisibilityScope | null;
  targetUserIds?: string[] | null;
}

export type AnnouncementVisibilityScope =
  | "all"
  | "authenticated"
  | "specific_users";

export interface AnnouncementViewerInput {
  userId?: string | null;
}

const toDate = (value?: Date | string | null) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function isAnnouncementVisible(
  announcement: AnnouncementVisibilityInput,
  now = new Date(),
) {
  if (!announcement.isActive) return false;

  const start = toDate(announcement.startDate);
  if (start && start > now) return false;

  const end = toDate(announcement.endDate);
  if (end && end < now) return false;

  return true;
}

export function canViewerSeeAnnouncement(
  announcement: AnnouncementVisibilityInput,
  viewer: AnnouncementViewerInput = {},
) {
  const scope = announcement.visibilityScope ?? "all";

  if (scope === "all") return true;
  if (!viewer.userId) return false;
  if (scope === "authenticated") return true;

  return announcement.targetUserIds?.includes(viewer.userId) ?? false;
}

export function selectFeaturedAnnouncement<T extends AnnouncementVisibilityInput>(
  announcements: T[],
  now = new Date(),
  viewer: AnnouncementViewerInput = {},
) {
  return [...announcements]
    .filter(
      (announcement) =>
        isAnnouncementVisible(announcement, now) &&
        canViewerSeeAnnouncement(announcement, viewer),
    )
    .sort((a, b) => {
      const bTime = toDate(b.createdAt)?.getTime() ?? 0;
      const aTime = toDate(a.createdAt)?.getTime() ?? 0;
      return bTime - aTime;
    })[0] ?? null;
}
