import { MongoClient } from 'mongodb';

async function dropUuidIndex() {
  // Replace with your MongoDB connection string
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database_name';
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('hospitals');
    
    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);
    
    // Find and drop the uuid index
    const uuidIndex = indexes.find(index => 
      index.key && index.key.uuid !== undefined
    );
    
    if (uuidIndex) {
      console.log('Found uuid index, dropping...');
      await collection.dropIndex(uuidIndex.name);
      console.log('Successfully dropped uuid index');
    } else {
      console.log('No uuid index found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

dropUuidIndex().catch(console.error);