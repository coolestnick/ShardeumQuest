require('dotenv').config();
const mongoose = require('mongoose');

async function finalFix() {
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
    console.log('Step 1: Deleting corrupt user with null walletAddress...');
    const deleteResult = await usersCollection.deleteMany({ walletAddress: null });
    console.log(`Deleted ${deleteResult.deletedCount} users\n`);

    // Step 2: Find all users with null username
    console.log('Step 2: Finding users with null username...');
    const nullUsernameUsers = await usersCollection.find({ username: null }).toArray();
    console.log(`Found ${nullUsernameUsers.length} users with null username:`);
    nullUsernameUsers.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.walletAddress} (XP: ${user.totalXP})`);
    });

    // Step 3: Keep only the first one as null, set others to null (they can update later)
    // Actually, let's just leave them all as null for now and use updateOne
    console.log('\nStep 3: All users will keep username as null (allowed with sparse index)');

    // Step 4: Create sparse unique index
    console.log('\nStep 4: Creating sparse unique index on username...');
    try {
      await usersCollection.createIndex(
        { username: 1 },
        { unique: true, sparse: true }
      );
      console.log('Successfully created sparse unique index!');
    } catch (error) {
      console.error('Failed to create index:', error.message);
      console.log('\nThis is expected if there are duplicate non-null usernames');
    }

    // Step 5: Final verification
    console.log('\nStep 5: Final verification');
    const allUsers = await usersCollection.find({}).toArray();
    console.log(`\nTotal users: ${allUsers.length}`);
    allUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.walletAddress}: username=${JSON.stringify(user.username)}, XP=${user.totalXP}`);
    });

    const indexes = await usersCollection.indexes();
    console.log('\nIndexes:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
      if (idx.name === 'username_1') {
        console.log(`    unique: ${idx.unique}, sparse: ${idx.sparse}`);
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

finalFix();
