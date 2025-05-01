"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
async function dropUuidIndex() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database_name';
    const client = new mongodb_1.MongoClient(uri);
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db();
        const collection = db.collection('hospitals');
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes);
        const uuidIndex = indexes.find(index => index.key && index.key.uuid !== undefined);
        if (uuidIndex) {
            console.log('Found uuid index, dropping...');
            await collection.dropIndex(uuidIndex.name);
            console.log('Successfully dropped uuid index');
        }
        else {
            console.log('No uuid index found');
        }
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        await client.close();
        console.log('Disconnected from MongoDB');
    }
}
dropUuidIndex().catch(console.error);
//# sourceMappingURL=drop-uuid-index.js.map