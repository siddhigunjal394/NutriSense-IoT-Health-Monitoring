const express = require('express');
const router  = express.Router();

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500];
const RANK_NAMES = ['', 'Nutrition Beginner', 'Health Tracker', 'Nutrition Enthusiast', 'Wellness Warrior', 'Health Champion', 'Nutrition Expert', 'Wellness Master', 'Health Legend', 'Nutrition Guru', 'Wellness Titan'];

const BADGE_RULES = {
  first_meal:   (s) => s.mealsLogged >= 1,
  first_scan:   (s) => s.scansCompleted >= 1,
  streak_3:     (s) => s.streak >= 3,
  streak_7:     (s) => s.streak >= 7,
  streak_30:    (s) => s.streak >= 30,
  photo_scan_5: (s) => s.photoScans >= 5,
  heart_health: (s) => s.scansCompleted >= 10,
};

const BADGE_XP = {
  first_meal: 30, first_scan: 50, streak_3: 100,
  streak_7: 250, streak_30: 1000, photo_scan_5: 150, heart_health: 300,
};

const CHALLENGE_XP = { c1: 50, c2: 75, c3: 60, c4: 80, c5: 200, c6: 250 };

function updateStreak(g) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const last  = g.lastLogDate ? new Date(g.lastLogDate) : null;
  if (last) {
    last.setHours(0, 0, 0, 0);
    const diff = (today - last) / (1000 * 60 * 60 * 24);
    if (diff === 1)    g.streak++;
    else if (diff > 1) g.streak = 1;
  } else {
    g.streak = 1;
  }
  if (g.streak > g.longestStreak) g.longestStreak = g.streak;
  g.lastLogDate = today;
}

async function updateGamification(userId, action) {
  try {
    const Gamification = require('../models/Gamification');
    let g = await Gamification.findOne({ userId });
    if (!g) {
      g = new Gamification({
        userId, xp: 0, level: 1, streak: 0, longestStreak: 0,
        mealsLogged: 0, scansCompleted: 0, photoScans: 0,
        badgesEarned: [], challengesCompleted: [], lastLogDate: null,
      });
    }

    const XP_MAP = { meal_logged: 20, photo_scan: 15, heart_scan: 30, challenge_complete: 50 };
    g.xp += XP_MAP[action] || 10;

    if (action === 'meal_logged') { g.mealsLogged++;    updateStreak(g); }
    if (action === 'heart_scan')    g.scansCompleted++;
    if (action === 'photo_scan')    g.photoScans++;

    // Level up check
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (g.xp >= LEVEL_THRESHOLDS[i]) { g.level = i + 1; break; }
    }

    // Badge check
    Object.entries(BADGE_RULES).forEach(([badgeId, rule]) => {
      if (!g.badgesEarned.includes(badgeId) && rule(g)) {
        g.badgesEarned.push(badgeId);
        g.xp += BADGE_XP[badgeId] || 50;
      }
    });

    await g.save();
    return g;
  } catch (err) {
    console.error('Gamification update error:', err.message);
  }
}

// GET /api/gamification/stats/:userId
router.get('/stats/:userId', async (req, res) => {
  try {
    const Gamification = require('../models/Gamification');
    let g = await Gamification.findOne({ userId: req.params.userId });

    if (!g) return res.json({
      xp: 0, level: 1, streak: 0, longestStreak: 0,
      mealsLogged: 0, scansCompleted: 0, photoScans: 0,
      badgesEarned: [], challengesCompleted: [],
      nextLevelXp: LEVEL_THRESHOLDS[1], currentLevelXp: 0,
      weeklyScore: 0, rank: 'Nutrition Beginner',
    });

    const currentLevelXp = LEVEL_THRESHOLDS[g.level - 1] || 0;
    const nextLevelXp    = LEVEL_THRESHOLDS[g.level]     || 9999;
    const weeklyScore    = Math.min(100, Math.round(
      (g.streak / 7) * 40 + (g.mealsLogged / 21) * 40 + (g.scansCompleted / 5) * 20
    ));

    res.json({
      ...g.toObject(),
      currentLevelXp,
      nextLevelXp,
      weeklyScore,
      rank: RANK_NAMES[g.level] || 'Wellness Titan',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/gamification/claim
router.post('/claim', async (req, res) => {
  try {
    const { userId, challengeId } = req.body;
    const Gamification = require('../models/Gamification');
    const g = await Gamification.findOne({ userId });
    if (!g) return res.status(404).json({ error: 'User not found' });
    if (g.challengesCompleted.includes(challengeId))
      return res.status(400).json({ error: 'Already claimed' });

    g.challengesCompleted.push(challengeId);
    g.xp += CHALLENGE_XP[challengeId] || 50;
    await g.save();
    res.json({ success: true, xp: g.xp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.updateGamification = updateGamification;
