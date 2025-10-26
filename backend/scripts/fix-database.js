require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function fixDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected successfully\n');

    // Step 1: Delete corrupt user with null walletAddress
    console.log('Step 1: Removing corrupt user with null walletAddress...');
    const deleteResult = await User.deleteMany({ walletAddress: null });
    console.log(`Deleted ${deleteResult.deletedCount} corrupt users\n`);

    // Step 2: Drop the old non-sparse username index FIRST
    console.log('Step 2: Dropping old username index...');
    try {
      await User.collection.dropIndex('username_1');
      console.log('Dropped username_1 index');
    } catch (error) {
      console.log('Index might already be dropped or not exist:', error.message);
    }

    // Step 3: Fix username "null" (string) to actual null
    console.log('\nStep 3: Fixing string "null" and empty strings to actual null...');
    const users = await User.find({});
    for (const user of users) {
      if (user.username === 'null' || user.username === '' || user.username === undefined) {
        user.username = null;
        await user.save({ validateBeforeSave: false });
        console.log(`Fixed user ${user.walletAddress}: set username to null`);
      }
    }

    // Step 4: Create new sparse unique index
    console.log('\nStep 4: Creating sparse unique index on username...');
    await User.collection.createIndex(
      { username: 1 },
      { unique: true, sparse: true }
    );
    console.log('Created sparse unique index on username');

    // Step 5: Verify
    console.log('\nStep 5: Verification');
    const allUsers = await User.find({}).select('walletAddress username totalXP');
    console.log(`Total users: ${allUsers.length}`);
    allUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.walletAddress}: username=${JSON.stringify(user.username)}, XP=${user.totalXP}`);
    });

    const indexes = await User.collection.getIndexes();
    console.log('\nUpdated indexes:');
    console.log(JSON.stringify(indexes, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

fixDatabase();
