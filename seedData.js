/* eslint-disable no-console */
/**
 * Seed script for SphereTest backend.
 *
 * How to run:
 *   1. Make sure MongoDB is running.
 *   2. From the backend folder, run:
 *        node seedData.js
 *
 * This will insert:
 *   - 1 admin user (password: admin123)
 *   - 2 student users (password: student123)
 *   - 1 sphere with game code
 *   - 4 questions (MCQ, CODE, TEXT, BOOL) for that sphere
 */

const dotenv = require('dotenv');
const mongoose = require('mongoose');

const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const Sphere = require('./src/models/Sphere');
const Question = require('./src/models/Question');

dotenv.config();

const seed = async () => {
  try {
    await connectDB();

    console.log('🧹 Clearing existing data (users, spheres, questions)...');
    await Question.deleteMany({});
    await Sphere.deleteMany({});
    await User.deleteMany({});

    console.log('👤 Creating users...');
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@spheretest.com',
      password: 'admin123',
      phone: '+1234567890',
      role: 'admin',
    });

    const student1 = await User.create({
      name: 'Student One',
      email: 'student1@spheretest.com',
      password: 'student123',
      phone: '+1234567891',
      role: 'student',
    });

    const student2 = await User.create({
      name: 'Student Two',
      email: 'student2@spheretest.com',
      password: 'student123',
      phone: '+1234567892',
      role: 'student',
    });

    console.log('🌀 Creating sphere...');
    const sphere = await Sphere.create({
      title: 'Sample Sphere',
      description: 'Demo sphere seeded for testing',
      type: 'mcq',
      createdBy: adminUser._id,
      participants: [adminUser._id, student1._id],
      duration: 60,
      maxPlayers: 50,
      difficulty: 'medium',
      security: {
        faceId: true,
        fullscreen: false,
        tabSwitchDetection: true,
      },
    });

    console.log('❓ Creating questions...');
    const questionsData = [
      {
        sphereId: sphere._id,
        type: 'MCQ',
        questionText: 'What is 2 + 2?',
        options: ['1', '2', '3', '4'],
        correctAnswer: '4',
      },
      {
        sphereId: sphere._id,
        type: 'MCQ',
        questionText: 'What is the capital of France?',
        options: ['Berlin', 'Madrid', 'Paris', 'Rome'],
        correctAnswer: 'Paris',
      },
      {
        sphereId: sphere._id,
        type: 'CODE',
        questionText: 'Write a function that returns the sum of two numbers',
        codeLanguage: 'javascript',
        starterCode: 'function add(a, b) {\n  // Write your code here\n}',
        correctAnswer: 'function add(a, b) { return a + b; }',
      },
      {
        sphereId: sphere._id,
        type: 'BOOL',
        questionText: 'JavaScript is a compiled language.',
        correctAnswer: false,
      },
    ];

    await Question.insertMany(questionsData);

    console.log('✅ Seed data created successfully.');
    console.log('\n📋 Test Credentials:');
    console.log('Admin:');
    console.log('  Email: admin@spheretest.com');
    console.log('  Password: admin123');
    console.log('\nStudent:');
    console.log('  Email: student1@spheretest.com');
    console.log('  Password: student123');
    console.log('\n🌀 Sphere Info:');
    console.log('  ID:', sphere._id.toString());
    console.log('  Game Code:', sphere.gameCode);
    console.log('\n💡 Use these credentials to test authentication endpoints.');
  } catch (err) {
    console.error('❌ Error seeding data:', err.message);
    console.error(err.stack);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seed();

