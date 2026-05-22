const express = require('express');
const router  = express.Router();
const Groq    = require('groq-sdk');

// Initialize Groq inside the route (not at module level) to ensure .env is loaded
const getGroq = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

const NUTRITION_KB = [
  { tags: ['heart rate','elevated','high bpm'],         fact: 'Elevated heart rate is linked to high sodium and low magnesium. Foods like spinach, almonds, avocado, and bananas help reduce resting HR.' },
  { tags: ['low heart rate','low bpm'],                 fact: 'Low heart rate may indicate iron or B12 deficiency. Include red meat, lentils, eggs, and fortified cereals.' },
  { tags: ['diabetes','blood sugar','insulin','sugar'],  fact: 'To reduce diabetes risk: limit refined carbs, increase fiber (25-35g/day), choose low-GI foods like oats, legumes, non-starchy vegetables.' },
  { tags: ['hypertension','blood pressure','sodium'],    fact: 'DASH diet reduces hypertension: limit sodium below 2300mg/day, increase potassium (bananas, sweet potato), magnesium and calcium.' },
  { tags: ['heart disease','cardiovascular','omega'],    fact: 'Heart-healthy diet: increase omega-3 (salmon, walnuts, flaxseed), reduce saturated fat, eat more fiber, avoid trans fats.' },
  { tags: ['weight loss','fat loss','calories','diet'],  fact: 'For weight loss: 500 calorie deficit/day leads to ~0.5kg/week loss. High protein (1.6g/kg) preserves muscle.' },
  { tags: ['muscle','protein','strength','gym'],         fact: 'For muscle gain: 1.6-2.2g protein per kg bodyweight. Post-workout: protein + carbs within 30 min.' },
  { tags: ['fiber','gut','digestion'],                   fact: 'Aim 25-35g fiber/day. Sources: oats (4g/cup), lentils (15g/cup), broccoli (5g/cup), chia seeds (10g/2tbsp).' },
  { tags: ['protein','amino'],                           fact: 'Complete proteins: chicken (31g/100g), eggs (13g/2 eggs), Greek yogurt (17g/cup), lentils (18g/cup).' },
  { tags: ['vitamin','deficiency','iron','b12'],         fact: 'Common deficiencies in India: Vitamin D (sun+milk), B12 (eggs/meat/supplements), Iron (lentils+vitamin C).' },
  { tags: ['meal plan','what should i eat','plan','today'], fact: 'Balanced Indian meal: breakfast=oats/idli+sambar, lunch=dal+rice+sabzi, dinner=roti+paneer/chicken+salad.' },
  { tags: ['inflammation','anti-inflammatory'],          fact: 'Anti-inflammatory foods: turmeric, ginger, berries, leafy greens, fatty fish, olive oil. Avoid processed foods.' },
  { tags: ['avoid','risk','food','bad'],                 fact: 'Foods to avoid for general health: refined sugar, trans fats, processed meats, excess sodium, refined carbs, sugary drinks.' },
];

function retrieveContext(query) {
  const q = query.toLowerCase();
  const relevant = NUTRITION_KB.filter(kb => kb.tags.some(tag => q.includes(tag)));
  return relevant.length > 0 ? relevant.map(k => k.fact) : NUTRITION_KB.slice(0, 3).map(k => k.fact);
}

router.post('/chat', async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

    console.log('RAG /chat called — message:', message.substring(0, 50));
    console.log('GROQ_API_KEY present:', !!process.env.GROQ_API_KEY);

    // Fetch user context — non-fatal
    let avgCalories = 0, avgProtein = 0, mealCount = 0;
    let lastHeartRate = 'unknown', bmi = 'not measured', bmiCategory = 'unknown';
    try {
      const HealthData = require('../models/HealthData');
      const BMIRecord  = require('../models/BMIRecord');
      const since = new Date(); since.setDate(since.getDate() - 7);
      const [records, bmiRecord] = await Promise.all([
        HealthData.find({ userId, timestamp: { $gte: since } }).sort({ timestamp: -1 }),
        BMIRecord.findOne({ userId }).sort({ createdAt: -1 }),
      ]);
      const allMeals = records.flatMap(r => r.meals || []);
      mealCount     = allMeals.length;
      lastHeartRate = records[0]?.heartRate || 'unknown';
      avgCalories   = mealCount ? Math.round(allMeals.reduce((s, m) => s + (m.calories || 0), 0) / mealCount) : 0;
      avgProtein    = mealCount ? Math.round(allMeals.reduce((s, m) => s + (m.protein  || 0), 0) / mealCount) : 0;
      bmi           = bmiRecord?.result?.bmi      || 'not measured';
      bmiCategory   = bmiRecord?.result?.category || 'unknown';
    } catch (dbErr) { console.warn('DB fetch skipped:', dbErr.message); }

    const facts = retrieveContext(message);
    console.log('Retrieved', facts.length, 'KB facts');

    // Use getGroq() to ensure fresh instance with loaded env
    const groq = getGroq();

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',   // ← confirmed working model
      messages: [
        {
          role: 'system',
          content: `You are NutriSense AI, a personalized nutrition assistant.
User health data: ${avgCalories} kcal/day avg, ${avgProtein}g protein/day, ${mealCount} meals this week, HR: ${lastHeartRate} BPM, BMI: ${bmi} (${bmiCategory}).
Nutrition knowledge to use: ${facts.join(' ')}
Rules: Be specific and personalized. Max 4 sentences. Don't hallucinate numbers.`
        },
        { role: 'user', content: message },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content;
    if (!reply) throw new Error('Empty response from Groq');

    console.log('✅ Groq reply received');
    res.json({ reply, sources: facts.slice(0, 2).map((_, i) => `NutriSense KB #${i + 1}`) });

  } catch (err) {
    console.error('❌ RAG error — status:', err.status, '| message:', err.message);
    if (err.status === 401) return res.status(500).json({ error: '❌ Invalid Groq API key. Check GROQ_API_KEY in Backend/.env' });
    if (err.status === 429) return res.status(500).json({ error: '⏳ Rate limit. Wait 30 seconds and try again.' });
    if (err.status === 503) return res.status(500).json({ error: '🔄 Groq busy. Try again in a few seconds.' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
