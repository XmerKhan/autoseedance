import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Image as ImageIcon, Loader as Loader2, Download, Heart, Trash2, Sparkles, ChevronDown, ChevronUp, CircleAlert as AlertCircle } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/tools/image")({
  component: ImageToolPage,
  head: () => ({
    meta: [
      { title: "Image Generation — Auto Seedance AI" },
      { name: "description", content: "Generate AI images with text prompts. 5 credits per image." },
    ],
  }),
});

const IMAGE_SIZES = [
  { value: "1024x1024", label: "1024×1024 (Square)" },
  { value: "1365x1024", label: "1365×1024 (Landscape)" },
  { value: "1024x1365", label: "1024×1365 (Portrait)" },
  { value: "2048x2048", label: "2048×2048 (4K)" },
];

const IMAGE_STYLES = [
  { value: "realistic", label: "Realistic" },
  { value: "digital_illustration", label: "Digital Illustration" },
  { value: "vector_illustration", label: "Vector Illustration" },
  { value: "icon", label: "Icon" },
];

type Generation = Tables<"generations">;

function ImageToolPage() {
  const { user } = useSession();
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("1024x1024");
  const [style, setStyle] = useState("realistic");
  const [generating, setGenerating] = useState(false);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const CREDITS_PER_IMAGE = 5;

  async function fetchGenerations() {
    if (!user) return;
    const { data } = await supabase
      .from("generations")
      .select("*")
      .eq("user_id", user.id)
      .eq("tool_type", "image")
      .order("created_at", { ascending: false })
      .limit(50);
    setGenerations((data as Generation[]) ?? []);
  }

  async function fetchBalance() {
    if (!user) return;
    const { data } = await supabase
      .from("credit_wallets")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();
    setBalance(data?.balance ?? 0);
  }

  useEffect(() => {
    fetchGenerations();
    fetchBalance();
  }, [user]);

  async function pollForResult(predictionId: string, generationId: string) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const maxAttempts = 120; // 2 minutes max

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/poll-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prediction_id: predictionId }),
        });
        const data = await res.json();

        if (data.status === "succeeded" && data.output?.[0]) {
          await supabase
            .from("generations")
            .update({
              result_url: data.output[0],
              status: "done",
              updated_at: new Date().toISOString(),
            })
            .eq("id", generationId);
          return data.output[0];
        }

        if (data.status === "failed") {
          throw new Error(data.error || "Generation failed");
        }
      } catch (e) {
        console.error("Poll error:", e);
      }

      await new Promise((r) => setTimeout(r, 1000));
    }

    throw new Error("Generation timed out");
  }

  async function handleGenerate() {
    if (!user || !prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    if (balance !== null && balance < CREDITS_PER_IMAGE) {
      toast.error("Not enough credits", { description: `You need ${CREDITS_PER_IMAGE} credits. You have ${balance}.` });
      return;
    }

    setGenerating(true);

    try {
      // 1. Consume credits
      const { data: creditResult, error: creditError } = await supabase.rpc("consume_credits", {
        _tool: "image",
        _amount: CREDITS_PER_IMAGE,
      });

      if (creditError || !creditResult?.success) {
        throw new Error(creditResult?.error || creditError?.message || "Failed to deduct credits");
      }

      // Update balance display
      setBalance(creditResult.new_balance);

      // 2. Create generation record
      const { data: genData, error: genError } = await supabase
        .from("generations")
        .insert({
          user_id: user.id,
          tool_type: "image",
          prompt: prompt.trim(),
          settings: { size, style },
          status: "processing",
          credits_used: CREDITS_PER_IMAGE,
        })
        .select("id")
        .single();

      if (genError || !genData) {
        throw new Error("Failed to create generation record");
      }

      const generationId = genData.id;

      // 3. Call edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), size, style }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.error || "Generation failed");
      }

      // 4. If we got immediate result, update and show
      if (result.image_url) {
        await supabase
          .from("generations")
          .update({
            result_url: result.image_url,
            status: "done",
            external_id: result.prediction_id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", generationId);

        toast.success("Image generated!");
        fetchGenerations();
      } else if (result.prediction_id) {
        // Save prediction ID and poll
        await supabase
          .from("generations")
          .update({ external_id: result.prediction_id })
          .eq("id", generationId);

        // Start polling in background
        pollForResult(result.prediction_id, generationId)
          .then(() => {
            toast.success("Image generated!");
            fetchGenerations();
          })
          .catch((e) => {
            supabase.from("generations").update({ status: "failed", error: e.message }).eq("id", generationId);
            toast.error("Generation failed", { description: e.message });
            fetchGenerations();
          });
      }

      setPrompt("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  }

  async function toggleFavorite(id: string, current: boolean) {
    await supabase.from("generations").update({ is_favorite: !current }).eq("id", id);
    fetchGenerations();
  }

  async function deleteGeneration(id: string) {
    await supabase.from("generations").delete().eq("id", id);
    fetchGenerations();
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl btn-gradient grid place-items-center">
          <ImageIcon className="size-5 text-white" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Image Generation</h1>
          <p className="text-muted-foreground text-sm">Create stunning AI images from text prompts</p>
        </div>
        <Badge variant="outline" className="ml-auto">{CREDITS_PER_IMAGE} credits</Badge>
      </div>

      {balance !== null && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="size-4 text-primary" />
          Balance: <span className="font-semibold text-foreground">{balance}</span> credits
        </div>
      )}

      <Card className="glass border-0 p-6 mt-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your image... e.g., 'A serene mountain lake at sunset, photorealistic, golden hour lighting'"
              rows={4}
              className="mt-1 bg-muted/50 border-border resize-none"
              disabled={generating}
            />
          </div>

          <div>
            <Label>Size</Label>
            <Select value={size} onValueChange={setSize} disabled={generating}>
              <SelectTrigger className="mt-1 bg-muted/50 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_SIZES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Style</Label>
            <Select value={style} onValueChange={setStyle} disabled={generating}>
              <SelectTrigger className="mt-1 bg-muted/50 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_STYLES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
          className="mt-6 btn-gradient text-white border-0"
        >
          {generating ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Sparkles className="size-4 mr-2" /> Generate Image
            </>
          )}
        </Button>
      </Card>

      {/* History */}
      <div className="mt-10">
        <h2 className="font-display text-xl font-semibold">Your Images</h2>

        {generations.length === 0 ? (
          <Card className="glass border-0 p-12 text-center mt-4">
            <ImageIcon className="size-12 mx-auto text-muted-foreground opacity-50" />
            <p className="mt-4 text-muted-foreground">No images yet. Create your first one above!</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {generations.map((gen) => (
              <Card key={gen.id} className="glass border-0 overflow-hidden">
                <div className="aspect-square bg-muted grid place-items-center relative">
                  {gen.result_url ? (
                    <img
                      src={gen.result_url}
                      alt={gen.prompt}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  ) : gen.status === "processing" ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="size-8 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">Generating...</span>
                    </div>
                  ) : gen.status === "failed" ? (
                    <div className="flex flex-col items-center gap-2 text-destructive">
                      <AlertCircle className="size-8" />
                      <span className="text-xs">Failed</span>
                    </div>
                  ) : (
                    <ImageIcon className="size-12 text-muted-foreground opacity-50" />
                  )}
                  {gen.is_favorite && (
                    <div className="absolute top-2 right-2">
                      <Heart className="size-5 fill-red-500 text-red-500" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm line-clamp-2">{gen.prompt}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="border-border text-xs">{gen.settings?.size || "1024x1024"}</Badge>
                    <span>{gen.credits_used} credits</span>
                    <span className="ml-auto">{new Date(gen.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => toggleFavorite(gen.id, gen.is_favorite)}
                    >
                      <Heart className={`size-4 mr-1 ${gen.is_favorite ? "fill-red-500 text-red-500" : ""}`} />
                    </Button>
                    {gen.result_url && (
                      <Button variant="ghost" size="sm" className="flex-1" asChild>
                        <a href={gen.result_url} download target="_blank" rel="noopener noreferrer">
                          <Download className="size-4 mr-1" />
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => deleteGeneration(gen.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
