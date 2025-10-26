require('dotenv').config();
const mongoose = require('mongoose');

async function removeNullUsernames() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected successfully\n');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Step 1: Delete user with null walletAddress
    console.log('Step 1: Deleting user with null walletAddress...');
    const deleteResult = await usersCollection.deleteMany({ walletAddress: null });
    console.log(`Deleted ${deleteResult.deletedCount} users\n`);

    // Step 2: Remove the username field entirely from users where it's null
    console.log('Step 2: Removing username field from users where it\'s null...');
    const updateResult = await usersCollection.updateMany(
      { username: null },
      { $unset: { username: '' } }
    );
    console.log(`Modified ${updateResult.modifiedCount} users\n`);

    // Step 3: Create sparse unique index
    console.log('Step 3: Creating sparse unique index on username...');
    try {
      await usersCollection.createIndex(
        { username: 1 },
        { unique: true, sparse: true }
      );
      console.log('Successfully created sparse unique index!\n');
    } catch (error) {
      console.error('Failed to create index:', error.message);
    }

    // Step 4: Verification
    console.log('Step 4: Verification');
    const allUsers = await usersCollection.find({}).toArray();
    console.log(`Total users: ${allUsers.length}`);
    allUsers.forEach((user, index) => {
      const hasUsername = user.hasOwnProperty('username');
      console.log(`  ${index + 1}. ${user.walletAddress}: ${hasUsername ? `username="${user.username}"` : 'NO USERNAME FIELD'}, XP=${user.totalXP}`);
    });

    const indexes = await usersCollection.indexes();
    console.log('\nIndexes:');
    indexes.forEach(idx => {
      if (idx.name === 'username_1') {
        console.log(`  ✓ ${idx.name}: unique=${idx.unique}, sparse=${idx.sparse}`);
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

removeNullUsernames();
