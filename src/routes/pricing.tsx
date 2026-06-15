import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Loader as Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { toast } from "sonner";

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    monthlyPrice: 14.90,
    yearlyPrice: 178.80,
    monthlyCredits: 800,
    yearlyCredits: 9600,
    pricePerCredit: 0.019,
    features: [
      "AI Image Generation",
      "AI Video Generation",
      "Multiple AI models",
      "Standard generation speed",
      "No watermark",
      "Private generation",
      "Customer support",
      "Commercial Use License",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    monthlyPrice: 24.90,
    yearlyPrice: 298.80,
    monthlyCredits: 1600,
    yearlyCredits: 19200,
    pricePerCredit: 0.016,
    features: [
      "AI Image Generation",
      "AI Video Generation",
      "Multiple AI models",
      "Priority generation",
      "No watermark",
      "Private generation",
      "Priority customer support",
      "Commercial Use License",
    ],
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 49.90,
    yearlyPrice: 598.80,
    monthlyCredits: 4000,
    yearlyCredits: 48000,
    pricePerCredit: 0.012,
    features: [
      "AI Image Generation",
      "AI Video Generation",
      "Multiple AI models",
      "Fastest generation speed",
      "No watermark",
      "Private generation",
      "Expert team support",
      "Commercial Use License",
    ],
  },
];

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Pricing — Auto Seedance AI" },
      { name: "description", content: "Simple credit-based pricing for AI image and video generation. Choose Basic, Standard, or Pro plans." },
    ],
  }),
});

function PricingPage() {
  const { user } = useSession();
  const [yearly, setYearly] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      supabase.from("subscriptions").select("plan").eq("user_id", user.id).maybeSingle().then(({ data }) => {
        if (data) setCurrentPlan(data.plan);
      });
    }
  }, [user]);

  const handleSubscribe = (planId: string) => {
    toast.info(`${planId.charAt(0).toUpperCase() + planId.slice(1)} plan checkout`, {
      description: "Payment integration coming soon. Contact support to upgrade.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-40 pb-24 grid-bg">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <Badge variant="outline" className="border-border bg-muted/50">Pricing</Badge>
            <h1 className="mt-4 font-display text-5xl font-bold">Simple credit-based pricing</h1>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Choose a plan that fits your creative needs. All plans include image and video generation.
            </p>

            <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1">
              <button
                onClick={() => setYearly(false)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${!yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setYearly(true)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition flex items-center gap-2 ${yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Yearly
                <Badge className="bg-orange-500 text-white border-0 text-xs px-1.5 py-0">Save 50%</Badge>
              </button>
            </div>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
              const credits = yearly ? plan.yearlyCredits : plan.monthlyCredits;
              const isCurrent = currentPlan === plan.id;

              return (
                <Card
                  key={plan.id}
                  className={`relative glass border-0 p-6 flex flex-col ${plan.popular ? "glow-purple ring-2 ring-primary/50" : "border border-border"}`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-6 bg-primary text-primary-foreground border-0">Most Popular</Badge>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold text-xl">{plan.name}</h3>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border">
                      ${plan.pricePerCredit.toFixed(3)}/credit
                    </Badge>
                  </div>

                  <div className="mb-4">
                    <div className="text-4xl font-display font-bold">
                      ${price.toFixed(2)}
                      <span className="text-base font-normal text-muted-foreground">/{yearly ? "year" : "month"}</span>
                    </div>
                    {yearly && (
                      <div className="text-sm text-muted-foreground mt-1">
                        ${plan.monthlyPrice.toFixed(2)}/month billed yearly
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <Badge variant="outline" className="border-primary/30 text-primary">
                      {credits.toLocaleString()} credits/{yearly ? "year" : "month"}
                    </Badge>
                  </div>

                  <ul className="space-y-3 text-sm flex-1 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <Check className="size-4 text-green-400 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <Button className="w-full" variant="outline" disabled>
                      Current plan
                    </Button>
                  ) : plan.id === "free" ? (
                    <Link to="/auth" className="block">
                      <Button className="w-full" variant="outline">
                        Get started <ArrowRight className="ml-1 size-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      className={`w-full ${plan.popular ? "btn-gradient text-white border-0" : ""}`}
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      Subscribe
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <div className="text-sm text-muted-foreground">
              Credit cost per generation: <span className="font-medium text-foreground">Image 5</span> · <span className="font-medium text-foreground">Video 30</span>
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
