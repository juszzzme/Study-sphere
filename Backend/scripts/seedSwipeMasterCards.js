const mongoose = require('mongoose');
const { connectDB } = require('../db');
const SwipeMasterCard = require('../models/SwipeMasterCard');

// Connect to MongoDB
connectDB();

// Sample SwipeMaster cards
const sampleCards = [
  // Math cards
  {
    statement: 'The derivative of x² is 2x',
    isCorrect: true,
    category: 'Mathematics',
    difficulty: 'easy'
  },
  {
    statement: 'The integral of 2x is x²',
    isCorrect: true,
    category: 'Mathematics',
    difficulty: 'easy'
  },
  {
    statement: 'Pi is exactly equal to 22/7',
    isCorrect: false,
    category: 'Mathematics',
    difficulty: 'medium'
  },
  {
    statement: 'The Pythagorean theorem states that a² + b² = c² in a right triangle',
    isCorrect: true,
    category: 'Mathematics',
    difficulty: 'easy'
  },
  {
    statement: 'In a normal distribution, the mean and median are always equal',
    isCorrect: true,
    category: 'Mathematics',
    difficulty: 'medium'
  },
  
  // Physics cards
  {
    statement: 'Newton\'s first law states that an object will remain at rest or in motion unless acted upon by a force',
    isCorrect: true,
    category: 'Physics',
    difficulty: 'easy'
  },
  {
    statement: 'The speed of light is approximately 300,000 km/s',
    isCorrect: true,
    category: 'Physics',
    difficulty: 'easy'
  },
  {
    statement: 'Gravity is stronger on the moon than on Earth',
    isCorrect: false,
    category: 'Physics',
    difficulty: 'easy'
  },
  {
    statement: 'Energy can be created or destroyed according to the laws of thermodynamics',
    isCorrect: false,
    category: 'Physics',
    difficulty: 'medium'
  },
  {
    statement: 'Sound travels faster in water than in air',
    isCorrect: true,
    category: 'Physics',
    difficulty: 'medium'
  },
  
  // Biology cards
  {
    statement: 'DNA is a double helix structure',
    isCorrect: true,
    category: 'Biology',
    difficulty: 'easy'
  },
  {
    statement: 'Mitochondria is the powerhouse of the cell',
    isCorrect: true,
    category: 'Biology',
    difficulty: 'easy'
  },
  {
    statement: 'Humans have 48 chromosomes',
    isCorrect: false,
    category: 'Biology',
    difficulty: 'medium'
  },
  {
    statement: 'Photosynthesis occurs in animal cells',
    isCorrect: false,
    category: 'Biology',
    difficulty: 'easy'
  },
  {
    statement: 'The human heart has four chambers',
    isCorrect: true,
    category: 'Biology',
    difficulty: 'easy'
  },
  
  // Chemistry cards
  {
    statement: 'The chemical symbol for gold is Au',
    isCorrect: true,
    category: 'Chemistry',
    difficulty: 'easy'
  },
  {
    statement: 'Water has a pH of 7, making it neutral',
    isCorrect: true,
    category: 'Chemistry',
    difficulty: 'easy'
  },
  {
    statement: 'Sodium is a noble gas',
    isCorrect: false,
    category: 'Chemistry',
    difficulty: 'medium'
  },
  {
    statement: 'Diamond and graphite are both allotropes of carbon',
    isCorrect: true,
    category: 'Chemistry',
    difficulty: 'medium'
  },
  {
    statement: 'The periodic table has 118 confirmed elements',
    isCorrect: true,
    category: 'Chemistry',
    difficulty: 'medium'
  }
];

async function seedSwipeMasterCards() {
  try {
    // Clear existing cards
    await SwipeMasterCard.deleteMany({});
    console.log('Cleared existing SwipeMaster cards');
    
    // Insert sample cards
    await SwipeMasterCard.insertMany(sampleCards);
    console.log(`Inserted ${sampleCards.length} SwipeMaster cards`);
    
    console.log('SwipeMaster cards seeded successfully');
  } catch (error) {
    console.error('Error seeding SwipeMaster cards:', error);
  } finally {
    mongoose.disconnect();
    console.log('Database connection closed');
  }
}

// Run the seed function
seedSwipeMasterCards();