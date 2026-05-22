const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// POST /api/ai-doctor/chat
router.post("/chat", async (req, res) => {
  try {
    const { message, vitals, userName } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Build vitals context string
    const vitalsContext = vitals
      ? `
The user's current health data is:
- Heart Rate: ${vitals.heartRate ? vitals.heartRate + " bpm" : "Not recorded"}
- Blood Pressure: ${vitals.bloodPressureSystolic ? `${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} mmHg` : "Not recorded"}
- Glucose Level: ${vitals.glucoseLevel ? vitals.glucoseLevel + " mg/dL" : "Not recorded"}
- BMI: ${vitals.bmi ? vitals.bmi : "Not recorded"}
- Stress Score: ${vitals.stressScore ? vitals.stressScore + "/100" : "Not recorded"}
- HRV: ${vitals.hrv ? vitals.hrv + " ms" : "Not recorded"}
      `.trim()
      : "No vitals data available for this user yet.";

    const systemPrompt = `You are NutriSense AI Doctor, a professional health and nutrition assistant for an IoT health monitoring app. 
You are talking to ${userName || "a user"}.

${vitalsContext}

Your role:
- Analyze the user's vitals when relevant to their question
- Give specific, actionable diet and nutrition advice based on their actual health data
- Explain what their vitals mean in simple terms
- Suggest lifestyle improvements based on their numbers
- Be warm, professional, and encouraging
- Keep responses concise (3-5 sentences max unless a detailed explanation is needed)
- Always remind users to consult a real doctor for medical decisions
- Never diagnose diseases — only provide health and nutrition guidance

If vitals are available, reference them directly in your response to make it personalized.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply = completion.choices[0]?.message?.content;
    if (!reply) {
      return res.status(500).json({ error: "No response from AI" });
    }

    res.json({ reply });

  } catch (error) {
    console.error("Groq AI Doctor error:", error.message);

    if (error.status === 401) {
      return res.status(500).json({ error: "Invalid Groq API key. Check your .env file." });
    }
    if (error.status === 429) {
      return res.status(429).json({ error: "AI rate limit reached. Please wait a moment." });
    }

    res.status(500).json({ error: "AI service unavailable. Please try again." });
  }
});

// POST /api/ai-doctor/analyze-vitals
// Automatically generates a full vitals report when user opens AI Doctor
router.post("/analyze-vitals", async (req, res) => {
  try {
    const { vitals, userName } = req.body;

    if (!vitals || !vitals.heartRate) {
      return res.json({
        analysis: null,
        message: "No vitals found. Please complete a heart scan first."
      });
    }

    const prompt = `
Analyze these health vitals for ${userName || "the user"} and give a brief 3-point health summary:
- Heart Rate: ${vitals.heartRate} bpm
- Blood Pressure: ${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} mmHg
- Glucose: ${vitals.glucoseLevel} mg/dL
- BMI: ${vitals.bmi}
- Stress Score: ${vitals.stressScore || "N/A"}/100
- HRV: ${vitals.hrv || "N/A"} ms

Respond in exactly this JSON format (no markdown, no explanation outside JSON):
{
  "overall": "Good / Fair / Needs Attention",
  "summary": "One sentence overall summary",
  "points": [
    "Point 1 about most important finding",
    "Point 2 about diet recommendation based on vitals",
    "Point 3 about lifestyle suggestion"
  ],
  "alert": "Any urgent concern or null if none"
}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 400,
    });

    let raw = completion.choices[0]?.message?.content || "";

    // Strip markdown code blocks if model wraps in ```json
    raw = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const analysis = JSON.parse(raw);
    res.json({ analysis });

  } catch (error) {
    console.error("Vitals analysis error:", error.message);
    res.status(500).json({ error: "Could not analyze vitals." });
  }
});

module.exports = router;
