const mongoose = require('mongoose');
const User = require('./models/User');
const Resource = require('./models/resource');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/study_sphere', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Seed a test user
const seedUser = async () => {
  const user = new User({
    username: 'testuser',
    email: 'test@example.com',
    password: 'test123', // Automatically hashed by the User model
  });
  await user.save();
  console.log('Test user created:', user._id);

  // Seed a test resource
  const resource = new Resource({
    title: 'Sample Notes',
    subject: 'Math',
    year: 2023,
    fileType: 'pdf',
    tags: ['algebra', 'calculus'],
    filePath: '/uploads/sample.pdf',
    uploadedBy: user._id,
  });
  await resource.save();
  console.log('Test resource created:', resource._id);
};

// Run the seed
seedUser()
  .catch(err => console.error(err))
  .finally(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
  