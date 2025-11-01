// MongoDB initialization script for Docker
db = db.getSiblingDB('mindhaven');

// Create collections
db.createCollection('users');
db.createCollection('moods');
db.createCollection('journals');

// Create indexes for better performance
db.users.createIndex({ "firebaseUid": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "createdAt": -1 });

db.moods.createIndex({ "userId": 1, "date": -1 });
db.moods.createIndex({ "userId": 1, "createdAt": -1 });
db.moods.createIndex({ "score": 1 });
db.moods.createIndex({ "tags": 1 });

db.journals.createIndex({ "userId": 1, "createdAt": -1 });
db.journals.createIndex({ "userId": 1, "updatedAt": -1 });
db.journals.createIndex({ "flagged": 1 });
db.journals.createIndex({ "visibility": 1 });
db.journals.createIndex({ "sentiment.score": 1 });

print('✅ MongoDB initialized successfully');



