const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
});

// Cleanup after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

// Global test utilities
global.createTestPrescription = (overrides = {}) => {
  return {
    doctor: {
      id: new mongoose.Types.ObjectId(),
      name: 'Dr. John Smith',
      specialization: 'Cardiology',
      licenseNumber: 'LIC123456',
      contact: {
        phone: '+1234567890',
        email: 'dr.smith@example.com'
      }
    },
    patient: {
      id: new mongoose.Types.ObjectId(),
      name: 'Jane Doe',
      age: 35,
      gender: 'Female',
      patientId: 'PAT001'
    },
    medicines: [{
      name: 'Aspirin',
      dosage: '100mg',
      frequency: 'Once daily',
      duration: '30 days',
      instructions: 'Take with food'
    }],
    additionalNotes: 'Test prescription',
    ...overrides
  };
};

global.createTestAuditLog = (overrides = {}) => {
  return {
    prescriptionId: new mongoose.Types.ObjectId(),
    action: 'created',
    performedBy: {
      userId: new mongoose.Types.ObjectId(),
      userType: 'doctor',
      userName: 'Dr. John Smith'
    },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 Test Browser',
    ...overrides
  };
};