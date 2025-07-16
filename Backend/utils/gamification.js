// utils/gamification.js
const mongoose = require('mongoose');

exports.updateStreak = async (user) => {
  const today = new Date().setHours(0, 0, 0, 0); // Normalize to midnight
  const lastStudyDate = user.lastStudyDate 
    ? new Date(user.lastStudyDate).setHours(0, 0, 0, 0) 
    : null;

  if (lastStudyDate === today) return; // Already updated today

  if (!lastStudyDate || today - lastStudyDate === 86400000) { // 1 day in ms
    user.streaks += 1;
  } else {
    user.streaks = 1;
  }

  user.lastStudyDate = today;
  await user.save();
};