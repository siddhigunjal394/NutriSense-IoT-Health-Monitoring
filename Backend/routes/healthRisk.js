const express = require('express');
const router  = express.Router();
const Groq    = require('groq-sdk');
const groq    = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.get('/:userId', async (req, res) => {
  try {
    const HealthData = require('../models/HealthData');
    const userId = req.params.userId;

    const since = new Date(); since.setDate(since.getDate() - 14);
    const records = await HealthData.find({ userId, timestamp: { $gte: since } }).sort({ timestamp: -1 });

    // Meals are embedded inside HealthData records
    const allMeals  = records.flatMap(r => r.meals || []);
    const lastScan  = records[0] || null;
    const heartRate = lastScan?.heartRate || 72;
    const days      = Math.max(1, records.length);
    const mealCount = Math.max(allMeals.length, 1);

    const totals = allMeals.reduce((acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein:  acc.protein  + (m.protein  || 0),
      carbs:    acc.carbs    + (m.carbs    || 0),
      fat:      acc.fat      + (m.fats     || 0), // schema uses 'fats'
      fiber:    acc.fiber    + (m.fiber    || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

    const avg = {
      calories: Math.round(totals.calories / mealCount),
      protein:  Math.round(totals.protein  / mealCount),
      carbs:    Math.round(totals.carbs    / mealCount),
      fat:      Math.round(totals.fat      / mealCount),
      fiber:    Math.round(totals.fiber    / mealCount),
    };

    // Risk scoring
    let diabetesScore = 0;
    if (avg.carbs > 300) diabetesScore += 25; else if (avg.carbs > 200) diabetesScore += 10;
    if (avg.fiber < 15)  diabetesScore += 20; else if (avg.fiber < 25)  diabetesScore += 8;
    if (avg.calories > 2500) diabetesScore += 15;
    diabetesScore = Math.min(100, diabetesScore);

    let hypertensionScore = 0;
    if (avg.fiber < 20)    hypertensionScore += 15;
    if (heartRate > 100)   hypertensionScore += 20; else if (heartRate > 90) hypertensionScore += 10;
    hypertensionScore = Math.min(100, hypertensionScore);

    let heartDiseaseScore = 0;
    if (avg.fat > 80)      heartDiseaseScore += 25; else if (avg.fat > 60) heartDiseaseScore += 10;
    if (heartRate > 100)   heartDiseaseScore += 20; else if (heartRate > 90) heartDiseaseScore += 10;
    if (avg.fiber < 15)    heartDiseaseScore += 15;
    heartDiseaseScore = Math.min(100, heartDiseaseScore);

    let obesityScore = 0;
    if (avg.calories > 2800)     obesityScore += 30; else if (avg.calories > 2200) obesityScore += 15;
    if (avg.protein  < 50)       obesityScore += 20;
    obesityScore = Math.min(100, obesityScore);

    const overallScore = Math.round((diabetesScore + hypertensionScore + heartDiseaseScore + obesityScore) / 4);
    const getLevel = (s) => s < 33 ? 'Low' : s < 66 ? 'Moderate' : 'High';

    // rPPG ↔ Diet Correlation
    let hrCorrelation;
    if (heartRate > 100) {
      hrCorrelation = { status: 'elevated', advice: `Your heart rate was ${heartRate} BPM (elevated). Magnesium-rich and omega-3 foods help reduce resting HR.`, suggestedFoods: ['Spinach', 'Almonds', 'Dark Chocolate', 'Salmon', 'Avocado', 'Bananas'] };
    } else if (heartRate < 60) {
      hrCorrelation = { status: 'low', advice: `Your heart rate was ${heartRate} BPM (low). Iron and B12-rich foods support energy and circulation.`, suggestedFoods: ['Red Meat', 'Lentils', 'Eggs', 'Fortified Cereals', 'Leafy Greens'] };
    } else {
      hrCorrelation = { status: 'normal', advice: `Your heart rate was ${heartRate} BPM (normal). Your diet supports healthy cardiovascular function!`, suggestedFoods: ['Oats', 'Berries', 'Nuts', 'Fish', 'Vegetables'] };
    }

    // AI recommendations
    let recommendations = [];
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: `Nutrition averages: calories=${avg.calories}, protein=${avg.protein}g, carbs=${avg.carbs}g, fat=${avg.fat}g, fiber=${avg.fiber}g, HR=${heartRate}BPM. Give exactly 3 short actionable diet tips as a JSON array of strings only.` }],
        max_tokens: 250,
      });
      const raw = completion.choices[0]?.message?.content || '[]';
      recommendations = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      recommendations = [
        avg.fiber   < 20 ? 'Increase fiber — add vegetables, lentils, oats daily.'     : 'Excellent fiber intake — keep it up.',
        avg.protein < 50 ? 'Increase protein — add eggs, legumes, or lean meat daily.' : 'Protein intake is good.',
        heartRate   > 90 ? 'Add magnesium-rich foods: spinach, almonds, dark chocolate.': 'Heart rate is healthy — maintain balanced diet.',
      ];
    }

    res.json({
      heartRate, hrCorrelation,
      diabetesRisk:     { score: diabetesScore,     level: getLevel(diabetesScore),     reason: diabetesScore < 33     ? 'Good fiber & carb balance.'  : 'High carb or low fiber detected.' },
      hypertensionRisk: { score: hypertensionScore, level: getLevel(hypertensionScore), reason: hypertensionScore < 33 ? 'Heart rate within range.'     : 'Elevated HR or low fiber.'        },
      heartDiseaseRisk: { score: heartDiseaseScore, level: getLevel(heartDiseaseScore), reason: heartDiseaseScore < 33 ? 'Good fat & HR balance.'       : 'High fat or elevated HR.'         },
      obesityRisk:      { score: obesityScore,      level: getLevel(obesityScore),      reason: obesityScore < 33      ? 'Calorie intake within range.' : 'High calories or low protein.'    },
      overallScore, daysAnalyzed: days, recommendations,
    });

  } catch (err) {
    console.error('Health risk error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
