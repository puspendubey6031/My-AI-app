import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";

const router = Router();

router.post("/ai/story", async (req, res) => {
  const { idea, videoType, plan } = req.body as { idea?: string; videoType?: string; plan?: string };

  if (!idea || !videoType) {
    res.status(400).json({ error: "idea and videoType are required" });
    return;
  }

  if (plan !== "premium") {
    res.status(403).json({ error: "AI story generation requires the Premium plan" });
    return;
  }

  const prompt = `You are a professional video script writer for VirJoy AI.

The user wants to create a "${videoType}" style video with this idea:
"${idea}"

Generate a compelling video story and scene plan. Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "title": "A catchy, concise title",
  "story": "A 2-3 sentence narrative description of the overall video story",
  "scenes": [
    {
      "index": 1,
      "description": "Detailed visual description of this scene",
      "duration": 10,
      "effect": "zoom-in"
    }
  ]
}

Rules:
- Create 3-6 scenes based on the video type
- For "horror": dark, suspenseful, atmospheric
- For "ad": bright, punchy, product-focused  
- For "promo": energetic, inspiring, brand-focused
- For "vlog": casual, personal, authentic
- Effects must be one of: zoom-in, zoom-out, fade, pan-left, pan-right, cross-fade
- Total scene durations should sum to approximately 30-60 seconds
- Make it cinematic and compelling`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 8192 },
    });

    const text = response.text ?? "";
    const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();

    let parsed: { title: string; story: string; scenes: Array<{ index: number; description: string; duration: number; effect: string }> };
    try {
      parsed = JSON.parse(cleanedText);
    } catch {
      req.log.error({ text }, "Failed to parse Gemini response as JSON");
      res.status(500).json({ error: "AI returned invalid response format. Please try again." });
      return;
    }

    if (!parsed.title || !parsed.story || !Array.isArray(parsed.scenes)) {
      res.status(500).json({ error: "AI returned incomplete story data. Please try again." });
      return;
    }

    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Gemini AI story generation failed");
    res.status(500).json({ error: "AI generation failed. Please try again." });
  }
});

export default router;
