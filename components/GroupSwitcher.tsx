"use client";

import { useRouter } from "next/navigation";
import { setActiveGroup } from "@/lib/active-group";
import { useLanguage } from "@/lib/language-context";
import type { Group } from "@/lib/types";

/**
 * Switch the active group. Shown only when the user is in more than one group.
 * Sets the active-group cookie and refreshes so the server re-renders the feed
 * for the chosen group.
 */
export function GroupSwitcher({
  groups,
  activeId,
}: {
  groups: Group[];
  activeId: string;
}) {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="relative inline-flex items-center">
      <select
        value={activeId}
        onChange={(e) => {
          setActiveGroup(e.target.value);
          router.refresh();
        }}
        className="appearance-none rounded-input border border-border bg-surface py-1.5 pl-3 pr-9 text-h2 font-semibold text-text focus:border-volt focus:outline-none focus:ring-2 focus:ring-volt/30"
        aria-label={t("a11y_switch_group")}
      >
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
      {/* Chevron */}
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="pointer-events-none absolute right-3 h-4 w-4 text-text-muted"
        fill="none"
      >
        <path
          d="m6 9 6 6 6-6"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
