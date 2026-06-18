import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, x-client-info, apikey",
};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const FAL_API_KEY = Deno.env.get("FAL_API_KEY");
    if (!FAL_API_KEY) throw new Error("FAL_API_KEY missing");
    const body = await req.json();
    const { prompt, resolution, duration, aspect_ratio, generate_audio, image_urls, video_urls, audio_urls } = body;
    if (!prompt) throw new Error("Prompt required");
    const hasRef = (image_urls?.length > 0) || (video_urls?.length > 0);
    let modelId: string;
    let body: Record<string, unknown>;
    if (hasRef) {
      modelId = "bytedance/seedance-2.0/reference-to-video";
      body = {
        prompt,
        image_urls: image_urls || [],
        video_urls: video_urls || [],
        audio_urls: audio_urls || [],
        resolution: resolution || "720p",
        duration: duration || "auto",
        aspect_ratio: aspect_ratio || "auto",
        generate_audio: generate_audio ?? true,
        bitrate_mode: "standard",
      };
    } else {
      modelId = "bytedance/seedance-2.0/text-to-video";
      body = {
        prompt,
        resolution: resolution || "720p",
        duration: duration || "10",
        aspect_ratio: aspect_ratio || "auto",
        generate_audio: generate_audio ?? true,
        bitrate_mode: "standard",
        seed: Math.floor(Math.random() * 999999),
      };
    }
    console.log("[generate-video] Submitting to:", modelId);
    console.log("[generate-video] Body:", JSON.stringify(body));
    const submitRes = await fetch(`https://queue.fal.run/${modelId}`, {
      method: "POST",
      headers: { "Authorization": `Key ${FAL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!submitRes.ok) throw new Error(`Submit failed: ${await submitRes.text()}`);
    const submitData = await submitRes.json();
    console.log("[generate-video] Submit response:", JSON.stringify(submitData));
    // fal.ai returns status_url and response_url in the submit response
    return new Response(JSON.stringify({
      success: true,
      request_id: submitData.request_id,
      status_url: submitData.status_url,
      response_url: submitData.response_url,
      model_id: modelId,
      status: "queued",
    }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[generate-video] Error:", String(err));
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
