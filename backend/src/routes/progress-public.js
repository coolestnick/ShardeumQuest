const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Progress = require('../models/Progress');
const axios = require('axios');
const { 
  retryOperation, 
  completeQuestSequentially, 
  updateQuestProgress 
} = require('../utils/dbUtils');

// Get user progress by wallet address
router.get('/user/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

    if (!user) {
      // Create a new user if not found
      user = new User({
        walletAddress: walletAddress.toLowerCase(),
        username: null,
        totalXP: 0,
        completedQuests: [],
        achievements: []
      });
      await user.save();
    }

    const activeProgress = await Progress.find({
      userId: user._id,
      status: { $in: ['not_started', 'in_progress'] }
    }).select('questId status steps createdAt updatedAt');

    res.json({
      walletAddress: user.walletAddress,
      totalXP: user.totalXP,
      completedQuests: user.completedQuests,
      activeProgress: activeProgress
    });
  } catch (error) {
    console.error('Progress fetch error:', {
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

    res.status(500).json({
      error: 'Failed to fetch progress',
      retryable: true
    });
  }
});

// Get quest completion status
router.get('/quest/:questId/status', async (req, res) => {
  try {
    const { questId } = req.params;
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (!user) {
      return res.json({
        completed: false,
        walletAddress: walletAddress.toLowerCase(),
        questId: parseInt(questId)
      });
    }

    const isCompleted = user.completedQuests.some(q => 
      q.questId === parseInt(questId)
    );

    res.json({
      completed: isCompleted,
      walletAddress: user.walletAddress,
      questId: parseInt(questId),
      xpEarned: isCompleted ? user.completedQuests.find(q => q.questId === parseInt(questId))?.xpEarned || 0 : 0
    });
  } catch (error) {
    console.error('Quest status error:', {
      questId: req.params.questId,
      walletAddress: req.query.walletAddress,
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

    res.status(500).json({
      error: 'Failed to check quest status',
      retryable: true
    });
  }
});

// Get recent completions
router.get('/recent-completions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const recentCompletions = await User.aggregate([
      { $unwind: '$completedQuests' },
      { $sort: { 'completedQuests.completedAt': -1 } },
      { $limit: limit },
      {
        $project: {
          walletAddress: 1,
          username: 1,
          questId: '$completedQuests.questId',
          xpEarned: '$completedQuests.xpEarned',
          completedAt: '$completedQuests.completedAt'
        }
      }
    ]);

    res.json(recentCompletions);
  } catch (error) {
    console.error('Recent completions error:', {
      limit: req.query.limit,
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

    res.status(500).json({
      error: 'Failed to fetch recent completions',
      retryable: true
    });
  }
});

// Start quest with wallet address
router.post('/start/:questId', async (req, res) => {
  try {
    const { questId } = req.params;
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    // Get or create user
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (!user) {
      user = new User({
        walletAddress: walletAddress.toLowerCase(),
        username: null,
        totalXP: 0,
        completedQuests: [],
        achievements: []
      });
      await user.save();
    }

    // For now, we'll create a basic quest structure
    // In a full implementation, you'd fetch from a Quest model or external API
    const questSteps = [
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 },
      { id: 5 }
    ]; // Default quest structure

    // Check if already started or completed
    const existingProgress = await Progress.findOne({
      userId: user._id,
      questId: parseInt(questId)
    });

    if (existingProgress) {
      return res.json(existingProgress);
    }

    // Check if quest is already completed
    const isCompleted = user.completedQuests.some(q => q.questId === parseInt(questId));
    if (isCompleted) {
      return res.status(400).json({ error: 'Quest already completed' });
    }

    // Create progress
    const progress = new Progress({
      userId: user._id,
      questId: parseInt(questId),
      status: 'in_progress',
      steps: questSteps.map(step => ({
        stepId: step.id,
        completed: false
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await progress.save();
    res.json(progress);
  } catch (error) {
    console.error('Start quest error:', {
      questId: req.params.questId,
      walletAddress: req.body.walletAddress,
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
      return res.status(409).json({
        error: 'Quest already in progress',
        retryable: false
      });
    }

    res.status(500).json({
      error: 'Failed to start quest',
      retryable: true
    });
  }
});

// Update quest progress with wallet address
router.put('/update/:questId', async (req, res) => {
  try {
    const { questId } = req.params;
    const { walletAddress, stepId, completed } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    // Get or create user
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (!user) {
      user = new User({
        walletAddress: walletAddress.toLowerCase(),
        username: null,
        totalXP: 0,
        completedQuests: [],
        achievements: []
      });
      await user.save();
    }

    const progress = await Progress.findOne({
      userId: user._id,
      questId: parseInt(questId)
    });

    if (!progress) {
      return res.status(404).json({ error: 'Progress not found' });
    }

    // Update step
    const step = progress.steps.find(s => s.stepId === stepId);
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }

    step.completed = completed;
    progress.updatedAt = new Date();

    // Check if all steps are completed
    const allCompleted = progress.steps.every(s => s.completed);
    if (allCompleted) {
      progress.status = 'ready_for_completion';
    }

    await progress.save();
    res.json(progress);
  } catch (error) {
    console.error('Update progress error:', {
      questId: req.params.questId,
      walletAddress: req.body.walletAddress,
      stepId: req.body.stepId,
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

    res.status(500).json({
      error: 'Failed to update progress',
      retryable: true
    });
  }
});

// Complete quest with wallet address and blockchain verification (Enhanced for high loads)
router.post('/complete/:questId', async (req, res) => {
  try {
    const { questId } = req.params;
    const { walletAddress, transactionHash, blockchainVerified } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    // Use retry operation for database queries - Get or create user
    let user = await retryOperation(async () => {
      return await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    });

    if (!user) {
      user = new User({
        walletAddress: walletAddress.toLowerCase(),
        username: null,
        totalXP: 0,
        completedQuests: [],
        achievements: []
      });
      await user.save();
    }

    // Find and update progress
    const progress = await retryOperation(async () => {
      return await Progress.findOne({
        userId: user._id,
        questId: parseInt(questId)
      });
    });

    if (!progress) {
      return res.status(404).json({ error: 'Progress not found. Please start the quest first.' });
    }

    // Get the actual quest XP reward from quests data
    const questsData = [
      { id: 1, xpReward: 100 },
      { id: 2, xpReward: 150 },
      { id: 3, xpReward: 200 },
      { id: 4, xpReward: 250 },
      { id: 5, xpReward: 300 }
    ];
    
    const quest = questsData.find(q => q.id === parseInt(questId));
    const xpReward = quest ? quest.xpReward : 100;

    // Use sequential quest completion to prevent race conditions
    const updatedUser = await completeQuestSequentially(
      user._id,
      questId,
      xpReward,
      transactionHash
    );

    // Update progress record separately
    await retryOperation(async () => {
      progress.status = 'completed';
      progress.completedAt = new Date();
      progress.transactionHash = transactionHash;
      progress.updatedAt = new Date();
      return await progress.save();
    });

    res.json({
      message: 'Quest completed successfully',
      xpEarned: xpReward,
      totalXP: updatedUser.totalXP,
      transactionHash: transactionHash,
      completedAt: new Date()
    });

  } catch (error) {
    console.error('Complete quest error:', error);
    
    // Handle specific error types
    if (error.message === 'Quest already completed') {
      return res.status(400).json({ error: 'Quest already completed' });
    }
    
    if (error.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(500).json({ error: 'Failed to complete quest. Please try again.' });
  }
});

module.exports = router;