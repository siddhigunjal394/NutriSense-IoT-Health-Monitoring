const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const HealthData = require("../models/HealthData");
const User = require("../models/User");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── POST /api/meals/analyze ──────────────────────────────────────
// Analyze meal text with Groq AI — returns calories + macros + tips
router.post("/analyze", async (req, res) => {
  try {
    const { mealDescription, userId } = req.body;

    if (!mealDescription?.trim()) {
      return res.status(400).json({ error: "Meal description is required" });
    }

    // Fetch user profile for personalized advice
    let userContext = "";
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        userContext = `
User profile:
- Age: ${user.age}, Gender: ${user.gender}
- BMI: ${user.bmi || "unknown"}
- Medical condition: ${user.medicalCondition || "none"}
- Weight: ${user.weight || "unknown"} kg`;
      }
    }

    const prompt = `You are a professional nutritionist AI. Analyze this Indian/general meal and return ONLY a JSON object.

Meal described: "${mealDescription}"
${userContext}

Return ONLY this JSON (no markdown, no explanation, no code blocks):
{
  "calories": <realistic integer>,
  "protein": <grams as integer>,
  "carbs": <grams as integer>,
  "fats": <grams as integer>,
  "fiber": <grams as integer>,
  "sugar": <grams as integer>,
  "sodium": <mg as integer>,
  "healthScore": <integer 1-10 where 10 is healthiest>,
  "scoreReason": "<one sentence why this score>",
  "suggestion": "<one specific actionable tip to make this meal healthier>",
  "healthierSwap": "<a specific healthier alternative meal>",
  "mealType": "<Breakfast / Lunch / Dinner / Snack>",
  "portionNote": "<brief note about portion size if relevant>"
}

Be accurate for Indian foods like dal, roti, rice, paratha, idli, dosa, sabzi, curry etc.
Base calories on standard Indian portion sizes unless quantity is mentioned.`;

    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,   // low temp = more consistent numbers
      max_tokens: 400,
    });

    let raw = completion.choices[0]?.message?.content || "";
    // Strip markdown if model wraps response
    raw = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    // Extract JSON if there's extra text around it
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI returned invalid format");
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate essential fields exist
    if (!result.calories || !result.protein) {
      throw new Error("Incomplete nutrition data from AI");
    }

    res.json({ success: true, result });

  } catch (error) {
    console.error("Meal analyze error:", error.message);

    if (error.status === 429) {
      return res.status(429).json({ error: "AI rate limit. Please wait a moment and try again." });
    }

    res.status(500).json({ error: "Could not analyze meal. Please try again." });
  }
});

// ── POST /api/meals/save ─────────────────────────────────────────
// Save analyzed meal to the latest health record (or create a basic one)
router.post("/save", async (req, res) => {
  try {
    const { userId, mealData } = req.body;

    if (!userId || !mealData) {
      return res.status(400).json({ error: "userId and mealData are required" });
    }

    const mealEntry = {
      description: mealData.description,
      calories: mealData.calories,
      protein: mealData.protein,
      carbs: mealData.carbs,
      fats: mealData.fats,
      fiber: mealData.fiber,
      healthScore: mealData.healthScore,
      suggestion: mealData.suggestion,
      healthierSwap: mealData.healthierSwap,
      loggedAt: new Date()
    };

    // Try to push to today's health record
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let healthRecord = await HealthData.findOne({
      userId,
      timestamp: { $gte: todayStart }
    }).sort({ timestamp: -1 });

    if (healthRecord) {
      // Add meal to today's record
      healthRecord.meals.push(mealEntry);
      await healthRecord.save();
    } else {
      // No health record today — get latest and add there
      healthRecord = await HealthData.findOne({ userId }).sort({ timestamp: -1 });
      if (healthRecord) {
        healthRecord.meals.push(mealEntry);
        await healthRecord.save();
      } else {
        return res.status(404).json({ error: "No health record found. Please log your vitals first." });
      }
    }

    res.json({ success: true, message: "Meal saved successfully", meal: mealEntry });

  } catch (error) {
    console.error("Meal save error:", error.message);
    res.status(500).json({ error: "Could not save meal." });
  }
});

// ── GET /api/meals/history/:userId ───────────────────────────────
// Get all meals logged by this user (last 7 days)
router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const records = await HealthData.find({
      userId,
      timestamp: { $gte: sevenDaysAgo },
      "meals.0": { $exists: true }   // only records that have meals
    }).sort({ timestamp: -1 });

    // Flatten all meals with their date
    const allMeals = [];
    records.forEach(record => {
      record.meals.forEach(meal => {
        allMeals.push({
          ...meal.toObject(),
          recordDate: record.timestamp
        });
      });
    });

    // Sort by most recent first
    allMeals.sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt));

    // Daily totals for the summary bar
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMeals = allMeals.filter(m => new Date(m.loggedAt) >= todayStart);
    const dailyTotals = {
      calories: todayMeals.reduce((s, m) => s + (m.calories || 0), 0),
      protein: todayMeals.reduce((s, m) => s + (m.protein || 0), 0),
      carbs: todayMeals.reduce((s, m) => s + (m.carbs || 0), 0),
      fats: todayMeals.reduce((s, m) => s + (m.fats || 0), 0),
      count: todayMeals.length
    };

    res.json({ meals: allMeals, dailyTotals });

  } catch (error) {
    console.error("Meal history error:", error.message);
    res.status(500).json({ error: "Could not fetch meal history." });
  }
});

module.exports = router;