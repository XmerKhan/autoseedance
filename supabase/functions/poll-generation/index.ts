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
    const body = await req.json();
    const { request_id, model_id } = body;

    if (!request_id || !model_id) {
      return new Response(JSON.stringify({ error: "request_id and model_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const statusRes = await fetch(
      `https://queue.fal.run/${model_id}/requests/${request_id}/status`,
      {
        headers: { "Authorization": `Key ${FAL_API_KEY}` },
      }
    );
    const statusData = await statusRes.json();
    console.log("Poll status:", statusData.status);

    if (statusData.status === "COMPLETED") {
      const resultRes = await fetch(
        `https://queue.fal.run/${model_id}/requests/${request_id}`,
        {
          headers: { "Authorization": `Key ${FAL_API_KEY}` },
        }
      );
      const resultData = await resultRes.json();

      const videoUrl = resultData.video?.url;

      return new Response(JSON.stringify({
        success: true,
        status: "completed",
        video_url: videoUrl,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (statusData.status === "FAILED") {
      return new Response(JSON.stringify({
        success: false,
        status: "failed",
        error: "Video generation failed",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      status: statusData.status?.toLowerCase() || "processing",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("poll-generation error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
