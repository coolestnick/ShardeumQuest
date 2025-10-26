require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function checkUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected successfully\n');

    // List all users with their exact username values
    const allUsers = await User.find({}).select('walletAddress username totalXP');
    console.log(`Total users: ${allUsers.length}\n`);

    allUsers.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  Wallet: ${user.walletAddress}`);
      console.log(`  Username: "${user.username}" (type: ${typeof user.username})`);
      console.log(`  XP: ${user.totalXP}`);
      console.log('');
    });

    // Check for duplicate usernames
    const usernames = {};
    allUsers.forEach(user => {
      const key = user.username === null ? 'NULL' : user.username;
      if (!usernames[key]) {
        usernames[key] = [];
      }
      usernames[key].push(user.walletAddress);
    });

    console.log('Username distribution:');
    Object.keys(usernames).forEach(key => {
      console.log(`  ${key}: ${usernames[key].length} users`);
      if (usernames[key].length > 1) {
        console.log(`    WARNING: Duplicate! Wallets: ${usernames[key].join(', ')}`);
      }
    });

    // Check indexes
    console.log('\nIndexes on User collection:');
    const indexes = await User.collection.getIndexes();
    console.log(JSON.stringify(indexes, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

checkUsers();
