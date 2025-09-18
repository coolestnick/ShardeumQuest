const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    default: null
  },
  totalXP: {
    type: Number,
    default: 0
  },
  completedQuests: [{
    questId: Number,
    completedAt: {
      type: Date,
      default: Date.now
    },
    xpEarned: Number,
    transactionHash: String
  }],
  achievements: [{
    achievementId: Number,
    unlockedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    browser: String,
    referralSource: String
  }
}, {
  timestamps: true,
  optimisticConcurrency: true // Enable optimistic locking
});

userSchema.methods.addQuestCompletion = async function(questId, xpEarned) {
  this.completedQuests.push({ questId, xpEarned });
  this.totalXP += xpEarned;
  this.lastActiveAt = new Date();
  return this.save();
};

userSchema.methods.addAchievement = async function(achievementId) {
  const exists = this.achievements.some(a => a.achievementId === achievementId);
  if (!exists) {
    this.achievements.push({ achievementId });
    return this.save();
  }
  return this;
};

// Indexes for better performance
userSchema.index({ walletAddress: 1 }, { unique: true });
userSchema.index({ totalXP: -1 }); // For leaderboard queries
userSchema.index({ lastActiveAt: -1 }); // For activity tracking
userSchema.index({ 'completedQuests.questId': 1 }); // For quest completion queries
userSchema.index({ registeredAt: -1 }); // For user registration analytics

module.exports = mongoose.model('User', userSchema);