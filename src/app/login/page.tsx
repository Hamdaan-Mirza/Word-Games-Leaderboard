"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, CheckCircle2, Users, Sparkles, ArrowRight, LogOut } from "lucide-react";
import {
  getActiveGroup,
  getCurrentUser,
  updateCurrentUserProfile,
} from "@/lib/supabase/repository";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

const WCAG_AVATAR_COLORS = [
  { hex: "#0D1321", name: "Midnight Navy (#0D1321)" },
  { hex: "#1D2D44", name: "Prussian Blue (#1D2D44)" },
  { hex: "#3E5C76", name: "Paynes Steel (#3E5C76)" },
  { hex: "#047857", name: "Emerald 700 (5.4:1)" },
  { hex: "#B45309", name: "Amber 700 (5.0:1)" },
  { hex: "#BE123C", name: "Rose 700 (6.1:1)" },
];

export default function LoginPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("WORDS2026");
  const [avatarColor, setAvatarColor] = useState("#1D2D44");
  const [timezone, setTimezone] = useState("Africa/Johannesburg");
  const [status, setStatus] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const init = async () => {
      const live = isSupabaseConfigured();
      setIsLive(live);
      if (live) {
        const sb = getSupabaseBrowserClient();
        if (sb) {
          const { data: authData } = await sb.auth.getUser();
          if (authData?.user) {
            setIsAuthenticated(true);
            if (authData.user.email) {
              setEmail(authData.user.email);
            }
          }
        }
      }
      const [u, g] = await Promise.all([getCurrentUser(), getActiveGroup()]);
      setDisplayName(u.display_name === "Player 1" ? "" : u.display_name);
      setAvatarColor(u.avatar_color);
      setInviteCode(g.invite_code || "WORDS2026");
      setTimezone(g.timezone || "Africa/Johannesburg");
    };
    init();
  }, []);

  const handleGoogleSignIn = async () => {
    setStatus(null);
    const sb = getSupabaseBrowserClient();
    if (!sb) return;
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    if (error) {
      setStatus(`Google Sign-In Error: ${error.message}`);
    }
  };

  const handleSignOut = async () => {
    const sb = getSupabaseBrowserClient();
    if (sb) {
      await sb.auth.signOut();
      setIsAuthenticated(false);
      setEmail("");
      setStatus("Signed out successfully.");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    // If Supabase is live and the user is NOT signed in yet, send Magic Link OTP
    if (isLive && !isAuthenticated && email.trim()) {
      const sb = getSupabaseBrowserClient();
      if (sb) {
        const { error } = await sb.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo:
              typeof window !== "undefined" ? window.location.origin : undefined,
            data: {
              display_name: displayName.trim(),
              avatar_color: avatarColor,
              invite_code: inviteCode.trim().toUpperCase(),
            },
          },
        });
        if (error) {
          setStatus(`Supabase Auth Error: ${error.message}`);
          return;
        }
        setStatus("Magic Link sent to your email! Check your inbox to sign in.");
        return;
      }
    }

    // If already signed in (via Google or Magic Link) or in offline mode, update profile directly
    if (isLive && isAuthenticated) {
      const sb = getSupabaseBrowserClient();
      if (sb) {
        await sb.auth.updateUser({
          data: {
            display_name: displayName.trim(),
            avatar_color: avatarColor,
          },
        });
      }
    }

    await updateCurrentUserProfile({
      display_name: displayName,
      avatar_color: avatarColor,
      invite_code: inviteCode,
    });
    setStatus("Profile & Display Name saved! Redirecting to dashboard...");
    setTimeout(() => {
      router.push("/");
    }, 900);
  };

  return (
    <div className="mx-auto max-w-xl py-4">
      <section
        aria-label="Friend Group Join & Profile Setup"
        className="rounded-2xl border-2 border-wcag-border bg-wcag-surface p-6 shadow-sm sm:p-8"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-wcag-accent text-wcag-accentText"
              aria-hidden="true"
            >
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-wcag-text">
                {isAuthenticated ? "Your Player Profile" : "Join Friend Group & Sign In"}
              </h1>
              <p className="text-sm text-wcag-muted">
                {isAuthenticated
                  ? `Signed in${email ? ` as ${email}` : ""}. Customize your leaderboard display name and avatar below.`
                  : isLive
                  ? "Sign in with Google or Magic Link email to join the leaderboard."
                  : "Customize your display name, high-contrast avatar, and friend group invite code."}
              </p>
            </div>
          </div>

          {isLive && isAuthenticated && (
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border-2 border-wcag-border bg-wcag-elevated px-3 py-2 text-xs font-extrabold text-wcag-text hover:border-palette-shadow"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          )}
        </div>

        {isLive && !isAuthenticated && (
          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-xl border-2 border-wcag-border bg-wcag-elevated px-6 py-3 text-base font-extrabold text-wcag-text shadow-sm transition-colors hover:border-palette-shadow"
            >
              <span>Continue with Google</span>
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-wcag-border" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-wcag-muted">
                or sign in with email magic link
              </span>
              <div className="h-px flex-1 bg-wcag-border" />
            </div>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
          {/* Pre-filled Invite Code */}
          <div>
            <label
              htmlFor="invite-code"
              className="block text-sm font-bold text-wcag-text"
            >
              Private Friend Group Invite Code
            </label>
            <input
              id="invite-code"
              type="text"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="mt-1 min-h-[48px] w-full rounded-lg border-2 border-wcag-border bg-wcag-elevated px-4 py-2 font-mono text-lg font-extrabold tracking-wider text-wcag-text"
            />
            <p className="mt-1 text-xs font-semibold text-wcag-muted">
              Default group: <code className="font-mono font-bold">WORDS2026</code> • Timezone cutoff: <code className="font-mono font-bold">{timezone} (00:00:00 GMT+2)</code>
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label
              htmlFor="display-name"
              className="block text-sm font-bold text-wcag-text"
            >
              Your Leaderboard Display Name
            </label>
            <input
              id="display-name"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Hamdaan"
              className="mt-1 min-h-[48px] w-full rounded-lg border-2 border-wcag-border bg-wcag-elevated px-4 py-2 text-lg font-bold text-wcag-text"
            />
          </div>

          {/* Email for Supabase Magic Link (only shown when not yet authenticated) */}
          {(!isLive || !isAuthenticated) && (
            <div>
              <label
                htmlFor="magic-email"
                className="block text-sm font-bold text-wcag-text"
              >
                Email for Magic Link {isLive ? "(Required for Email Sign-In)" : "(Optional in Demo Mode)"}
              </label>
              <div className="relative mt-1">
                <input
                  id="magic-email"
                  type="email"
                  required={isLive && !isAuthenticated}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="min-h-[48px] w-full rounded-lg border-2 border-wcag-border bg-wcag-elevated px-4 py-2 text-lg text-wcag-text placeholder:text-wcag-muted/70"
                />
              </div>
            </div>
          )}

          {/* High-Contrast WCAG 2.1 AA Avatar Color Picker */}
          <div>
            <span className="block text-sm font-bold text-wcag-text">
              High-Contrast Avatar Badge (WCAG 2.1 AA Colorblind-Safe)
            </span>
            <div
              role="radiogroup"
              aria-label="Choose avatar color"
              className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3"
            >
              {WCAG_AVATAR_COLORS.map((c) => {
                const selected = avatarColor === c.hex;
                return (
                  <button
                    key={c.hex}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setAvatarColor(c.hex)}
                    className={`flex min-h-[48px] items-center gap-2.5 rounded-lg border-2 px-3 py-2 text-left text-xs font-bold transition-all ${
                      selected
                        ? "border-palette-eggshell bg-wcag-elevated ring-2 ring-palette-shadow"
                        : "border-wcag-border bg-wcag-elevated hover:border-palette-shadow"
                    }`}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/30 font-mono text-xs font-extrabold text-white"
                      style={{ backgroundColor: c.hex }}
                      aria-hidden="true"
                    >
                      {displayName.charAt(0).toUpperCase() || "P"}
                    </span>
                    <span className="text-wcag-text">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-wcag-accent px-6 py-3 text-base font-extrabold text-wcag-accentText shadow-sm hover:bg-wcag-accentHover"
          >
            {isLive && !isAuthenticated ? (
              <>
                <Mail className="h-5 w-5" aria-hidden="true" />
                <span>Send Magic Link &amp; Join Group</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" aria-hidden="true" />
                <span>Save Display Name &amp; Open Leaderboard</span>
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        {status && (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 flex items-center gap-2 rounded-lg border-2 border-wcag-success bg-wcag-success p-3.5 text-sm font-bold text-white"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{status}</span>
          </div>
        )}
      </section>
    </div>
  );
}
