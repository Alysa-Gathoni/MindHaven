const mongoose = require('mongoose');
const User = require('../src/models/User');
const Mood = require('../src/models/Mood');
const Journal = require('../src/models/Journal');
require('dotenv').config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Mood.deleteMany({});
    await Journal.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const adminUser = new User({
      firebaseUid: 'admin-firebase-uid',
      email: 'admin@mindhaven.com',
      displayName: 'Admin User',
      role: 'admin'
    });
    await adminUser.save();
    console.log('👤 Created admin user');

    // Create sample users
    const users = [];
    for (let i = 1; i <= 5; i++) {
      const user = new User({
        firebaseUid: `user-${i}-firebase-uid`,
        email: `user${i}@example.com`,
        displayName: `User ${i}`,
        role: 'user'
      });
      await user.save();
      users.push(user);
    }
    console.log('👥 Created sample users');

    // Create sample moods
    const moodEntries = [];
    for (const user of users) {
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const mood = new Mood({
          userId: user._id,
          score: Math.floor(Math.random() * 10) + 1,
          emoji: ['😢', '😔', '😐', '🙂', '😊', '😄', '🤩', '🥳'][Math.floor(Math.random() * 8)],
          tags: ['Work', 'School', 'Family', 'Friends', 'Health'].slice(0, Math.floor(Math.random() * 3) + 1),
          note: i % 5 === 0 ? `Feeling ${['great', 'okay', 'tired', 'stressed', 'happy'][Math.floor(Math.random() * 5)]} today` : undefined,
          date: date
        });
        await mood.save();
        moodEntries.push(mood);
      }
    }
    console.log('😊 Created sample mood entries');

    // Create sample journals
    const journalEntries = [];
    for (const user of users) {
      for (let i = 0; i < 10; i++) {
        const journal = new Journal({
          userId: user._id,
          title: `Journal Entry ${i + 1}`,
          body: `This is a sample journal entry ${i + 1}. Today I'm feeling ${['great', 'okay', 'tired', 'stressed', 'happy'][Math.floor(Math.random() * 5)]}. ${i % 3 === 0 ? 'I had a really good day today and accomplished a lot.' : 'It was a regular day with some ups and downs.'}`,
          visibility: Math.random() > 0.8 ? 'shared' : 'private',
          moodId: moodEntries[Math.floor(Math.random() * moodEntries.length)]._id
        });
        await journal.save();
        journalEntries.push(journal);
      }
    }
    console.log('📝 Created sample journal entries');

    // Create some flagged entries for admin review
    const flaggedJournal = new Journal({
      userId: users[0]._id,
      title: 'Feeling overwhelmed',
      body: 'I\'m feeling really overwhelmed lately. Sometimes I think it would be better if I wasn\'t here. Everything feels too much to handle.',
      visibility: 'private',
      flagged: {
        isFlagged: true,
        reason: 'Crisis language detected',
        flaggedAt: new Date()
      }
    });
    await flaggedJournal.save();
    console.log('🚩 Created flagged journal entry');

    console.log('✅ Seed data created successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${await User.countDocuments()}`);
    console.log(`   - Moods: ${await Mood.countDocuments()}`);
    console.log(`   - Journals: ${await Journal.countDocuments()}`);
    console.log(`   - Flagged: ${await Journal.countDocuments({ 'flagged.isFlagged': true })}`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run seed if called directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;



