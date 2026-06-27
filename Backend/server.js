const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

// ── Route imports ──
const authRoutes = require("./routes/authRoutes");
const healthRoutes = require("./routes/healthRoutes");
const aiDoctorRoutes = require("./routes/aiDoctor");
const mealRoutes = require("./routes/mealLogger");
const foodRoutes = require("./routes/food");
const gamificationRoutes = require("./routes/gamification");

// ── App init (MUST be before any app.use) ──
const app = express();

// ── DB ──
connectDB();

// ── Middleware ──
// Explicitly allow your live Render frontend to communicate with this backend
app.use(cors({
    origin: "https://nutrisense-iot-health-monitoring-6.onrender.com", 
    credentials: true, 
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

app.use(express.json());

// ── Routes ──
app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/ai-doctor", aiDoctorRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/food", foodRoutes); // Cleaned up import to match your style above
app.use("/api/gamification", gamificationRoutes); // Cleaned up import
app.use("/api/health-risk", require("./routes/healthRisk"));
app.use("/api/bmi", require("./routes/bmi"));
app.use("/api/rag-diet", require("./routes/ragDiet"));
app.use("/api/portion", require("./routes/portion"));

app.get("/", (req, res) => {
  res.send("NutriSense Backend is running ✅");
});

// ── Start ──
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`NutriSense server running on port ${PORT}`);
});