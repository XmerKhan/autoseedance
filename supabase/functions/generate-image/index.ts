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
    const { prompt, image_size, style, num_images, reference_images } = body;
    if (!prompt) throw new Error("Prompt required");
    const STYLES: Record<string, string> = {
      realistic: "photorealistic, high quality",
      illustration: "digital illustration, vibrant",
      vector: "vector art, flat design",
      "3d": "3D render, cinematic",
      anime: "anime style, manga art",
      oil: "oil painting",
      watercolor: "watercolor painting",
    };
    const finalPrompt = style && STYLES[style] ? `${prompt}, ${STYLES[style]}` : prompt;
    const hasRef = reference_images && reference_images.length > 0;
    let modelId: string;
    let falBody: Record<string, unknown>;
    if (hasRef) {
      modelId = "fal-ai/bytedance/seedream/v4.5/edit";
      falBody = {
        prompt: finalPrompt,
        image_size: image_size || "auto_4K",
        num_images: num_images || 1,
        max_images: 1,
        enable_safety_checker: true,
        image_urls: reference_images,
      };
    } else {
      modelId = "fal-ai/bytedance/seedream/v4.5/text-to-image";
      falBody = {
        prompt: finalPrompt,
        image_size: image_size || "auto_2K",
        num_images: num_images || 1,
        max_images: 1,
        enable_safety_checker: true,
        seed: Math.floor(Math.random() * 999999),
      };
    }
    console.log("[generate-image] Submitting to:", modelId);
    console.log("[generate-image] Body:", JSON.stringify(falBody));
    const submitRes = await fetch(`https://queue.fal.run/${modelId}`, {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(falBody),
    });
    const submitText = await submitRes.text();
    console.log("[generate-image] Submit response:", submitRes.status, submitText);
    if (!submitRes.ok) throw new Error(`Fal.ai submit error: ${submitRes.status} - ${submitText}`);
    const submitData = JSON.parse(submitText);
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
    console.error("[generate-image] Error:", String(err));
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
