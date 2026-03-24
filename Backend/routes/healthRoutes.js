const express = require("express");
const router = express.Router();

const {
  addHealthData,
  getLatestHealthData,
  getHealthHistory
} = require("../controllers/healthController");

// add health data
router.post("/add", addHealthData);

// get latest health data
router.get("/latest/:userId", getLatestHealthData);

// get health history
router.get("/history/:userId", getHealthHistory);

module.exports = router;