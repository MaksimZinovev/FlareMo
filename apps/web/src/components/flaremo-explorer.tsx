import type { Memo } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { extractTags } from "@/lib/memo";
import { cn } from "@/lib/utils";
import {
  ArchiveIcon,
  BotIcon,
  CalendarDaysIcon,
  HashIcon,
  InboxIcon,
  MessageCircleIcon,
  RefreshCcwIcon,
  RouteIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import type { ReactNode } from "react";

export type ExplorerView = "all" | "archived" | "trashed";

type FlareMoExplorerProps = {
  activeTag?: string;
  activeView: ExplorerView;
  archivedCount: number;
  memos: Memo[];
  memoCount: number;
  footer?: ReactNode;
  tags: string[];
  trashedCount: number;
  onTagChange: (tag?: string) => void;
  onViewChange: (view: ExplorerView) => void;
};

export function FlareMoExplorer({
  activeTag,
  activeView,
  archivedCount,
  footer,
  memos,
  memoCount,
  tags,
  trashedCount,
  onTagChange,
  onViewChange,
}: FlareMoExplorerProps) {
  const { t } = useI18n();
  const stats = getStats(memos);
  const activity = getActivity(memos);
  const navItems = [
    { count: memoCount, icon: InboxIcon, label: t("view.timeline"), view: "all" as const },
    { count: archivedCount, icon: ArchiveIcon, label: t("view.archive"), view: "archived" as const },
    { count: trashedCount, icon: Trash2Icon, label: t("view.trash"), view: "trashed" as const },
  ];
  const featureItems = [
    { icon: MessageCircleIcon, label: t("sidebar.wechatInput") },
    { icon: CalendarDaysIcon, label: t("sidebar.dailyReview") },
    { icon: SparklesIcon, label: t("sidebar.aiInsight") },
    { icon: BotIcon, label: t("sidebar.agent") },
    { icon: RouteIcon, label: t("sidebar.randomWalk") },
  ];

  return (
    <aside className="flex min-h-full flex-col px-3 py-4 text-sm">
      <header className="mb-5 flex items-center justify-between gap-2 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-foreground text-xs font-semibold text-background">
            F
          </div>
          <div className="truncate font-heading text-sm font-semibold">FlareMo</div>
        </div>
        <Button aria-label={t("sidebar.sync")} size="icon-sm" variant="ghost">
          <RefreshCcwIcon />
        </Button>
      </header>

      <section className="mb-4 grid grid-cols-3 gap-2 px-1">
        <StatCell label={t("explorer.records")} value={stats.total} />
        <StatCell label={t("explorer.tags")} value={stats.tags} />
        <StatCell label={t("explorer.days")} value={stats.days} />
      </section>

      <section className="mb-5 px-1">
        <div className="grid grid-cols-12 gap-1">
          {activity.map((day) => (
            <button
              aria-label={t("explorer.heatmapDay", { count: day.count, date: day.date })}
              className={cn("aspect-square rounded-[3px] transition-opacity hover:opacity-80", heatmapColor(day.count))}
              key={day.date}
              type="button"
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between px-1 text-xs text-muted-foreground">
          <span>{t("explorer.monthApr")}</span>
          <span>{t("explorer.monthMay")}</span>
          <span>{t("explorer.monthJun")}</span>
        </div>
      </section>

      <nav aria-label={t("sidebar.navigation")} className="flex flex-col gap-1">
        {navItems.map((item) => (
          <button
            className={cn(
              "flex h-9 items-center gap-3 rounded-md px-2 text-left transition-colors",
              activeView === item.view
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted",
            )}
            key={item.view}
            type="button"
            onClick={() => onViewChange(item.view)}
          >
            <item.icon />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            <span className="text-xs tabular-nums opacity-70">{item.count}</span>
          </button>
        ))}
        {featureItems.map((item) => (
          <button
            className="flex h-9 items-center gap-3 rounded-md px-2 text-left text-foreground transition-colors hover:bg-muted"
            key={item.label}
            type="button"
          >
            <item.icon />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
          </button>
        ))}
      </nav>

      <section className="mt-5 flex flex-col gap-2 px-1">
        <div className="text-xs text-muted-foreground">{t("explorer.tags")}</div>
        <div className="flex flex-wrap gap-1.5">
          {tags.length > 0 ? (
            tags.map((tag) => {
              const active = activeTag === tag;
              const count = stats.tagCounts.get(tag) ?? 0;
              return (
                <button
                  className={cn(
                    "inline-flex max-w-full items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                  key={tag}
                  type="button"
                  onClick={() => onTagChange(active ? undefined : tag)}
                >
                  <HashIcon />
                  <span className="truncate">{tag}</span>
                  {count > 1 && <Badge variant={active ? "secondary" : "outline"}>{count}</Badge>}
                </button>
              );
            })
          ) : (
            <div className="text-xs text-muted-foreground">{t("explorer.noTags")}</div>
          )}
        </div>
      </section>
      {footer && <div className="mt-auto px-1 pb-1 pt-5">{footer}</div>}
    </aside>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-heading text-2xl font-semibold leading-none tabular-nums text-muted-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function getStats(memos: Memo[]) {
  const tagCounts = new Map<string, number>();
  const days = new Set<string>();

  for (const memo of memos) {
    const tags = memo.payload.tags ?? extractTags(memo.content);
    for (const tag of tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
    const date = toDateKey(new Date(memo.display_time));
    if (date) {
      days.add(date);
    }
  }

  return {
    days: days.size,
    tagCounts,
    tags: tagCounts.size,
    total: memos.length,
  };
}

function getActivity(memos: Memo[]) {
  const counts = new Map<string, number>();
  for (const memo of memos) {
    const key = toDateKey(new Date(memo.display_time));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const today = startOfDay(new Date());
  const start = new Date(today);
  start.setDate(today.getDate() - 83);

  const days: Array<{ count: number; date: string }> = [];
  for (let index = 0; index < 84; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = toDateKey(date);
    days.push({ count: counts.get(key) ?? 0, date: key });
  }
  return days;
}

function heatmapColor(count: number) {
  if (count <= 0) return "bg-muted";
  if (count === 1) return "bg-primary/20";
  if (count === 2) return "bg-primary/40";
  if (count === 3) return "bg-primary/70";
  return "bg-primary";
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDateKey(date: Date) {
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
