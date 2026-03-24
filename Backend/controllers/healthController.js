const HealthData = require("../models/HealthData");
const User = require("../models/User");
const { getAIDietAdvice } = require("../services/aiService");

// ================= SMART RULE-BASED DIET ENGINE =================
const getDietRecommendation = (heartRate, systolic, diastolic, glucose, age, bmi, gender, medicalCondition) => {
  let alerts = [];
  let dietPlan = [];
  let foodsToAvoid = [];
  let status = "Normal";

  if (heartRate < 50) {
    alerts.push("⚠️ Heart rate critically low! Consult doctor immediately.");
    status = "Critical";
    dietPlan.push("Eat iron-rich foods: spinach, dates, pomegranate");
  } else if (heartRate < 60) {
    status = "Low Heart Rate";
    dietPlan.push("Eat warm nutritious food, avoid fasting");
  } else if (heartRate <= 100) {
    dietPlan.push("Maintain balanced diet with fruits and vegetables");
    dietPlan.push("Drink 8-10 glasses of water daily");
  } else if (heartRate <= 120) {
    status = "High Heart Rate";
    alerts.push("❗ Heart rate is elevated. Take rest.");
    dietPlan.push("Avoid caffeine, tea, and energy drinks");
    foodsToAvoid.push("Coffee", "Tea", "Energy drinks");
  } else {
    status = "Critical";
    alerts.push("🚨 Heart rate dangerously high! Seek medical attention.");
    foodsToAvoid.push("All stimulants", "Heavy oily food");
  }

  if (systolic && diastolic) {
    if (systolic >= 180 || diastolic >= 120) {
      alerts.push("🚨 Hypertensive Crisis! Go to emergency immediately.");
      status = "Critical";
      foodsToAvoid.push("Salt", "Pickles", "Processed food");
    } else if (systolic >= 140 || diastolic >= 90) {
      alerts.push("⚠️ High Blood Pressure detected.");
      dietPlan.push("Follow DASH diet: fruits, veggies, low-fat dairy");
      dietPlan.push("Reduce sodium intake below 1500mg/day");
      foodsToAvoid.push("Salt", "Chips", "Canned food", "Alcohol");
    } else if (systolic < 90 || diastolic < 60) {
      alerts.push("⚠️ Low Blood Pressure detected.");
      dietPlan.push("Increase fluid intake, eat small frequent meals");
    }
  }

  if (glucose) {
    if (glucose > 200) {
      alerts.push("🚨 Very high glucose! Possible diabetes emergency.");
      status = "Critical";
      foodsToAvoid.push("Sugar", "Rice", "White bread", "Sweets");
      dietPlan.push("Eat only low-GI foods: oats, lentils, leafy greens");
    } else if (glucose > 140) {
      alerts.push("⚠️ High blood glucose detected.");
      dietPlan.push("Avoid sugary and high-carb foods");
      foodsToAvoid.push("Sugar", "White rice", "Maida", "Sweet drinks");
    } else if (glucose < 70) {
      alerts.push("⚠️ Low blood sugar! Eat something sweet immediately.");
      dietPlan.push("Have glucose tablets or fruit juice right away");
    }
  }

  if (bmi) {
    if (bmi < 18.5) {
      dietPlan.push("Underweight: eat calorie-dense nutritious food");
    } else if (bmi >= 25 && bmi < 30) {
      dietPlan.push("Overweight: reduce calorie intake gradually");
      foodsToAvoid.push("Fried food", "Fast food", "Sugary drinks");
    } else if (bmi >= 30) {
      dietPlan.push("Obesity: follow structured diet, consult nutritionist");
      foodsToAvoid.push("All junk food", "Sugary items");
    }
  }

  if (medicalCondition === "diabetes") {
    dietPlan.push("Diabetic diet: avoid sugar, eat complex carbs only");
    foodsToAvoid.push("Sugar", "Sweets", "White rice");
  } else if (medicalCondition === "hypertension") {
    dietPlan.push("Low sodium DASH diet recommended");
    foodsToAvoid.push("Salt", "Pickles", "Processed meats");
  } else if (medicalCondition === "obesity") {
    dietPlan.push("Low calorie, high fiber diet. Walk 30 min daily.");
  }

  return { status, alerts, dietPlan, foodsToAvoid };
};

// ================= ADD HEALTH DATA =================
const addHealthData = async (req, res) => {
  try {
    const {
      userId,
      heartRate,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      glucoseLevel,
      oxygenLevel
    } = req.body;

    if (!userId || !heartRate) {
      return res.status(400).json({ message: "userId and heartRate are required" });
    }

    const newData = new HealthData({
      userId,
      heartRate,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      glucoseLevel,
      oxygenLevel
    });

    await newData.save();

    const user = await User.findById(userId);

    const recommendation = getDietRecommendation(
      heartRate,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      glucoseLevel,
      user?.age,
      user?.bmi,
      user?.gender,
      user?.medicalCondition
    );

    const aiAdvice = await getAIDietAdvice({
      name: user?.name,
      age: user?.age,
      gender: user?.gender,
      height: user?.height,
      weight: user?.weight,
      bmi: user?.bmi,
      medicalCondition: user?.medicalCondition,
      heartRate,
      systolic: bloodPressureSystolic,
      diastolic: bloodPressureDiastolic,
      glucose: glucoseLevel,
      oxygen: oxygenLevel
    });

    res.status(201).json({
      message: "Health data saved successfully",
      data: newData,
      recommendation,
      aiAdvice
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET LATEST + DIET =================
const getLatestHealthData = async (req, res) => {
  try {
    const { userId } = req.params;

    const latestData = await HealthData.findOne({ userId }).sort({ timestamp: -1 });
    if (!latestData) {
      return res.status(404).json({ message: "No health data found" });
    }

    const user = await User.findById(userId);

    const recommendation = getDietRecommendation(
      latestData.heartRate,
      latestData.bloodPressureSystolic,
      latestData.bloodPressureDiastolic,
      latestData.glucoseLevel,
      user?.age,
      user?.bmi,
      user?.gender,
      user?.medicalCondition
    );

    const aiAdvice = await getAIDietAdvice({
      name: user?.name,
      age: user?.age,
      gender: user?.gender,
      height: user?.height,
      weight: user?.weight,
      bmi: user?.bmi,
      medicalCondition: user?.medicalCondition,
      heartRate: latestData.heartRate,
      systolic: latestData.bloodPressureSystolic,
      diastolic: latestData.bloodPressureDiastolic,
      glucose: latestData.glucoseLevel,
      oxygen: latestData.oxygenLevel
    });

    res.json({
      healthData: latestData,
      recommendation,
      aiAdvice
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET FULL HISTORY =================
const getHealthHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await HealthData.find({ userId }).sort({ timestamp: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET VISUALIZATION DATA =================
const getVisualizationData = async (req, res) => {
  try {
    const { userId } = req.params;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const data = await HealthData.find({
      userId,
      timestamp: { $gte: sevenDaysAgo }
    }).sort({ timestamp: 1 });

    const chartData = data.map(entry => ({
      date: entry.timestamp.toISOString().split('T')[0],
      heartRate: entry.heartRate,
      systolic: entry.bloodPressureSystolic,
      diastolic: entry.bloodPressureDiastolic,
      glucose: entry.glucoseLevel,
      oxygen: entry.oxygenLevel
    }));

    res.json({
      totalRecords: data.length,
      chartData
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addHealthData,
  getLatestHealthData,
  getHealthHistory,
  getVisualizationData
};
