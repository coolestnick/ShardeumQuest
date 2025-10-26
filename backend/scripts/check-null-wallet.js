require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  const user2 = users[1];
  console.log('User 2:');
  console.log('  _id:', user2._id);
  console.log('  walletAddress:', JSON.stringify(user2.walletAddress));
  console.log('  type:', typeof user2.walletAddress);
  console.log('  === null:', user2.walletAddress === null);
  console.log('  === "null":', user2.walletAddress === 'null');

  console.log('\nDeleting by _id...');
  const result = await mongoose.connection.db.collection('users').deleteOne({ _id: user2._id });
  console.log('Deleted:', result.deletedCount);

  await mongoose.connection.close();
}
check();
