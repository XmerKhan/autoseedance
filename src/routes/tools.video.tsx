import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Video, Loader as Loader2, Download, Heart, Trash2, Sparkles, CircleAlert as AlertCircle, Play, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/tools/video")({
  component: VideoToolPage,
  head: () => ({
    meta: [
      { title: "Video Generation — Auto Seedance AI" },
      { name: "description", content: "Generate AI videos with text prompts. 30 credits per video." },
    ],
  }),
});

const RESOLUTIONS = [
  { value: "720p", label: "720p (HD)" },
  { value: "1080p", label: "1080p (Full HD)" },
];

const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 (Landscape)" },
  { value: "9:16", label: "9:16 (Portrait/Shorts)" },
  { value: "1:1", label: "1:1 (Square)" },
];

type Generation = Tables<"generations">;

function VideoToolPage() {
  const { user } = useSession();
  const [prompt, setPrompt] = useState("");
  const [resolution, setResolution] = useState("720p");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [generateAudio, setGenerateAudio] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const pollingRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const CREDITS_PER_VIDEO = 30;

  async function fetchGenerations() {
    if (!user) return;
    const { data } = await supabase
      .from("generations")
      .select("*")
      .eq("user_id", user.id)
      .eq("tool_type", "video")
      .order("created_at", { ascending: false })
      .limit(30);
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

    // Subscribe to generation updates
    if (user) {
      const channel = supabase
        .channel("video-generations")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "generations",
            filter: `user_id=eq.${user.id}`,
          },
          () => fetchGenerations()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        pollingRef.current.forEach((timer) => clearInterval(timer));
      };
    }
  }, [user]);

  async function pollForResult(predictionId: string, generationId: string) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const maxAttempts = 200; // Video can take 3+ minutes
    let attempts = 0;

    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/poll-video`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prediction_id: predictionId }),
        });
        const data = await res.json();

        if (data.status === "succeeded" && data.output) {
          await supabase
            .from("generations")
            .update({
              result_url: data.output,
              status: "done",
              updated_at: new Date().toISOString(),
            })
            .eq("id", generationId);

          pollingRef.current.delete(predictionId);
          fetchGenerations();
          fetchBalance();
          toast.success("Video generated!");
          return true;
        }

        if (data.status === "failed") {
          await supabase
            .from("generations")
            .update({ status: "failed", error: data.error || "Generation failed" })
            .eq("id", generationId);
          pollingRef.current.delete(predictionId);
          fetchGenerations();
          toast.error("Video generation failed");
          return true;
        }

        // Update progress based on attempts (estimated progress)
        const progress = Math.min(95, (attempts / maxAttempts) * 100);
        await supabase
          .from("generations")
          .update({
            settings: { resolution, aspectRatio, generateAudio, progress }
          })
          .eq("id", generationId);
        fetchGenerations();

        return false;
      } catch (e) {
        console.error("Poll error:", e);
        return false;
      }
    };

    const interval = setInterval(async () => {
      const done = await poll();
      if (done || attempts >= maxAttempts) {
        clearInterval(interval);
        pollingRef.current.delete(predictionId);
        if (attempts >= maxAttempts) {
          await supabase
            .from("generations")
            .update({ status: "failed", error: "Generation timed out" })
            .eq("id", generationId);
          fetchGenerations();
          toast.error("Video generation timed out");
        }
      }
    }, 3000);

    pollingRef.current.set(predictionId, interval as unknown as NodeJS.Timeout);
  }

  async function handleGenerate() {
    if (!user || !prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    if (balance !== null && balance < CREDITS_PER_VIDEO) {
      toast.error("Not enough credits", { description: `You need ${CREDITS_PER_VIDEO} credits. You have ${balance}.` });
      return;
    }

    setGenerating(true);

    try {
      // 1. Consume credits
      const { data: creditResult, error: creditError } = await supabase.rpc("consume_credits", {
        _tool: "video",
        _amount: CREDITS_PER_VIDEO,
      });

      if (creditError || !creditResult?.success) {
        throw new Error(creditResult?.error || creditError?.message || "Failed to deduct credits");
      }

      setBalance(creditResult.new_balance);

      // 2. Create generation record
      const { data: genData, error: genError } = await supabase
        .from("generations")
        .insert({
          user_id: user.id,
          tool_type: "video",
          prompt: prompt.trim(),
          settings: { resolution, aspectRatio, generateAudio, progress: 0 },
          status: "processing",
          credits_used: CREDITS_PER_VIDEO,
        })
        .select("id")
        .single();

      if (genError || !genData) {
        throw new Error("Failed to create generation record");
      }

      const generationId = genData.id;

      // 3. Call edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          resolution,
          aspect_ratio: aspectRatio,
          generate_audio: generateAudio,
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.error || "Generation failed");
      }

      // 4. Save prediction ID and start polling
      if (result.prediction_id) {
        await supabase
          .from("generations")
          .update({ external_id: result.prediction_id })
          .eq("id", generationId);

        pollForResult(result.prediction_id, generationId);
        fetchGenerations();
        toast.success("Video generation started!", { description: "This typically takes 2-3 minutes." });
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
          <Video className="size-5 text-white" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Video Generation</h1>
          <p className="text-muted-foreground text-sm">Create stunning AI videos from text prompts</p>
        </div>
        <Badge variant="outline" className="ml-auto">{CREDITS_PER_VIDEO} credits</Badge>
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
              placeholder="Describe your video scene... e.g., 'A cinematic drone shot of a futuristic city at night, neon lights reflecting on wet streets, slow motion'"
              rows={4}
              className="mt-1 bg-muted/50 border-border resize-none"
              disabled={generating}
            />
          </div>

          <div>
            <Label>Resolution</Label>
            <Select value={resolution} onValueChange={setResolution} disabled={generating}>
              <SelectTrigger className="mt-1 bg-muted/50 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={generating}>
              <SelectTrigger className="mt-1 bg-muted/50 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASPECT_RATIOS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
              <div>
                <Label className="text-sm font-medium">Generate audio</Label>
                <p className="text-xs text-muted-foreground mt-1">Add AI-generated sound effects and ambiance</p>
              </div>
              <Switch checked={generateAudio} onCheckedChange={setGenerateAudio} disabled={generating} />
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-muted-foreground">
              <Clock className="size-4 text-amber-500" />
              <span>Video generation takes 2-3 minutes. You can leave this page and check your <strong>History</strong> later.</span>
            </div>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
          className="mt-6 btn-gradient text-white border-0"
        >
          {generating ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" /> Starting...
            </>
          ) : (
            <>
              <Sparkles className="size-4 mr-2" /> Generate Video
            </>
          )}
        </Button>
      </Card>

      {/* History */}
      <div className="mt-10">
        <h2 className="font-display text-xl font-semibold">Your Videos</h2>

        {generations.length === 0 ? (
          <Card className="glass border-0 p-12 text-center mt-4">
            <Video className="size-12 mx-auto text-muted-foreground opacity-50" />
            <p className="mt-4 text-muted-foreground">No videos yet. Create your first one above!</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {generations.map((gen) => (
              <Card key={gen.id} className="glass border-0 overflow-hidden">
                <div className={`relative ${aspectRatio === "9:16" ? "aspect-[9/16]" : aspectRatio === "1:1" ? "aspect-square" : "aspect-video"} bg-black grid place-items-center`}>
                  {gen.result_url ? (
                    gen.result_url.endsWith(".mp4") || gen.result_url.includes("video") ? (
                      <video
                        src={gen.result_url}
                        controls
                        className="size-full object-contain"
                        onError={(e) => { console.error("Video error", e); }}
                      />
                    ) : (
                      <img
                        src={gen.result_url}
                        alt={gen.prompt}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    )
                  ) : gen.status === "processing" ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="size-10 animate-spin text-primary" />
                      <span className="text-sm text-white">Generating video...</span>
                      <Progress value={gen.settings?.progress || 0} className="w-32" />
                      <span className="text-xs text-muted-foreground">{gen.settings?.progress || 0}%</span>
                    </div>
                  ) : gen.status === "failed" ? (
                    <div className="flex flex-col items-center gap-2 text-destructive">
                      <AlertCircle className="size-8" />
                      <span className="text-sm">{gen.error || "Failed"}</span>
                    </div>
                  ) : (
                    <Video className="size-12 text-muted-foreground opacity-50" />
                  )}
                  {gen.is_favorite && gen.result_url && (
                    <div className="absolute top-2 right-2">
                      <Heart className="size-5 fill-red-500 text-red-500" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm line-clamp-2">{gen.prompt}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="border-border">{gen.settings?.resolution || "720p"}</Badge>
                    <Badge variant="outline" className="border-border">{gen.settings?.aspectRatio || "16:9"}</Badge>
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
