import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ReplicatePrediction {
  id: string;
  status: string;
  output?: string | null;
  error?: string;
}

const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN")!;
const REPLICATE_API_URL = "https://api.replicate.com/v1";

async function createVideoPrediction(
  prompt: string,
  resolution: string,
  aspectRatio: string,
  generateAudio: boolean,
  seed: number = 99
): Promise<ReplicatePrediction> {
  const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: "minimax/video-01",
      input: {
        seed,
        prompt: prompt.trim(),
        duration: 7,
        resolution,
        aspect_ratio: aspectRatio,
        generate_audio: generateAudio,
        reference_audios: [],
        reference_images: [],
        reference_videos: [],
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Replicate API error: ${response.status} ${error}`);
  }

  return response.json();
}

async function getPrediction(predictionId: string): Promise<ReplicatePrediction> {
  const response = await fetch(`${REPLICATE_API_URL}/predictions/${predictionId}`, {
    headers: {
      "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get prediction: ${response.status}`);
  }

  return response.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { prompt, resolution, aspect_ratio, generate_audio } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validResolutions = ["720p", "1080p"];
    const validAspectRatios = ["16:9", "9:16", "1:1"];

    const finalResolution = validResolutions.includes(resolution) ? resolution : "720p";
    const finalAspectRatio = validAspectRatios.includes(aspect_ratio) ? aspect_ratio : "16:9";
    const finalGenerateAudio = typeof generate_audio === "boolean" ? generate_audio : true;

    const prediction = await createVideoPrediction(
      prompt.trim(),
      finalResolution,
      finalAspectRatio,
      finalGenerateAudio
    );

    return new Response(JSON.stringify({
      success: true,
      prediction_id: prediction.id,
      status: prediction.status,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-video:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Internal server error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
