const mongoose = require('mongoose');

/**
 * Database utility functions for handling high loads and ensuring sequential updates
 */

/**
 * Retry database operations with exponential backoff
 */
async function retryOperation(operation, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Atomic update with optimistic locking
 */
async function atomicUpdate(Model, filter, update, options = {}) {
  const maxRetries = 5;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await Model.findOneAndUpdate(
        filter,
        update,
        {
          new: true,
          upsert: options.upsert || false,
          runValidators: true,
          ...options
        }
      );
      
      return result;
    } catch (error) {
      // Handle version key errors (optimistic locking conflicts)
      if (error.name === 'VersionError' && attempt < maxRetries) {
        console.log(`Optimistic locking conflict, retrying... (attempt ${attempt})`);
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        continue;
      }
      throw error;
    }
  }
}

/**
 * Sequential quest completion to prevent race conditions
 */
async function completeQuestSequentially(userId, questId, xpEarned, transactionHash) {
  const session = await mongoose.startSession();
  
  try {
    let result;
    
    await session.withTransaction(async () => {
      const User = require('../models/User');
      
      // Find user with session
      const user = await User.findById(userId).session(session);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Check if quest already completed
      const alreadyCompleted = user.completedQuests.some(
        quest => quest.questId === parseInt(questId)
      );
      
      if (alreadyCompleted) {
        throw new Error('Quest already completed');
      }
      
      // Add completed quest and update XP atomically
      const questCompletion = {
        questId: parseInt(questId),
        completedAt: new Date(),
        xpEarned: xpEarned,
        transactionHash: transactionHash
      };
      
      user.completedQuests.push(questCompletion);
      user.totalXP += xpEarned;
      user.lastActiveAt = new Date();
      
      await user.save({ session });
      
      result = user;
    });
    
    return result;
  } finally {
    await session.endSession();
  }
}

/**
 * Update quest progress with concurrency control
 */
async function updateQuestProgress(userId, questId, stepId, completed) {
  return await retryOperation(async () => {
    const Progress = require('../models/Progress');
    
    const progress = await Progress.findOneAndUpdate(
      { 
        userId: userId,
        questId: parseInt(questId)
      },
      {
        $set: {
          [`steps.$[elem].completed`]: completed,
          [`steps.$[elem].completedAt`]: completed ? new Date() : null,
          updatedAt: new Date()
        }
      },
      {
        arrayFilters: [{ 'elem.id': parseInt(stepId) }],
        new: true,
        runValidators: true
      }
    );
    
    if (!progress) {
      throw new Error('Progress not found');
    }
    
    return progress;
  });
}

/**
 * Bulk update operations for high performance
 */
async function bulkUpdateUsers(updates) {
  const User = require('../models/User');
  
  const bulkOps = updates.map(update => ({
    updateOne: {
      filter: { _id: update._id },
      update: { $set: update.data },
      upsert: false
    }
  }));
  
  return await User.bulkWrite(bulkOps, { ordered: false });
}

/**
 * Database health check
 */
async function checkDatabaseHealth() {
  try {
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    if (state !== 1) {
      throw new Error(`Database state: ${states[state]}`);
    }
    
    // Simple ping
    await mongoose.connection.db.admin().ping();
    
    return {
      status: 'healthy',
      state: states[state],
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

module.exports = {
  retryOperation,
  atomicUpdate,
  completeQuestSequentially,
  updateQuestProgress,
  bulkUpdateUsers,
  checkDatabaseHealth
};