import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ToolNavbar } from "@/components/tools/ToolNavbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Image as ImageIcon, Loader as Loader2, Download, Heart, Trash2, Sparkles,
  X, Plus, Upload, ZoomIn, ChevronDown, ChevronUp, Copy, ArrowLeft
} from "lucide-react";
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

const SUPABASE_URL = "https://vcercajwtbjbvjhzivjb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjZXJjYWp3dGJqYnZqaHppdmpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MDczMjYsImV4cCI6MjA5NzA4MzMyNn0.cqIvDEmF6Yyz7bdFQBSrl5DTzcpv6YOxF2zbrFqAs1k";

const IMAGE_SIZES = [
  { value: "auto_2K", label: "Auto 2K" },
  { value: "square_hd", label: "Square HD" },
  { value: "landscape_4_3", label: "Landscape (4:3)" },
  { value: "portrait_4_3", label: "Portrait (4:3)" },
];

const STYLES = [
  { value: "realistic", label: "Realistic Photo" },
  { value: "illustration", label: "Digital Illustration" },
  { value: "vector", label: "Vector Art" },
  { value: "3d", label: "3D Render" },
  { value: "anime", label: "Anime/Manga" },
  { value: "oil", label: "Oil Painting" },
  { value: "watercolor", label: "Watercolor" },
];

type Generation = Tables<"generations">;

function ImageToolPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("text");
  const [prompt, setPrompt] = useState("");
  const [imageSize, setImageSize] = useState("auto_2K");
  const [style, setStyle] = useState("realistic");
  const [numImages, setNumImages] = useState(1);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const CREDITS_PER_IMAGE = 5;
  const MAX_PROMPT_LENGTH = 4000;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate({ to: "/login", replace: true });
        return;
      }
      setUserId(user.id);
    });
  }, [navigate]);

  async function fetchGenerations(uid: string) {
    const { data } = await supabase
      .from("generations")
      .select("*")
      .eq("user_id", uid)
      .eq("tool_type", "image")
      .order("created_at", { ascending: false })
      .limit(30);
    setGenerations((data as Generation[]) ?? []);
  }

  useEffect(() => {
    if (!userId) return;
    fetchGenerations(userId);
    const channel = supabase
      .channel("image-generations")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "generations", filter: `user_id=eq.${userId}` }, () => fetchGenerations(userId))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (referenceImages.length >= 10) { toast.error("Maximum 10 reference images"); return; }
      if (file.size > 10 * 1024 * 1024) { toast.error("File too large (max 10MB)"); return; }
      const reader = new FileReader();
      reader.onload = (event) => { const base64 = event.target?.result as string; if (base64) setReferenceImages((prev) => [...prev, base64]); };
      reader.readAsDataURL(file);
    });
  }, [referenceImages.length]);

  const addUrl = useCallback(() => {
    if (!urlInput.trim()) return;
    if (referenceImages.length >= 10) { toast.error("Maximum 10 reference images"); return; }
    setReferenceImages((prev) => [...prev, urlInput.trim()]);
    setUrlInput("");
  }, [urlInput, referenceImages.length]);

  const removeImage = useCallback((index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  async function handleGenerate() {
    if (!userId) { navigate({ to: "/login", replace: true }); return; }
    if (!prompt.trim()) { toast.error("Please enter a prompt"); return; }
    if (prompt.length > MAX_PROMPT_LENGTH) { toast.error(`Prompt too long (max ${MAX_PROMPT_LENGTH} characters)`); return; }

    const { data: wallet } = await supabase.from("credit_wallets").select("balance").eq("user_id", userId).maybeSingle();
    if (wallet && wallet.balance < CREDITS_PER_IMAGE * numImages) {
      toast.error("Insufficient credits — Upgrade your plan", { action: { label: "Upgrade", onClick: () => window.location.href = "/pricing" } });
      return;
    }

    setGenerating(true);
    try {
      const { data: creditResult, error: creditError } = await supabase.rpc("consume_credits", { _tool: "image", _amount: CREDITS_PER_IMAGE * numImages });
      if (creditError || !creditResult?.success) throw new Error(creditResult?.error || creditError?.message || "Failed to deduct credits");

      const { data: genData, error: genError } = await supabase
        .from("generations")
        .insert({ user_id: userId, tool_type: "image", prompt: prompt.trim(), settings: { image_size: imageSize, style, num_images: numImages, has_reference_images: activeTab === "reference" }, status: "processing", credits_used: CREDITS_PER_IMAGE * numImages })
        .select("id")
        .single();

      if (genError || !genData) throw new Error("Failed to create generation record");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 70000);

      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          prompt: prompt.trim(), image_size: imageSize, style, num_images: numImages,
          reference_images: activeTab === "reference" ? referenceImages : undefined,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || "Generation failed");

      if (result.image_urls && result.image_urls.length > 0) {
        const primaryUrl = result.image_urls[0];
        await supabase.from("generations").update({ status: "done", result_url: primaryUrl, thumbnail_url: primaryUrl }).eq("id", genData.id);
        toast.success("Image generated!");
        fetchGenerations(userId);
        setLightboxImage(primaryUrl);
      } else {
        throw new Error("No images returned");
      }

      setPrompt("");
      setReferenceImages([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  }

  async function toggleFavorite(id: string, current: boolean) {
    await supabase.from("generations").update({ is_favorite: !current }).eq("id", id);
    if (userId) fetchGenerations(userId);
  }

  async function deleteGeneration(id: string) {
    await supabase.from("generations").delete().eq("id", id);
    if (userId) fetchGenerations(userId);
  }

  function copyPrompt(gen: Generation) {
    setPrompt(gen.prompt);
    if (gen.settings?.style) setStyle(gen.settings.style as string);
    if (gen.settings?.image_size) setImageSize(gen.settings.image_size as string);
    toast.success("Prompt copied to form");
  }

  if (!userId) return null;

  return (
    <div className="min-h-screen bg-background pt-14">
      <ToolNavbar title="Image Generation" />
      <div className="p-6 md:p-10 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition"><ArrowLeft className="size-5" /></Link>
          <div className="size-10 rounded-xl btn-gradient grid place-items-center">
            <ImageIcon className="size-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Image Generation</h1>
            <p className="text-muted-foreground text-sm">Create stunning AI images from text prompts</p>
          </div>
          <Badge variant="outline" className="ml-auto">{CREDITS_PER_IMAGE} credits</Badge>
        </div>

        <Card className="glass border-0 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="text">Text to Image</TabsTrigger>
              <TabsTrigger value="reference">Reference to Image</TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4">
              <div>
                <div className="flex justify-between items-center">
                  <Label>Prompt</Label>
                  <span className="text-xs text-muted-foreground">{prompt.length}/{MAX_PROMPT_LENGTH}</span>
                </div>
                <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe your image... e.g., 'A serene mountain lake at sunset, golden hour lighting, photorealistic'" rows={4} className="mt-1 bg-muted/50 border-border resize-none" disabled={generating} maxLength={MAX_PROMPT_LENGTH} />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Image Size</Label>
                  <Select value={imageSize} onValueChange={setImageSize} disabled={generating}>
                    <SelectTrigger className="mt-1 bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>{IMAGE_SIZES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Style</Label>
                  <Select value={style} onValueChange={setStyle} disabled={generating}>
                    <SelectTrigger className="mt-1 bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>{STYLES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Number of Images</Label>
                  <Select value={numImages.toString()} onValueChange={(v) => setNumImages(parseInt(v))} disabled={generating}>
                    <SelectTrigger className="mt-1 bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>{[1, 2, 3, 4].map((n) => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reference" className="space-y-4">
              <div>
                <div className="flex justify-between items-center">
                  <Label>Prompt</Label>
                  <span className="text-xs text-muted-foreground">{prompt.length}/{MAX_PROMPT_LENGTH}</span>
                </div>
                <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe your image. The reference image will guide the AI style and composition." rows={4} className="mt-1 bg-muted/50 border-border resize-none" disabled={generating} maxLength={MAX_PROMPT_LENGTH} />
              </div>

              <div>
                <Label>Reference Image (1)</Label>
                <p className="text-xs text-muted-foreground mb-2">This image guides the AI style and composition</p>
                <div className="p-4 border-2 border-dashed border-border rounded-lg bg-muted/30">
                  <div className="flex flex-wrap gap-3 mb-4">
                    {referenceImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img src={img} alt="Reference" className="w-20 h-20 object-cover rounded-lg border border-border" />
                        <button onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 size-5 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center"><X className="size-3" /></button>
                      </div>
                    ))}
                  </div>
                  {referenceImages.length < 1 && (
                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg cursor-pointer transition">
                        <Upload className="size-4" /><span className="text-sm">Upload File</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileUpload} className="hidden" disabled={generating} />
                      </label>
                      <div className="flex items-center gap-2">
                        <Input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="Paste image URL..." className="bg-muted/50 border-border w-48" disabled={generating} />
                        <Button type="button" variant="outline" size="sm" onClick={addUrl} disabled={generating || !urlInput.trim()}><Plus className="size-4" /></Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Image Size</Label>
                  <Select value={imageSize} onValueChange={setImageSize} disabled={generating}>
                    <SelectTrigger className="mt-1 bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>{IMAGE_SIZES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Style</Label>
                  <Select value={style} onValueChange={setStyle} disabled={generating}>
                    <SelectTrigger className="mt-1 bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>{STYLES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Number of Images</Label>
                  <Select value={numImages.toString()} onValueChange={(v) => setNumImages(parseInt(v))} disabled={generating}>
                    <SelectTrigger className="mt-1 bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>{[1, 2, 3, 4].map((n) => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-muted-foreground mt-4">
            <ImageIcon className="size-4 text-amber-500" />
            <span>Image generation takes ~20-60 seconds. Hang tight!</span>
          </div>

          <Button onClick={handleGenerate} disabled={generating || !prompt.trim()} className="mt-6 btn-gradient text-white border-0">
            {generating ? <><Loader2 className="size-4 mr-2 animate-spin" /> Generating your image...</> : <><Sparkles className="size-4 mr-2" /> Generate ({CREDITS_PER_IMAGE * numImages} credits)</>}
          </Button>
        </Card>

        <div className="mt-10">
          <h2 className="font-display text-xl font-semibold">Your Generations</h2>
          {generations.length === 0 ? (
            <Card className="glass border-0 p-12 text-center mt-4">
              <ImageIcon className="size-12 mx-auto text-muted-foreground opacity-50" />
              <p className="mt-4 text-muted-foreground">No images yet. Create your first one above!</p>
            </Card>
          ) : (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 mt-4">
              {generations.map((gen) => (
                <Card key={gen.id} className="glass border-0 overflow-hidden break-inside-avoid group">
                  <div className="relative bg-muted">
                    {gen.result_url ? (
                      <img src={gen.result_url} alt={gen.prompt} className="w-full cursor-zoom-in" loading="lazy" onClick={() => setLightboxImage(gen.result_url)} />
                    ) : gen.status === "processing" ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-2">
                        <Loader2 className="size-8 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">Generating...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16"><ImageIcon className="size-12 text-muted-foreground opacity-50" /></div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => copyPrompt(gen)}><Copy className="size-4" /></Button>
                      {gen.result_url && <Button size="sm" variant="secondary" onClick={() => setLightboxImage(gen.result_url)}><ZoomIn className="size-4" /></Button>}
                      {gen.result_url && (
                        <Button size="sm" variant="secondary" asChild>
                          <a href={gen.result_url} download target="_blank" rel="noopener noreferrer"><Download className="size-4" /></a>
                        </Button>
                      )}
                      <Button size="sm" variant="secondary" onClick={() => toggleFavorite(gen.id, gen.is_favorite)}>
                        <Heart className={`size-4 ${gen.is_favorite ? "fill-red-500 text-red-500" : ""}`} />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteGeneration(gen.id)}><Trash2 className="size-4" /></Button>
                    </div>
                    {gen.is_favorite && <div className="absolute top-2 right-2"><Heart className="size-5 fill-red-500 text-red-500 drop-shadow" /></div>}
                  </div>
                  <div className="p-3">
                    <p className="text-sm line-clamp-2">{gen.prompt}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">{gen.settings?.style || "realistic"}</Badge>
                      <span>{gen.credits_used} cr</span>
                      <span className="ml-auto">{new Date(gen.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {lightboxImage && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
            <button className="absolute top-4 right-4 text-white/80 hover:text-white" onClick={() => setLightboxImage(null)}><X className="size-8" /></button>
            <img src={lightboxImage} alt="Full size" className="max-w-full max-h-full object-contain" />
            <a href={lightboxImage} download target="_blank" rel="noopener noreferrer" className="absolute bottom-4 right-4" onClick={(e) => e.stopPropagation()}>
              <Button className="btn-gradient text-white border-0"><Download className="size-4 mr-2" /> Download</Button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
