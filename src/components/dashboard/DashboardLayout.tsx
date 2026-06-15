import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureUserBootstrap, signOut, useSession } from "@/lib/auth";
import { LayoutDashboard, ListChecks, Film, Chromium as Chrome, Settings, Shield, Sparkles, LogOut, Loader as Loader2, CreditCard, Play, User, Coins, Image as ImageIcon, Video, History, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";

const items = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/tools/image", label: "Image AI", icon: ImageIcon },
  { to: "/tools/video", label: "Video AI", icon: Video },
  { to: "/dashboard/credits", label: "Credits", icon: Coins },
  { to: "/dashboard/history", label: "History", icon: History },
  { to: "/workspace", label: "Workspace", icon: Play },
  { to: "/dashboard/queue", label: "Queue", icon: ListChecks },
  { to: "/dashboard/library", label: "Library", icon: Film },
  { to: "/dashboard/extension", label: "Extension", icon: Chrome },
  { to: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { to: "/dashboard/profile", label: "Profile", icon: User },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardLayout() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [wallet, setWallet] = useState<Tables<"credit_wallets"> | null>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const redirectPath = path.startsWith("/dashboard") || path.startsWith("/tools") ? path : "/dashboard";

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", search: { redirect: redirectPath } as any, replace: true });
  }, [loading, session, navigate, redirectPath]);

  useEffect(() => {
    if (!session) return;
    void ensureUserBootstrap(session.user);
    supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));

    // Fetch wallet
    supabase.from("credit_wallets").select("*").eq("user_id", session.user.id).maybeSingle()
      .then(({ data }) => setWallet(data));

    // Subscribe to wallet changes
    const channel = supabase.channel("wallet-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "credit_wallets", filter: `user_id=eq.${session.user.id}` }, (payload) => {
        if (payload.new) setWallet(payload.new as Tables<"credit_wallets">);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session]);

  if (loading || !session) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  const allItems = isAdmin ? [...items, { to: "/dashboard/admin", label: "Admin", icon: Shield }] : items;

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar">
        <Link to="/" className="px-6 py-5 flex items-center gap-2 font-display font-bold text-lg">
          <span className="size-8 rounded-lg btn-gradient grid place-items-center">
            <Sparkles className="size-4 text-white" />
          </span>
          <span className="gradient-text">Auto Seedance</span>
        </Link>

        {/* Credit balance */}
        {wallet && (
          <div className="mx-3 mb-3 rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Coins className="size-3.5 text-primary" /> Credits
            </div>
            <div className="mt-2 text-2xl font-display font-bold">{wallet.balance.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">{wallet.monthly_grant.toLocaleString()} / month</div>
          </div>
        )}

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {allItems.map((it) => {
            const active = path === it.to || (it.to !== "/dashboard" && path.startsWith(it.to));
            return (
              <Link key={it.to} to={it.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  active ? "btn-gradient text-white" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}>
                <it.icon className="size-4" /> {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">{session.user.email}</div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={async () => { await signOut(); navigate({ to: "/", replace: true }); }}>
            <LogOut className="size-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
