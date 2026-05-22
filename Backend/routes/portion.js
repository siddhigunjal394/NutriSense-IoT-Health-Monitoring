// FILE: Backend/routes/portion.js
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const Groq    = require('groq-sdk');
const fs      = require('fs');

const groq   = new Groq({ apiKey: process.env.GROQ_API_KEY });
const upload = multer({ dest: 'uploads/tmp/', limits: { fileSize: 10 * 1024 * 1024 } });

// Reference object real-world sizes in cm²
const REFERENCE_SIZES = {
  credit_card: { area: 46.4,  name: 'Credit Card (85.6×54mm)'  },
  coin_10:     { area: 5.73,  name: '10 Rs Coin (27mm dia)'    },
  hand:        { area: 160,   name: 'Average Hand'             },
  spoon:       { area: 8.5,   name: 'Tablespoon'               },
};

// Food density lookup (g per cm³) — research-based approximate values
const FOOD_DENSITY = {
  rice:        0.7,  pasta:       0.5,  bread:      0.3,
  chicken:     1.0,  meat:        1.0,  fish:       0.9,
  salad:       0.15, vegetables:  0.4,  fruit:      0.6,
  curry:       0.85, dal:         0.75, roti:       0.4,
  idli:        0.45, dosa:        0.2,  biryani:    0.7,
  default:     0.6,
};

function estimateGrams(foodName, estimatedAreaCm2, heightCm = 3) {
  const name = foodName.toLowerCase();
  let density = FOOD_DENSITY.default;
  for (const [key, val] of Object.entries(FOOD_DENSITY)) {
    if (name.includes(key)) { density = val; break; }
  }
  const volumeCm3 = estimatedAreaCm2 * heightCm;
  return Math.round(volumeCm3 * density * 100) / 100;
}

// POST /api/portion/analyze
router.post('/analyze', upload.single('image'), async (req, res) => {
  const filePath = req.file?.path;
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const refObjId  = req.body.referenceObject || 'credit_card';
    const refObj    = REFERENCE_SIZES[refObjId] || REFERENCE_SIZES.credit_card;

    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType    = req.file.mimetype || 'image/jpeg';

    // Ask Groq vision to analyze food + estimate relative size
    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64Image}` },
          },
          {
            type: 'text',
            text: `You are a nutrition and computer vision expert. Analyze this food image.
A ${refObj.name} (area: ${refObj.area} cm²) is placed next to the food as a reference.

Respond ONLY with a valid JSON object (no markdown):
{
  "foodName": "specific food name",
  "emoji": "food emoji",
  "foodAreaRatio": number (estimated food area / reference object area, e.g. 2.5 means food appears 2.5x larger than reference),
  "estimatedHeightCm": number (estimated food height/thickness in cm),
  "portionDescription": "e.g. 1 medium bowl, 2 rotis, half plate",
  "portionComparison": "e.g. Similar to 1 tennis ball, or fits in 2 cupped hands",
  "caloriesPer100g": number,
  "proteinPer100g": number,
  "carbsPer100g": number,
  "fatPer100g": number,
  "fiberPer100g": number,
  "confidence": "High/Medium/Low",
  "aiNote": "one sentence health tip about this portion size"
}
If reference object not visible, estimate based on plate/context. Be specific.`,
          },
        ],
      }],
      max_tokens: 600,
    });

    const raw     = completion.choices[0]?.message?.content || '{}';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const data    = JSON.parse(cleaned);

    // Calculate actual area and grams
    const foodAreaCm2    = refObj.area * (data.foodAreaRatio || 2);
    const estimatedGrams = estimateGrams(data.foodName || '', foodAreaCm2, data.estimatedHeightCm || 3);

    // Scale nutrition from per-100g to actual grams
    const scale = estimatedGrams / 100;
    const calories = Math.round((data.caloriesPer100g || 150) * scale);
    const protein  = Math.round((data.proteinPer100g  || 5)   * scale * 10) / 10;
    const carbs    = Math.round((data.carbsPer100g    || 20)  * scale * 10) / 10;
    const fat      = Math.round((data.fatPer100g      || 5)   * scale * 10) / 10;
    const fiber    = Math.round((data.fiberPer100g    || 2)   * scale * 10) / 10;

    fs.unlinkSync(filePath);

    res.json({
      foodName:          data.foodName          || 'Unknown Food',
      emoji:             data.emoji             || '🍽️',
      estimatedGrams,
      portionDescription: data.portionDescription || '1 serving',
      portionComparison:  data.portionComparison  || '',
      confidence:        data.confidence        || 'Medium',
      calories,
      protein,
      carbs,
      fat,
      fiber,
      aiNote: data.aiNote || '',
    });

  } catch (err) {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    console.error('Portion analyze error:', err.message);
    res.status(500).json({ error: 'Failed to estimate portion. Try a clearer photo with the reference object visible.' });
  }
});

module.exports = router;
