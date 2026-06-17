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
    const { prompt, image_size, style, num_images, reference_images } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const STYLE_MAP: Record<string, string> = {
      realistic: "photorealistic, high quality photograph",
      illustration: "digital illustration, vibrant colors",
      vector: "vector art, clean lines, flat design",
      "3d": "3D render, cinematic lighting",
      anime: "anime style, manga art",
      oil: "oil painting, classical style",
      watercolor: "watercolor painting, soft colors",
    };
    const styleText = STYLE_MAP[style] || "";
    const finalPrompt = styleText ? `${prompt}, ${styleText}` : prompt;

    const hasReference = reference_images && reference_images.length > 0;

    let endpoint: string;
    let falBody: Record<string, unknown>;

    if (hasReference) {
      endpoint = "https://queue.fal.run/fal-ai/bytedance/seedream/v4.5/edit";
      falBody = {
        prompt: finalPrompt,
        image_urls: reference_images,
        image_size: image_size || "auto_2K",
        num_images: num_images || 1,
        max_images: 1,
        enable_safety_checker: true,
      };
    } else {
      endpoint = "https://queue.fal.run/fal-ai/bytedance/seedream/v4.5/text-to-image";
      falBody = {
        prompt: finalPrompt,
        image_size: image_size || "auto_2K",
        num_images: num_images || 1,
        max_images: 1,
        enable_safety_checker: true,
        seed: Math.floor(Math.random() * 999999),
      };
    }

    console.log("Submitting to:", endpoint);
    console.log("Body:", JSON.stringify(falBody));

    const submitRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(falBody),
    });

    const submitText = await submitRes.text();
    console.log("Submit response:", submitRes.status, submitText);

    if (!submitRes.ok) {
      return new Response(JSON.stringify({ error: `Fal.ai submit error: ${submitRes.status} - ${submitText}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const submitResult = JSON.parse(submitText);
    const requestId = submitResult.request_id;
    const modelId = hasReference
      ? "fal-ai/bytedance/seedream/v4.5/edit"
      : "fal-ai/bytedance/seedream/v4.5/text-to-image";

    // Poll for result (max 60 seconds)
    const statusUrl = `https://queue.fal.run/${modelId}/requests/${requestId}/status`;
    const resultUrl = `https://queue.fal.run/${modelId}/requests/${requestId}`;

    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const statusRes = await fetch(statusUrl, {
        headers: { "Authorization": `Key ${FAL_API_KEY}` },
      });
      const statusData = await statusRes.json();
      console.log("Status:", statusData.status);

      if (statusData.status === "COMPLETED") {
        const resultRes = await fetch(resultUrl, {
          headers: { "Authorization": `Key ${FAL_API_KEY}` },
        });
        const resultData = await resultRes.json();
        const imageUrls = resultData.images?.map((img: { url: string }) => img.url) || [];

        return new Response(JSON.stringify({
          success: true,
          image_urls: imageUrls,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (statusData.status === "FAILED") {
        return new Response(JSON.stringify({ error: "Generation failed on Fal.ai" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Generation timed out after 60 seconds" }), {
      status: 504,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("generate-image error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
