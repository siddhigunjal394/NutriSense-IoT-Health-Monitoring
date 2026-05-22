const express  = require('express');
const multer   = require('multer');
const Groq     = require('groq-sdk');
const fs       = require('fs');
const router   = express.Router();

const groq   = new Groq({ apiKey: process.env.GROQ_API_KEY });
const upload = multer({ dest: 'uploads/tmp/', limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/food/analyze
router.post('/analyze', upload.single('image'), async (req, res) => {
  const filePath = req.file?.path;
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType    = req.file.mimetype || 'image/jpeg';

    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
          { type: 'text', text: `You are a nutrition expert AI. Analyze this food image and respond ONLY with a valid JSON object (no markdown):
{
  "foodName": "exact food name",
  "emoji": "food emoji",
  "portionSize": "e.g. 1 cup, 1 plate",
  "confidence": "High/Medium/Low",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "healthScore": number 1-10,
  "allergens": ["array"],
  "aiSuggestion": "1 sentence health tip",
  "healthierSwap": "healthier alternative"
}` },
        ],
      }],
      max_tokens: 500,
    });

    const raw     = completion.choices[0]?.message?.content || '{}';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const data    = JSON.parse(cleaned);
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({
      foodName:      data.foodName      || 'Unknown Food',
      emoji:         data.emoji         || '🍽️',
      portionSize:   data.portionSize   || '1 serving',
      confidence:    data.confidence    || 'Medium',
      calories:      Math.round(data.calories    || 250),
      protein:       Math.round(data.protein     || 10),
      carbs:         Math.round(data.carbs       || 30),
      fat:           Math.round(data.fat         || 8),
      fiber:         Math.round(data.fiber       || 3),
      healthScore:   data.healthScore   || 5,
      allergens:     data.allergens     || [],
      aiSuggestion:  data.aiSuggestion  || '',
      healthierSwap: data.healthierSwap || '',
    });
  } catch (err) {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    console.error('Food analyze error:', err.message);
    res.status(500).json({ error: 'Failed to analyze food image.' });
  }
});

// POST /api/food/log-meal — uses your existing HealthData embedded meals
router.post('/log-meal', async (req, res) => {
  try {
    const HealthData = require('../models/HealthData');
    const { userId, foodName, calories, protein, carbs, fat, fiber } = req.body;

    // Find today's record or create one
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    let record = await HealthData.findOne({ userId, timestamp: { $gte: today, $lt: tomorrow } });

    const mealEntry = {
      description:   foodName,
      calories:      calories  || 0,
      protein:       protein   || 0,
      carbs:         carbs     || 0,
      fats:          fat       || 0,  // schema uses 'fats'
      fiber:         fiber     || 0,
      healthScore:   req.body.healthScore  || 5,
      suggestion:    req.body.aiSuggestion || '',
      healthierSwap: req.body.healthierSwap|| '',
    };

    if (record) {
      record.meals.push(mealEntry);
      await record.save();
    } else {
      record = new HealthData({ userId, heartRate: 72, meals: [mealEntry] });
      await record.save();
    }

    // Gamification
    try {
      const { updateGamification } = require('./gamification');
      await updateGamification(userId, 'meal_logged');
      if (req.body.source === 'photo_scan') await updateGamification(userId, 'photo_scan');
    } catch (e) { console.log('Gamification skipped:', e.message); }

    res.json({ success: true, meal: mealEntry });
  } catch (err) {
    console.error('Log meal error:', err.message);
    res.status(500).json({ error: 'Failed to log meal: ' + err.message });
  }
});

module.exports = router;
