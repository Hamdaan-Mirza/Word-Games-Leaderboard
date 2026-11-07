"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Trophy,
  Gamepad2,
  Settings,
  UserCheck,
  Clock,
  Sparkles,
  ShieldCheck,
  Sun,
  Moon,
} from "lucide-react";
import {
  getActiveGroup,
  getAllProfiles,
  getCurrentUser,
  subscribeToLeaderboardUpdates,
  switchDemoPersona,
} from "@/lib/supabase/repository";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getTimeUntilMidnightReset } from "@/lib/timezone";
import { GroupInfo, UserProfile } from "@/types/leaderboard";

const THEME_STORAGE_KEY = "wgl_theme_v1";

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [countdown, setCountdown] = useState<string>("--h --m --s");
  const [isLiveSupabase, setIsLiveSupabase] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const applyTheme = (mode: "dark" | "light") => {
    setTheme(mode);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (mode === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as "dark" | "light" | null;
      const initialMode = saved || "dark";
      applyTheme(initialMode);
    }
  }, []);

  const toggleTheme = () => {
    applyTheme(theme === "dark" ? "light" : "dark");
  };

  const loadNavState = async () => {
    const [u, allProfiles, g] = await Promise.all([
      getCurrentUser(),
      getAllProfiles(),
      getActiveGroup(),
    ]);
    setUser(u);
    setProfiles(allProfiles);
    setGroup(g);
    setIsLiveSupabase(isSupabaseConfigured());
  };

  useEffect(() => {
    loadNavState();
    const unsub = subscribeToLeaderboardUpdates(() => {
      loadNavState();
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const tz = group?.timezone || "Africa/Johannesburg";
      setCountdown(getTimeUntilMidnightReset(new Date(), tz).formatted);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [group?.timezone]);

  const handlePersonaChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const updated = await switchDemoPersona(e.target.value);
    setUser(updated);
  };

  const navItems = [
    {
      href: "/",
      label: "Log & Daily",
      icon: Gamepad2,
      active: pathname === "/",
    },
    {
      href: "/leaderboard",
      label: "All-Time Hall",
      icon: Trophy,
      active: pathname === "/leaderboard",
    },
    {
      href: "/admin",
      label: "Admin & Audit",
      icon: Settings,
      active: pathname === "/admin",
    },
    {
      href: "/login",
      label: "Profile / Group",
      icon: UserCheck,
      active: pathname === "/login",
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b-2 border-wcag-border bg-wcag-surface shadow-sm transition-colors">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Brand & Group Badge */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex min-h-[48px] items-center gap-2.5 rounded-lg px-2 py-1 text-wcag-text hover:bg-wcag-elevated"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-wcag-accent font-mono text-lg font-bold text-wcag-accentText"
                aria-hidden="true"
              >
                W
              </span>
              <div>
                <span className="block text-lg font-extrabold tracking-tight text-wcag-text">
                  Word Games Hub
                </span>
                <span className="block text-xs font-semibold text-wcag-muted">
                  {group ? `${group.name} (${group.invite_code})` : "Equal-Weight Leaderboard"}
                </span>
              </div>
            </Link>

            <span
              className={`hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white xl:inline-flex ${
                isLiveSupabase ? "bg-wcag-success" : "bg-palette-steel"
              }`}
              title={
                isLiveSupabase
                  ? "Connected to Supabase PostgreSQL & Realtime CDC"
                  : "Running in Hybrid Local + BroadcastChannel Demo Mode"
              }
            >
              {isLiveSupabase ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Supabase Live</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Interactive Demo</span>
                </>
              )}
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden items-center gap-1.5 md:flex"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={item.active ? "page" : undefined}
                  className={`flex min-h-[48px] items-center gap-2 rounded-lg px-4 py-2 text-base font-bold transition-colors ${
                    item.active
                      ? "bg-wcag-accent text-wcag-accentText shadow-sm"
                      : "text-wcag-text hover:bg-wcag-elevated"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Utilities: SAST Reset Countdown, Theme Switcher & Active Player Switcher */}
          <div className="flex items-center gap-2.5">
            <div
              className="hidden items-center gap-1.5 rounded-lg border border-wcag-border bg-wcag-elevated px-3 py-2 text-sm font-semibold text-wcag-text lg:flex"
              title="Daily leaderboard resets at 00:00:00 Africa/Johannesburg (GMT+2)"
            >
              <Clock className="h-4 w-4 text-palette-shadow" aria-hidden="true" />
              <span className="text-wcag-muted">SAST Reset:</span>
              <span className="font-mono font-bold tabular-nums text-wcag-text">
                {countdown}
              </span>
            </div>

            {/* WCAG 2.1 AA Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
              }
              title={
                theme === "dark"
                  ? "Dark Mode Active (#0D1321 / #1D2D44 / #F0EBD8) — Click for Light Mode"
                  : "Light Mode Active (#F7F5EC / #0D1321) — Click for Dark Mode"
              }
              className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center gap-2 rounded-lg border-2 border-wcag-border bg-wcag-elevated px-3 py-2 text-sm font-bold text-wcag-text transition-colors hover:border-palette-shadow"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-5 w-5 text-palette-eggshell" aria-hidden="true" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-5 w-5 text-palette-prussian" aria-hidden="true" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            {user && isLiveSupabase && (
              <Link
                href="/login"
                className="flex min-h-[48px] items-center gap-2 rounded-lg border-2 border-wcag-border bg-wcag-elevated px-3 py-1.5 text-sm font-bold text-wcag-text transition-colors hover:border-palette-shadow"
                title="View or edit your display name and profile"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/30 text-xs font-extrabold text-white"
                  style={{ backgroundColor: user.avatar_color }}
                  aria-hidden="true"
                >
                  {user.display_name.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[120px] truncate">{user.display_name}</span>
              </Link>
            )}

            {user && !isLiveSupabase && profiles.length > 0 && (
              <div className="flex items-center gap-2">
                <label htmlFor="persona-select" className="sr-only">
                  Switch active player persona
                </label>
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: user.avatar_color }}
                  aria-hidden="true"
                >
                  {user.display_name.charAt(0).toUpperCase()}
                </span>
                <select
                  id="persona-select"
                  value={user.id}
                  onChange={handlePersonaChange}
                  className="min-h-[48px] rounded-lg border-2 border-wcag-border bg-wcag-elevated px-2.5 py-1.5 text-sm font-bold text-wcag-text"
                  title="Switch active player in Demo Mode to test multi-user competition"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id} className="bg-wcag-surface text-wcag-text">
                      Playing as: {p.display_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Persistent Mobile Bottom Navigation Bar (48x48px min touch targets) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 flex border-t-2 border-wcag-border bg-wcag-surface md:hidden"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 px-2 py-1.5 text-xs font-bold ${
                item.active
                  ? "bg-wcag-accent text-wcag-accentText"
                  : "text-wcag-text hover:bg-wcag-elevated"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
