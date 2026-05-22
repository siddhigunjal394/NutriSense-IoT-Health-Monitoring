const express = require('express');
const router  = express.Router();
const Groq    = require('groq-sdk');
const groq    = new Groq({ apiKey: process.env.GROQ_API_KEY });

const ACTIVITY_MULTIPLIERS = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };

// POST /api/bmi/calculate
router.post('/calculate', async (req, res) => {
  try {
    const { weight, height, age, gender, activityLevel, userId } = req.body;
    const w = parseFloat(weight), h = parseFloat(height), a = parseInt(age);

    // BMI
    const heightM = h / 100;
    const bmi     = parseFloat((w / (heightM * heightM)).toFixed(1));
    const category = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal Weight' : bmi < 30 ? 'Overweight' : 'Obese';

    // Body fat % — Jackson-Pollock formula approximation
    let bodyFatPercent;
    if (gender === 'male') {
      bodyFatPercent = parseFloat((1.20 * bmi + 0.23 * a - 16.2).toFixed(1));
    } else {
      bodyFatPercent = parseFloat((1.20 * bmi + 0.23 * a - 5.4).toFixed(1));
    }
    bodyFatPercent = Math.max(5, Math.min(50, bodyFatPercent));

    // Ideal weight — Devine formula
    const idealWeight = gender === 'male'
      ? parseFloat((50 + 2.3 * ((h - 152.4) / 2.54)).toFixed(1))
      : parseFloat((45.5 + 2.3 * ((h - 152.4) / 2.54)).toFixed(1));

    // BMR — Mifflin-St Jeor
    const bmr = gender === 'male'
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161;

    // TDEE
    const tdee = Math.round(bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || 1.55));

    // Goal calories
    const goalCalories = bmi < 18.5 ? tdee + 300 : bmi > 25 ? tdee - 500 : tdee;

    // Macro targets (g)
    const proteinTarget = Math.round(w * 1.6);  // 1.6g per kg bodyweight
    const fatTarget     = Math.round((goalCalories * 0.25) / 9);
    const carbsTarget   = Math.round((goalCalories - proteinTarget * 4 - fatTarget * 9) / 4);

    // AI advice
    let aiAdvice = '';
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: `BMI=${bmi} (${category}), body fat=${bodyFatPercent}%, age=${a}, gender=${gender}. Give one specific, encouraging 2-sentence diet tip. Be concise.` }],
        max_tokens: 100,
      });
      aiAdvice = completion.choices[0]?.message?.content || '';
    } catch { aiAdvice = `Focus on ${category === 'Underweight' ? 'calorie-dense nutritious foods' : category === 'Normal Weight' ? 'maintaining your balanced diet' : 'reducing refined carbs and increasing fiber'}.`; }

    res.json({ bmi, category, bodyFatPercent, idealWeight, tdee, goalCalories, proteinTarget, carbsTarget, fatTarget, aiAdvice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bmi/:userId
router.get('/:userId', async (req, res) => {
  try {
    const BMIRecord = require('../models/BMIRecord');
    const record = await BMIRecord.findOne({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(record || {});
  } catch { res.json({}); }
});

// POST /api/bmi/save
router.post('/save', async (req, res) => {
  try {
    const BMIRecord = require('../models/BMIRecord');
    const { userId, form, result } = req.body;
    await BMIRecord.findOneAndUpdate({ userId }, { userId, ...form, result }, { upsert: true, new: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
