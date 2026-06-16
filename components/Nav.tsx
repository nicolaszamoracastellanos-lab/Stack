"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/language-context";
import { type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Item = {
  href: string;
  key: TranslationKey;
  icon: (active: boolean) => React.ReactNode;
  primary?: boolean;
  match?: string; // active-state prefix override
  tour?: string; // data-tour anchor for the feature tour
};

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
      <path
        d="M3 10.5 12 3l9 7.5M5 9.5V20h5v-6h4v6h5V9.5"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GroupsIcon({ active }: { active: boolean }) {
  const w = active ? 2.2 : 1.8;
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth={w} />
      <path
        d="M3.5 19.5a5.5 5.5 0 0 1 11 0"
        stroke="currentColor"
        strokeWidth={w}
        strokeLinecap="round"
      />
      <path
        d="M16 5.2a3 3 0 0 1 0 5.6M17.5 14.2a5.5 5.5 0 0 1 3 5.3"
        stroke="currentColor"
        strokeWidth={w}
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden>
      <path
        d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.2l.9-1.4A1 1 0 0 1 8.4 4h7.2a1 1 0 0 1 .8.6L17.3 6h1.2A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-8Z"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12.5" r="3.2" stroke="currentColor" strokeWidth={1.9} />
    </svg>
  );
}

function ActivityIcon({ active }: { active: boolean }) {
  const w = active ? 2.2 : 1.8;
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={w} />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={w} />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={w} />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={w} />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} />
      <path
        d="M4.5 19.5a7.5 7.5 0 0 1 15 0"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

// Camera sits dead center of the five tabs (2 either side) so the primary
// action is balanced, not off to one side.
const items: Item[] = [
  { href: "/home", key: "nav_home", icon: (a) => <HomeIcon active={a} /> },
  { href: "/groups", key: "nav_groups", icon: (a) => <GroupsIcon active={a} />, tour: "nav-groups" },
  { href: "/checkin", key: "nav_checkin", icon: () => <CheckinIcon />, primary: true, tour: "nav-checkin" },
  { href: "/activity", key: "nav_activity", icon: (a) => <ActivityIcon active={a} /> },
  { href: "/profile", key: "nav_profile", icon: (a) => <ProfileIcon active={a} />, tour: "nav-profile" },
];

/**
 * Bottom tab bar on phones, vertical side rail on desktop. The check-in tab is
 * the emphasized primary action.
 */
export function Nav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const isActive = (item: Item) => {
    // /groups should not light up while on /groups/new (that's the create flow),
    // but /groups itself and deeper group routes should.
    if (item.href === "/groups") {
      return pathname === "/groups";
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  return (
    <nav
      // translateZ(0) promotes the fixed bar to its own compositor layer so iOS
      // WebKit repaints it continuously during momentum scroll instead of
      // leaving it stranded mid-screen. Safe on the fixed element itself (the
      // re-basing risk is only for transformed ANCESTORS, of which there are
      // none).
      style={{ transform: "translateZ(0)", WebkitTransform: "translateZ(0)" }}
      className={cn(
        // Mobile: fixed to the bottom of the VIEWPORT. Solid so feed photos
        // never bleed through; safe-area pad for the iOS home indicator.
        "fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface",
        "px-3 pb-[env(safe-area-inset-bottom)]",
        // Desktop: fixed left side rail.
        "lg:inset-y-0 lg:right-auto lg:left-0 lg:w-20 lg:flex-col lg:border-r lg:border-t-0 lg:px-0 lg:py-6",
        "flex items-center justify-between lg:justify-start lg:gap-8",
      )}
    >
      <Link
        href="/home"
        className="hidden lg:flex h-10 w-full items-center justify-center text-h2 font-bold"
      >
        <span className="text-text">S</span>
        <span className="text-volt">.</span>
      </Link>

      <ul className="mx-auto flex w-full max-w-[22rem] items-center justify-between lg:max-w-none lg:flex-col lg:gap-5">
        {items.map((item) => {
          const active = isActive(item);
          if (item.primary) {
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-label={t(item.key)}
                  data-tour={item.tour}
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-pill bg-volt text-bg",
                    "transition-colors duration-150 hover:bg-volt-dim",
                  )}
                >
                  {item.icon(active)}
                </Link>
              </li>
            );
          }
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                data-tour={item.tour}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 transition-colors duration-150",
                  active ? "text-volt" : "text-text-dim hover:text-text",
                )}
              >
                {item.icon(active)}
                <span className="text-[10px] leading-none lg:hidden">
                  {t(item.key)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
