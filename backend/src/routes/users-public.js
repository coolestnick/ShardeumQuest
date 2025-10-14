const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Public profile endpoint - get by wallet address
router.get('/profile/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (!user) {
      // Create a new user if not found
      const newUser = new User({
        walletAddress: walletAddress.toLowerCase(),
        // username intentionally omitted - will be undefined (sparse index allows this)
        totalXP: 0,
        completedQuests: [],
        achievements: []
      });
      await newUser.save();

      return res.json({
        id: newUser._id,
        walletAddress: newUser.walletAddress,
        username: newUser.username || null, // Return null for frontend if undefined
        totalXP: 0,
        completedQuests: [],
        achievements: [],
        registeredAt: newUser.createdAt,
        lastActiveAt: newUser.lastActiveAt
      });
    }

    res.json({
      id: user._id,
      walletAddress: user.walletAddress,
      username: user.username,
      totalXP: user.totalXP,
      completedQuests: user.completedQuests,
      achievements: user.achievements,
      registeredAt: user.registeredAt,
      lastActiveAt: user.lastActiveAt
    });
  } catch (error) {
    console.error('Profile fetch error:', {
      walletAddress: req.params.walletAddress,
      errorMessage: error.message,
      errorName: error.name,
      errorCode: error.code,
      stack: error.stack
    });

    // Provide more specific error messages
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      return res.status(503).json({
        error: 'Database temporarily unavailable',
        retryable: true
      });
    }

    if (error.code === 11000) {
      // Race condition: user was created by another request
      // Re-fetch the user and return it
      try {
        const existingUser = await User.findOne({
          walletAddress: req.params.walletAddress.toLowerCase()
        });

        if (existingUser) {
          return res.json({
            id: existingUser._id,
            walletAddress: existingUser.walletAddress,
            username: existingUser.username,
            totalXP: existingUser.totalXP,
            completedQuests: existingUser.completedQuests,
            achievements: existingUser.achievements,
            registeredAt: existingUser.registeredAt,
            lastActiveAt: existingUser.lastActiveAt
          });
        }
      } catch (refetchError) {
        console.error('Error refetching user after conflict:', refetchError);
      }

      return res.status(409).json({
        error: 'User creation conflict',
        retryable: true
      });
    }

    res.status(500).json({
      error: 'Failed to fetch profile',
      retryable: true
    });
  }
});

// Public leaderboard - already public
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const [users, total] = await Promise.all([
      User.find()
        .sort({ totalXP: -1 })
        .limit(limit)
        .skip(offset)
        .select('walletAddress username totalXP completedQuests'),
      User.countDocuments()
    ]);

    const leaderboard = users.map((user, index) => ({
      rank: offset + index + 1,
      walletAddress: user.walletAddress,
      username: user.username || 'Anonymous',
      totalXP: user.totalXP,
      completedQuests: user.completedQuests.length,
      achievements: user.achievements ? user.achievements.length : 0
    }));

    res.json({
      users: leaderboard,
      total,
      page: Math.floor(offset / limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Public endpoint to check if user exists
router.get('/exists/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    res.json({
      exists: !!user,
      walletAddress: walletAddress.toLowerCase()
    });
  } catch (error) {
    console.error('User check error:', error);
    res.status(500).json({ error: 'Failed to check user' });
  }
});

// Public stats endpoint
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalXP, totalQuests] = await Promise.all([
      User.countDocuments(),
      User.aggregate([{ $group: { _id: null, total: { $sum: '$totalXP' } } }]),
      User.aggregate([{ $unwind: '$completedQuests' }, { $count: 'total' }])
    ]);

    res.json({
      totalUsers,
      totalXP: totalXP[0]?.total || 0,
      totalQuestsCompleted: totalQuests[0]?.total || 0,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Update username with wallet address
router.put('/profile/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { username } = req.body;

    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update username
    user.username = username || null;
    user.lastActiveAt = new Date();
    await user.save();

    res.json({
      id: user._id,
      walletAddress: user.walletAddress,
      username: user.username,
      totalXP: user.totalXP,
      completedQuests: user.completedQuests,
      achievements: user.achievements,
      registeredAt: user.createdAt,
      lastActiveAt: user.lastActiveAt
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Check if wallet has interacted with dapp and show completed quests
router.get('/interaction/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (!user) {
      return res.json({
        hasInteracted: false,
        walletAddress: walletAddress.toLowerCase(),
        totalXP: 0,
        completedQuests: [],
        questsCompleted: 0
      });
    }

    // User exists, so they have interacted (even if they haven't completed any quests)
    const completedQuestDetails = user.completedQuests.map(quest => ({
      questId: quest.questId,
      completedAt: quest.completedAt,
      xpEarned: quest.xpEarned,
      questName: getQuestName(quest.questId)
    }));

    res.json({
      hasInteracted: true,
      walletAddress: user.walletAddress,
      username: user.username || null,
      totalXP: user.totalXP,
      completedQuests: completedQuestDetails,
      questsCompleted: user.completedQuests.length,
      registeredAt: user.registeredAt,
      lastActiveAt: user.lastActiveAt
    });
  } catch (error) {
    console.error('Interaction check error:', error);
    res.status(500).json({ error: 'Failed to check interaction' });
  }
});

// Helper function to get quest names
function getQuestName(questId) {
  const questNames = {
    1: "Welcome to DeFi",
    2: "Token Explorer", 
    3: "DeFi Vault Builder",
    4: "Multi-Token Standards Master",
    5: "Web3 Career Strategist"
  };
  return questNames[questId] || `Quest ${questId}`;
}

module.exports = router;