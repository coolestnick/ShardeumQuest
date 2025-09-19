require('dotenv').config();
const { MongoClient } = require('mongodb');

async function listDatabases() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    // List all databases
    const admin = client.db().admin();
    const result = await admin.listDatabases();
    
    console.log('\n📚 Available Databases:');
    console.log('======================');
    result.databases.forEach(db => {
      console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // Check specific databases for collections
    const dbsToCheck = ['admin', 'shardeumquest', 'shardeum-quest', 'test', 'tip-dapp'];
    
    console.log('\n📋 Collections in each database:');
    console.log('================================');
    
    for (const dbName of dbsToCheck) {
      try {
        const db = client.db(dbName);
        const collections = await db.listCollections().toArray();
        if (collections.length > 0) {
          console.log(`\n${dbName}:`);
          for (const coll of collections) {
            const count = await db.collection(coll.name).countDocuments();
            console.log(`  - ${coll.name}: ${count} documents`);
          }
        }
      } catch (err) {
        // Database might not exist
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

listDatabases();