import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RecraftResponse {
  data: Array<{
    url: string;
  }>;
}

interface ReplicatePrediction {
  id: string;
  status: string;
  output?: Array<string> | null;
  error?: string;
}

const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN")!;
const REPLICATE_API_URL = "https://api.replicate.com/v1";

async function createPrediction(prompt: string, size: string, style: string): Promise<ReplicatePrediction> {
  const sizeMap: Record<string, { width: number; height: number }> = {
    "1024x1024": { width: 1024, height: 1024 },
    "1365x1024": { width: 1365, height: 1024 },
    "1024x1365": { width: 1024, height: 1365 },
    "2048x2048": { width: 2048, height: 2048 },
  };

  const dimensions = sizeMap[size] || { width: 1024, height: 1024 };
  const aspectRatio = dimensions.width > dimensions.height ? "16:9" : dimensions.width < dimensions.height ? "9:16" : "1:1";

  const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
      "Prefer": "wait",
    },
    body: JSON.stringify({
      version: "recraft-ai/recraft-v3",
      input: {
        size,
        width: dimensions.width,
        height: dimensions.height,
        prompt,
        max_images: 1,
        image_input: [],
        aspect_ratio: aspectRatio,
        sequential_image_generation: "disabled",
        style,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Replicate API error: ${response.status} ${error}`);
  }

  return response.json();
}

async function pollPrediction(predictionId: string, maxAttempts = 60): Promise<ReplicatePrediction> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${REPLICATE_API_URL}/predictions/${predictionId}`, {
      headers: {
        "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to poll prediction: ${response.status}`);
    }

    const prediction: ReplicatePrediction = await response.json();

    if (prediction.status === "succeeded" && prediction.output) {
      return prediction;
    }

    if (prediction.status === "failed") {
      throw new Error(prediction.error || "Generation failed");
    }

    if (prediction.status === "canceled") {
      throw new Error("Generation was canceled");
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("Generation timed out");
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
    const { prompt, size, style } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validSizes = ["1024x1024", "1365x1024", "1024x1365", "2048x2048"];
    const validStyles = ["realistic", "digital_illustration", "vector_illustration", "icon"];

    const finalSize = validSizes.includes(size) ? size : "1024x1024";
    const finalStyle = validStyles.includes(style) ? style : "realistic";

    // Create prediction with Prefer: wait header for synchronous response
    const prediction = await createPrediction(prompt.trim(), finalSize, finalStyle);

    // If we got output immediately, return it
    if (prediction.status === "succeeded" && prediction.output && prediction.output.length > 0) {
      return new Response(JSON.stringify({
        success: true,
        image_url: prediction.output[0],
        prediction_id: prediction.id,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Otherwise, return the prediction ID for polling
    return new Response(JSON.stringify({
      success: true,
      prediction_id: prediction.id,
      status: prediction.status,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-image:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Internal server error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
