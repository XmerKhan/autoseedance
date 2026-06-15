import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Coins, Image as ImageIcon, Video, Sparkles, ArrowRight, TrendingUp, Zap, CreditCard } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({ component: Overview });

interface Generation {
  id: string;
  tool_type: string;
  prompt: string;
  result_url: string | null;
  thumbnail_url: string | null;
  status: string;
  credits_used: number;
  created_at: string;
}

interface Wallet {
  balance: number;
  monthly_grant: number;
}

interface Subscription {
  plan: string;
}

function Overview() {
  const { user } = useSession();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [recentGenerations, setRecentGenerations] = useState<Generation[]>([]);
  const [stats, setStats] = useState({ images: 0, videos: 0, creditsUsed: 0 });

  useEffect(() => {
    if (!user) return;

    // Fetch wallet
    supabase
      .from("credit_wallets")
      .select("balance, monthly_grant")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setWallet(data as Wallet | null));

    // Fetch subscription
    supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setSubscription(data as Subscription | null));

    // Fetch recent generations
    supabase
      .from("generations")
      .select("id, tool_type, prompt, result_url, thumbnail_url, status, credits_used, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => setRecentGenerations((data as Generation[]) ?? []));

    // Fetch stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    Promise.all([
      supabase.from("generations").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("tool_type", "image").eq("status", "done"),
      supabase.from("generations").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("tool_type", "video").eq("status", "done"),
      supabase.from("credit_ledger").select("amount").eq("user_id", user.id).gte("created_at", startOfMonth).lt("amount", 0),
    ]).then(([imgRes, vidRes, creditRes]) => {
      const creditsUsed = creditRes.data?.reduce((sum, r) => sum + Math.abs(r.amount), 0) ?? 0;
      setStats({
        images: imgRes.count ?? 0,
        videos: vidRes.count ?? 0,
        creditsUsed,
      });
    });
  }, [user]);

  const planName = subscription?.plan ?? "free";
  const planDisplayName = planName.charAt(0).toUpperCase() + planName.slice(1);
  const balance = wallet?.balance ?? 0;
  const monthlyGrant = wallet?.monthly_grant ?? 50;
  const usedPercent = Math.min(100, ((monthlyGrant - balance) / monthlyGrant) * 100);

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";

  return (
    <DashboardLayout>
      <div className="p-6 md:p-10 max-w-6xl mx-auto">
        {/* Welcome Header */}
        <header className="flex flex-wrap items-end justify-between gap-3 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Welcome back, {displayName}!</h1>
            <p className="text-muted-foreground mt-1">Here's your creative overview.</p>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Credit Balance Card */}
          <Card className="glass border-0 p-6 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Credit Balance</span>
              <Badge className={`${planName === "free" ? "bg-muted text-muted-foreground" : "btn-gradient text-white"} border-0`}>
                {planDisplayName}
              </Badge>
            </div>
            <div className="text-5xl font-display font-bold">{balance.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-1">credits remaining</div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>{monthlyGrant - balance} used</span>
                <span>{monthlyGrant} total</span>
              </div>
              <Progress value={usedPercent} className="h-2" />
            </div>

            {planName === "free" && balance < 30 && (
              <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm">
                <span className="text-amber-400">Low credits!</span>{" "}
                <Link to="/pricing" className="text-primary hover:underline">Upgrade for more</Link>
              </div>
            )}
          </Card>

          {/* Quick Stats */}
          <Card className="glass border-0 p-6 lg:col-span-2">
            <h3 className="font-display font-semibold mb-4">Quick Stats</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/40">
                <ImageIcon className="size-5 mx-auto text-primary mb-2" />
                <div className="text-2xl font-display font-bold">{stats.images}</div>
                <div className="text-xs text-muted-foreground">Images Generated</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/40">
                <Video className="size-5 mx-auto text-primary mb-2" />
                <div className="text-2xl font-display font-bold">{stats.videos}</div>
                <div className="text-xs text-muted-foreground">Videos Generated</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/40">
                <Coins className="size-5 mx-auto text-primary mb-2" />
                <div className="text-2xl font-display font-bold">{stats.creditsUsed}</div>
                <div className="text-xs text-muted-foreground">Credits Used (This Month)</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <Link to="/tools/image">
            <Card className="glass border-0 p-6 h-full hover:translate-y-[-2px] hover:shadow-lg hover:shadow-purple-500/10 transition cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-xl btn-gradient grid place-items-center">
                  <ImageIcon className="size-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-lg">Generate Image</h3>
                  <p className="text-sm text-muted-foreground">Create 2K/4K AI images from text prompts</p>
                </div>
                <Badge className="btn-gradient text-white border-0">5 credits</Badge>
              </div>
            </Card>
          </Link>

          <Link to="/tools/video">
            <Card className="glass border-0 p-6 h-full hover:translate-y-[-2px] hover:shadow-lg hover:shadow-purple-500/10 transition cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-xl btn-gradient grid place-items-center">
                  <Video className="size-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-lg">Generate Video</h3>
                  <p className="text-sm text-muted-foreground">Create cinematic AI videos with audio</p>
                </div>
                <Badge className="btn-gradient text-white border-0">30 credits</Badge>
              </div>
            </Card>
          </Link>
        </div>

        {/* Upgrade Banner for Free Plan */}
        {planName === "free" && (
          <Card className="glass border-0 p-6 mt-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-semibold text-lg">You have {balance} credits left</h3>
                <p className="text-sm text-muted-foreground">Upgrade to get more credits and unlock premium features.</p>
              </div>
              <Link to="/pricing">
                <Button className="btn-gradient text-white border-0">
                  <TrendingUp className="size-4 mr-2" /> Upgrade Now
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Recent Generations */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Recent Generations</h2>
            <Link to="/dashboard/history">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="size-4 ml-1" />
              </Button>
            </Link>
          </div>

          {recentGenerations.length === 0 ? (
            <Card className="glass border-0 p-12 text-center">
              <Sparkles className="size-12 mx-auto text-muted-foreground opacity-50" />
              <p className="mt-4 text-muted-foreground">No generations yet. Create your first image or video!</p>
              <div className="mt-4 flex justify-center gap-3">
                <Link to="/tools/image">
                  <Button variant="outline" size="sm">
                    <ImageIcon className="size-4 mr-2" /> Generate Image
                  </Button>
                </Link>
                <Link to="/tools/video">
                  <Button variant="outline" size="sm">
                    <Video className="size-4 mr-2" /> Generate Video
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentGenerations.map((gen) => (
                <Card key={gen.id} className="glass border-0 overflow-hidden">
                  <Link to={gen.tool_type === "image" ? "/tools/image" : "/tools/video"}>
                    <div className="aspect-video bg-muted grid place-items-center relative">
                      {gen.result_url ? (
                        gen.tool_type === "video" ? (
                          <video src={gen.result_url} className="size-full object-cover" />
                        ) : (
                          <img src={gen.result_url} alt={gen.prompt} className="size-full object-cover" loading="lazy" />
                        )
                      ) : gen.status === "processing" ? (
                        <div className="flex flex-col items-center gap-2">
                          <Zap className="size-6 animate-pulse text-primary" />
                          <span className="text-xs text-muted-foreground">Processing...</span>
                        </div>
                      ) : (
                        gen.tool_type === "image" ? (
                          <ImageIcon className="size-8 text-muted-foreground opacity-50" />
                        ) : (
                          <Video className="size-8 text-muted-foreground opacity-50" />
                        )
                      )}
                      <Badge className="absolute top-2 right-2" variant="secondary">
                        {gen.tool_type === "image" ? <ImageIcon className="size-3 mr-1" /> : <Video className="size-3 mr-1" />}
                        {gen.credits_used} cr
                      </Badge>
                    </div>
                  </Link>
                  <div className="p-3">
                    <p className="text-sm line-clamp-2">{gen.prompt}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(gen.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
