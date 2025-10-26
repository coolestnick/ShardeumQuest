require('dotenv').config();
const mongoose = require('mongoose');

async function deleteNullWallet() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected successfully\n');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    console.log('Deleting users with null walletAddress...');
    const deleteResult = await usersCollection.deleteMany({ walletAddress: null });
    console.log(`Deleted ${deleteResult.deletedCount} users\n`);

    // Verification
    const allUsers = await usersCollection.find({}).toArray();
    console.log(`Remaining users: ${allUsers.length}`);
    allUsers.forEach((user, index) => {
      const hasUsername = user.hasOwnProperty('username');
      console.log(`  ${index + 1}. ${user.walletAddress}: ${hasUsername ? `username="${user.username}"` : 'NO USERNAME'}, XP=${user.totalXP}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

deleteNullWallet();
