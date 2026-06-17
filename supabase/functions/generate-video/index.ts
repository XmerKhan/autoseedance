import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization, x-client-info, apikey",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FAL_API_KEY = Deno.env.get("FAL_API_KEY");
    if (!FAL_API_KEY) {
      return new Response(JSON.stringify({ error: "FAL_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      prompt,
      resolution,
      duration,
      aspect_ratio,
      generate_audio,
      image_urls,
      video_urls,
      audio_urls,
    } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hasReference = (image_urls?.length > 0) || (video_urls?.length > 0);

    let modelId: string;
    let falBody: Record<string, unknown>;

    if (hasReference) {
      modelId = "bytedance/seedance-2.0/reference-to-video";
      falBody = {
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
      falBody = {
        prompt,
        resolution: resolution || "720p",
        duration: duration || "auto",
        aspect_ratio: aspect_ratio || "auto",
        generate_audio: generate_audio ?? true,
        bitrate_mode: "standard",
        seed: Math.floor(Math.random() * 999999),
      };
    }

    const endpoint = `https://queue.fal.run/${modelId}`;
    console.log("Submitting video to:", endpoint);

    const submitRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(falBody),
    });

    const submitText = await submitRes.text();
    console.log("Video submit:", submitRes.status, submitText);

    if (!submitRes.ok) {
      return new Response(JSON.stringify({ error: `Fal.ai error: ${submitRes.status} - ${submitText}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const submitResult = JSON.parse(submitText);

    return new Response(JSON.stringify({
      success: true,
      request_id: submitResult.request_id,
      model_id: modelId,
      status: "queued",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("generate-video error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
