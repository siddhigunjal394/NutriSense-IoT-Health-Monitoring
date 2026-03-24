const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const getAIDietAdvice = async (userVitals) => {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are a professional nutritionist and health expert AI. Always respond with valid JSON only, no extra text, no markdown."
        },
        {
          role: "user",
          content: `
Analyze this patient health data and provide personalized diet recommendations.

Patient Data:
- Name: ${userVitals.name}
- Age: ${userVitals.age} years
- Gender: ${userVitals.gender}
- Height: ${userVitals.height} cm
- Weight: ${userVitals.weight} kg
- BMI: ${userVitals.bmi}
- Medical Condition: ${userVitals.medicalCondition}
- Heart Rate: ${userVitals.heartRate} BPM
- Blood Pressure: ${userVitals.systolic}/${userVitals.diastolic} mmHg
- Glucose Level: ${userVitals.glucose} mg/dL
- Oxygen Level: ${userVitals.oxygen}%

Respond ONLY in this exact JSON format:
{
  "summary": "2-3 line health summary",
  "breakfast": "specific breakfast recommendation",
  "lunch": "specific lunch recommendation",
  "dinner": "specific dinner recommendation",
  "snacks": "healthy snack options",
  "hydration": "water and drink recommendations",
  "tips": "3 lifestyle tips",
  "warning": "any medical warnings if needed",
  "exercise": "light exercise recommendation"
}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const response = completion.choices[0].message.content;
    const cleaned = response.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);

  } catch (error) {
    console.error("Groq AI Error:", error.message);
    return {
      summary: "Based on your vitals, please follow a balanced diet.",
      breakfast: "Oats with fruits and low-fat milk",
      lunch: "Brown rice, dal, vegetables, curd",
      dinner: "Roti, sabzi, soup",
      snacks: "Nuts, fruits, buttermilk",
      hydration: "Drink 8-10 glasses of water daily",
      tips: "Exercise 30 mins daily, sleep 7-8 hours, avoid stress",
      warning: "Consult doctor for personalized medical advice",
      exercise: "Light walking 30 minutes daily"
    };
  }
};

module.exports = { getAIDietAdvice };