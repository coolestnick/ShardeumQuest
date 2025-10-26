require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function fixUsernames() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected successfully');

    // Find all users with empty string usernames
    const usersWithEmptyUsername = await User.find({
      username: { $in: ['', null] }
    });

    console.log(`Found ${usersWithEmptyUsername.length} users with empty/null usernames`);

    // Update all empty string usernames to null
    const result = await User.updateMany(
      { username: '' },
      { $set: { username: null } }
    );

    console.log(`Updated ${result.modifiedCount} users`);

    // Verify the fix
    const remainingEmpty = await User.find({ username: '' });
    console.log(`Remaining users with empty string username: ${remainingEmpty.length}`);

    // List all users
    const allUsers = await User.find({}).select('walletAddress username totalXP');
    console.log('\nAll users in database:');
    allUsers.forEach(user => {
      console.log(`  - ${user.walletAddress}: username=${user.username}, XP=${user.totalXP}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

fixUsernames();
