require('dotenv').config();
const mongoose = require('mongoose');

async function checkUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shardeumquest', {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      family: 4
    });

    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database Name: ${mongoose.connection.db.databaseName}`);
    
    // Import models
    const User = require('./src/models/User');
    const Progress = require('./src/models/Progress');
    
    // Get all users
    const users = await User.find({}).lean();
    console.log(`\n👥 Total Users: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n📋 User Details:');
      console.log('=====================================');
      
      for (const user of users) {
        console.log(`\n🔹 Wallet: ${user.walletAddress}`);
        console.log(`   Username: ${user.username || 'Not set'}`);
        console.log(`   Total XP: ${user.totalXP || 0}`);
        console.log(`   Completed Quests: ${user.completedQuests?.length || 0}`);
        
        if (user.completedQuests && user.completedQuests.length > 0) {
          console.log('   Quest Details:');
          user.completedQuests.forEach(quest => {
            console.log(`     - Quest ${quest.questId}: ${quest.xpEarned} XP (${new Date(quest.completedAt).toLocaleString()})`);
          });
        }
        
        console.log(`   Registered: ${new Date(user.registeredAt).toLocaleString()}`);
        console.log(`   Last Active: ${new Date(user.lastActiveAt).toLocaleString()}`);
      }
    } else {
      console.log('\nℹ️  No users found in the database');
    }
    
    // Get progress records
    const progressRecords = await Progress.find({}).lean();
    console.log(`\n📈 Total Progress Records: ${progressRecords.length}`);
    
    if (progressRecords.length > 0) {
      console.log('\nActive Quests:');
      progressRecords.forEach(progress => {
        console.log(`  - User ${progress.userId}: Quest ${progress.questId} (${progress.status})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkUsers();