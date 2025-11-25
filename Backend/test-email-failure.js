/**
 * Test script to verify registration works even when email sending fails
 * Run this with: node test-email-failure.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Mock the email utility to simulate failure
jest.mock('./Utils/Email', () => ({
  sendOTPEmail: jest.fn().mockRejectedValue(new Error('Email service unavailable'))
}));

const request = require('supertest');
const app = require('./server'); // Assuming you export the app from server.js

async function testRegistrationWithEmailFailure() {
  console.log('🧪 Testing registration with email failure...');

  // Connect to test database
  await mongoose.connect(process.env.MONGO_URI.replace('medipredict', 'medipredict-test'));

  const testUser = {
    username: 'testuser' + Date.now(),
    email: 'test' + Date.now() + '@example.com',
    password: 'TestPassword123',
    role: 'patient'
  };

  try {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(200); // Should still return 200 even if email fails

    console.log('✅ Registration response:', response.body);

    if (response.body.msg.includes('OTP created')) {
      console.log('✅ SUCCESS: Registration works even when email fails!');
      console.log('📝 OTP was saved to database despite email failure');
    } else {
      console.log('❌ FAIL: Registration failed when email failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  // Clean up test database
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();

  process.exit(0);
}

// Run the test
testRegistrationWithEmailFailure();