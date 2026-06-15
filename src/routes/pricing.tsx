import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Loader as Loader2, CreditCard, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { toast } from "sonner";

type Plan = {
  id: string;
  name: string;
  monthly_credits: number;
  price_monthly_cents: number;
  price_yearly_cents: number;
  features: string[];
  sort_order: number;
};

// PayPal configuration - replace with your PayPal credentials
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || "sb";
const PAYPAL_MODE = PAYPAL_CLIENT_ID === "sb" ? "sandbox" : "live";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Pricing — Auto Seedance AI" },
      { name: "description", content: "Simple credit-based pricing for AI text, image, video, and animation generation. Start free, upgrade anytime." },
      { property: "og:title", content: "Pricing — Auto Seedance AI" },
      { property: "og:description", content: "Credit-based plans for AI generation. Free tier included." },
      { property: "og:url", content: "https://autoseedance.site/pricing" },
    ],
    links: [{ rel: "canonical", href: "https://autoseedance.site/pricing" }],
  }),
});

function PricingPage() {
  const { user } = useSession();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [yearly, setYearly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string>("free");

  useEffect(() => {
    supabase.from("plans").select("*").eq("is_active", true).order("sort_order").then(({ data }) => {
      setPlans((data as Plan[]) ?? []);
      setLoading(false);
    });

    if (user) {
      supabase.from("subscriptions").select("plan").eq("user_id", user.id).maybeSingle().then(({ data }) => {
        if (data) setCurrentPlan(data.plan);
      });
    }
  }, [user]);

  const handlePayPalCheckout = (plan: Plan) => {
    // PayPal checkout URL - you would typically create a PayPal order via their API
    // For now, show a message that PayPal is being set up
    const amount = yearly ? plan.price_yearly_cents / 100 : plan.price_monthly_cents / 100;
    const billingCycle = yearly ? "yearly" : "monthly";

    // In production, you would redirect to PayPal or show PayPal buttons
    // For now, show a toast with info
    toast.info(`PayPal checkout for ${plan.name} plan ($${amount}/${billingCycle})`, {
      description: "PayPal integration is being finalized. Contact support to upgrade your plan.",
    });
  };

  const formatPrice = (cents: number) => {
    if (cents === 0) return "$0";
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-40 pb-24 grid-bg">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <Badge variant="outline" className="border-border bg-muted/50">Pricing</Badge>
            <h1 className="mt-4 font-display text-5xl font-bold">Credits that scale with you</h1>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Use credits across all AI tools — text, image, video, and animation. Start free, upgrade anytime.
            </p>

            <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1">
              <button
                onClick={() => setYearly(false)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${!yearly ? "btn-gradient text-white" : "text-muted-foreground hover:text-foreground"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setYearly(true)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${yearly ? "btn-gradient text-white" : "text-muted-foreground hover:text-foreground"}`}
              >
                Yearly <span className="text-xs opacity-80 ml-1">Save 17%</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="mt-16 grid place-items-center"><Loader2 className="animate-spin text-primary" /></div>
          ) : plans.length === 0 ? (
            <div className="mt-12 text-center text-muted-foreground">
              <Sparkles className="size-12 mx-auto mb-4 opacity-50" />
              <p>No plans available at the moment.</p>
            </div>
          ) : (
            <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {plans.map((p) => {
                const cents = yearly ? p.price_yearly_cents : p.price_monthly_cents;
                const suffix = yearly ? "/yr" : "/mo";
                const highlight = p.id === "pro";
                const isCurrent = currentPlan === p.id;

                return (
                  <Card
                    key={p.id}
                    className={`glass border-0 p-6 flex flex-col relative ${highlight ? "glow-purple ring-1 ring-primary/40" : ""}`}
                  >
                    {highlight && (
                      <Badge className="btn-gradient text-white border-0 self-start mb-2">Most popular</Badge>
                    )}
                    {isCurrent && (
                      <Badge variant="outline" className="border-green-500 text-green-500 self-start mb-2">Current plan</Badge>
                    )}

                    <h3 className="font-display font-semibold text-xl">{p.name}</h3>

                    <div className="mt-3 text-4xl font-display font-bold">
                      {formatPrice(cents)}
                      {cents > 0 && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
                    </div>

                    <div className="mt-1 text-sm text-muted-foreground">
                      {p.monthly_credits.toLocaleString()} credits / month
                    </div>

                    <ul className="mt-5 space-y-2 text-sm flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-2">
                          <Check className="size-4 text-primary shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <Button
                        className="w-full h-11 mt-6"
                        variant="outline"
                        disabled
                      >
                        Current plan
                      </Button>
                    ) : p.id === "free" ? (
                      <Link to="/auth" className="block mt-6">
                        <Button className="w-full h-11" variant="outline">
                          Get started <ArrowRight className="ml-1 size-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        className={`w-full h-11 mt-6 ${highlight ? "btn-gradient text-white border-0" : ""}`}
                        variant={highlight ? "default" : "outline"}
                        onClick={() => handlePayPalCheckout(p)}
                      >
                        <CreditCard className="size-4 mr-2" />
                        Pay with PayPal
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          <div className="mt-12 text-center">
            <div className="text-sm text-muted-foreground">
              Credit cost per generation: <span className="font-medium text-foreground">Text 1</span> · <span className="font-medium text-foreground">Image 5</span> · <span className="font-medium text-foreground">Animation 20</span> · <span className="font-medium text-foreground">Video 30</span>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <img src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" alt="PayPal" className="h-6" />
              <span>Secure payments powered by PayPal</span>
            </div>
          </div>

          <Card className="glass border-0 p-6 mt-8 max-w-2xl mx-auto">
            <h3 className="font-display font-semibold">Need more credits or custom solutions?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Contact us for enterprise plans, custom credit packages, or API access. We offer volume discounts for teams and agencies.
            </p>
            <Link to="/contact" className="block mt-4">
              <Button variant="outline" className="w-full">
                Contact sales <ArrowRight className="ml-1 size-4" />
              </Button>
            </Link>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  );
}
