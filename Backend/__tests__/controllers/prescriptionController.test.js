const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const prescriptionRoutes = require('../../Routes/prescriptionRoutes');
const Doctor = require('../../Model/Doctor');
const Patient = require('../../Model/Patient');
const Pharmacist = require('../../Model/Pharmacist');
const Prescription = require('../../Model/Prescription');
const DocProfile = require('../../Model/DocProfile');
const jwt = require('jsonwebtoken');

// Test app setup
const app = express();
app.use(express.json());
app.use('/api/prescriptions', prescriptionRoutes);

describe('Prescription Controller Integration Tests', () => {
  let mongoServer;
  let doctorToken, patientToken, pharmacistToken;
  let doctorId, patientId, pharmacistId;
  let testPrescriptionId;

  beforeAll(async () => {
    // Close existing connection if any
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test users
    const doctor = await Doctor.create({
      username: 'Dr. Test',
      email: 'doctor@test.com',
      password: 'password123',
      specialization: 'General Medicine'
    });
    doctorId = doctor._id;

    const patient = await Patient.create({
      username: 'Patient Test',
      email: 'patient@test.com',
      password: 'password123'
    });
    patientId = patient._id;

    const pharmacist = await Pharmacist.create({
      username: 'Pharmacist Test',
      email: 'pharmacist@test.com',
      password: 'password123',
      licenseNumber: 'PH123456',
      pharmacyName: 'Test Pharmacy',
      pharmacyAddress: '123 Test St',
      phone: '555-0123'
    });
    pharmacistId = pharmacist._id;

    // Create doctor profile
    await DocProfile.create({
      doctorRefId: doctorId,
      name: 'Dr. Test',
      email: 'doctor@test.com',
      speciality: 'General Medicine'
    });

    // Generate JWT tokens
    doctorToken = jwt.sign(
      { id: doctorId, userType: 'doctor' }, 
      process.env.JWT_SECRET || 'test_secret'
    );
    patientToken = jwt.sign(
      { id: patientId, userType: 'patient' }, 
      process.env.JWT_SECRET || 'test_secret'
    );
    pharmacistToken = jwt.sign(
      { id: pharmacistId, userType: 'pharmacist' }, 
      process.env.JWT_SECRET || 'test_secret'
    );
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean up prescriptions before each test
    await Prescription.deleteMany({});
  });

  describe('POST /api/prescriptions', () => {
    const validPrescriptionData = {
      patient: {
        id: null, // Will be set in test
        name: 'Patient Test',
        age: 30,
        gender: 'Male'
      },
      medicines: [
        {
          name: 'Amoxicillin',
          dosage: '500mg',
          frequency: 'Twice daily',
          duration: '7 days',
          instructions: 'Take with food'
        }
      ],
      additionalNotes: 'Follow up in 1 week'
    };

    test('should create prescription successfully with valid doctor token', async () => {
      const prescriptionData = {
        ...validPrescriptionData,
        patient: { ...validPrescriptionData.patient, id: patientId }
      };

      const response = await request(app)
        .post('/api/prescriptions')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(prescriptionData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('prescriptionNumber');
      expect(response.body.data.doctor.id).toBe(doctorId.toString());
      expect(response.body.data.patient.id).toBe(patientId.toString());
      expect(response.body.data.medicines).toHaveLength(1);
      expect(response.body.data.status).toBe('active');

      testPrescriptionId = response.body.data._id;
    });

    test('should fail without authentication', async () => {
      const prescriptionData = {
        ...validPrescriptionData,
        patient: { ...validPrescriptionData.patient, id: patientId }
      };

      const response = await request(app)
        .post('/api/prescriptions')
        .send(prescriptionData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    test('should fail with patient token (insufficient permissions)', async () => {
      const prescriptionData = {
        ...validPrescriptionData,
        patient: { ...validPrescriptionData.patient, id: patientId }
      };

      const response = await request(app)
        .post('/api/prescriptions')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(prescriptionData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should fail with invalid patient ID', async () => {
      const prescriptionData = {
        ...validPrescriptionData,
        patient: { ...validPrescriptionData.patient, id: new mongoose.Types.ObjectId() }
      };

      const response = await request(app)
        .post('/api/prescriptions')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(prescriptionData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PATIENT_NOT_FOUND');
    });

    test('should fail with missing required fields', async () => {
      const invalidData = {
        patient: { id: patientId, name: 'Test' },
        medicines: []
      };

      const response = await request(app)
        .post('/api/prescriptions')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/prescriptions/list', () => {
    beforeEach(async () => {
      // Create test prescription
      const prescription = await Prescription.create({
        prescriptionNumber: 'RX-TEST-001',
        doctor: {
          id: doctorId,
          name: 'Dr. Test',
          specialization: 'General Medicine',
          licenseNumber: 'DOC123',
          contact: { email: 'doctor@test.com' }
        },
        patient: {
          id: patientId,
          name: 'Patient Test',
          age: 30,
          gender: 'Male'
        },
        medicines: [{
          name: 'Test Medicine',
          dosage: '100mg',
          frequency: 'Once daily',
          duration: '5 days'
        }],
        status: 'active'
      });
      testPrescriptionId = prescription._id;
    });

    test('should get doctor prescriptions with doctor token', async () => {
      const response = await request(app)
        .get('/api/prescriptions/list')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].doctor.id).toBe(doctorId.toString());
    });

    test('should get patient prescriptions with patient token', async () => {
      const response = await request(app)
        .get('/api/prescriptions/list')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].patient.id).toBe(patientId.toString());
    });

    test('should get all prescriptions with pharmacist token', async () => {
      const response = await request(app)
        .get('/api/prescriptions/list')
        .set('Authorization', `Bearer ${pharmacistToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/prescriptions/list?page=1&limit=5')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination).toHaveProperty('currentPage', 1);
      expect(response.body.pagination).toHaveProperty('itemsPerPage', 5);
    });

    test('should support status filtering', async () => {
      const response = await request(app)
        .get('/api/prescriptions/list?status=active')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(p => p.status === 'active')).toBe(true);
    });
  });

  describe('GET /api/prescriptions/:id', () => {
    beforeEach(async () => {
      const prescription = await Prescription.create({
        prescriptionNumber: 'RX-TEST-002',
        doctor: {
          id: doctorId,
          name: 'Dr. Test',
          specialization: 'General Medicine',
          licenseNumber: 'DOC123',
          contact: { email: 'doctor@test.com' }
        },
        patient: {
          id: patientId,
          name: 'Patient Test',
          age: 30,
          gender: 'Male'
        },
        medicines: [{
          name: 'Test Medicine',
          dosage: '100mg',
          frequency: 'Once daily',
          duration: '5 days'
        }],
        status: 'active'
      });
      testPrescriptionId = prescription._id;
    });

    test('should get prescription by ID with doctor token', async () => {
      const response = await request(app)
        .get(`/api/prescriptions/${testPrescriptionId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testPrescriptionId.toString());
    });

    test('should get prescription by ID with patient token', async () => {
      const response = await request(app)
        .get(`/api/prescriptions/${testPrescriptionId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testPrescriptionId.toString());
    });

    test('should fail with invalid prescription ID', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/prescriptions/${invalidId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('PRESCRIPTION_NOT_FOUND');
    });

    test('should fail with malformed ID', async () => {
      const response = await request(app)
        .get('/api/prescriptions/invalid-id')
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_PRESCRIPTION_ID');
    });
  });

  describe('PUT /api/prescriptions/:id', () => {
    beforeEach(async () => {
      const prescription = await Prescription.create({
        prescriptionNumber: 'RX-TEST-003',
        doctor: {
          id: doctorId,
          name: 'Dr. Test',
          specialization: 'General Medicine',
          licenseNumber: 'DOC123',
          contact: { email: 'doctor@test.com' }
        },
        patient: {
          id: patientId,
          name: 'Patient Test',
          age: 30,
          gender: 'Male'
        },
        medicines: [{
          name: 'Test Medicine',
          dosage: '100mg',
          frequency: 'Once daily',
          duration: '5 days'
        }],
        status: 'active'
      });
      testPrescriptionId = prescription._id;
    });

    test('should update prescription with doctor token', async () => {
      const updateData = {
        additionalNotes: 'Updated notes',
        medicines: [{
          name: 'Updated Medicine',
          dosage: '200mg',
          frequency: 'Twice daily',
          duration: '10 days'
        }]
      };

      const response = await request(app)
        .put(`/api/prescriptions/${testPrescriptionId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.additionalNotes).toBe('Updated notes');
      expect(response.body.data.medicines[0].name).toBe('Updated Medicine');
    });

    test('should fail with patient token (insufficient permissions)', async () => {
      const updateData = { additionalNotes: 'Updated notes' };

      const response = await request(app)
        .put(`/api/prescriptions/${testPrescriptionId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('DELETE /api/prescriptions/:id', () => {
    beforeEach(async () => {
      const prescription = await Prescription.create({
        prescriptionNumber: 'RX-TEST-004',
        doctor: {
          id: doctorId,
          name: 'Dr. Test',
          specialization: 'General Medicine',
          licenseNumber: 'DOC123',
          contact: { email: 'doctor@test.com' }
        },
        patient: {
          id: patientId,
          name: 'Patient Test',
          age: 30,
          gender: 'Male'
        },
        medicines: [{
          name: 'Test Medicine',
          dosage: '100mg',
          frequency: 'Once daily',
          duration: '5 days'
        }],
        status: 'active'
      });
      testPrescriptionId = prescription._id;
    });

    test('should delete prescription with doctor token', async () => {
      const response = await request(app)
        .delete(`/api/prescriptions/${testPrescriptionId}`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isDeleted).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
    });

    test('should fail with patient token (insufficient permissions)', async () => {
      const response = await request(app)
        .delete(`/api/prescriptions/${testPrescriptionId}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('POST /api/prescriptions/:id/verify', () => {
    beforeEach(async () => {
      const prescription = await Prescription.create({
        prescriptionNumber: 'RX-TEST-005',
        doctor: {
          id: doctorId,
          name: 'Dr. Test',
          specialization: 'General Medicine',
          licenseNumber: 'DOC123',
          contact: { email: 'doctor@test.com' }
        },
        patient: {
          id: patientId,
          name: 'Patient Test',
          age: 30,
          gender: 'Male'
        },
        medicines: [{
          name: 'Test Medicine',
          dosage: '100mg',
          frequency: 'Once daily',
          duration: '5 days'
        }],
        status: 'active'
      });
      testPrescriptionId = prescription._id;
    });

    test('should verify prescription with pharmacist token', async () => {
      const response = await request(app)
        .post(`/api/prescriptions/${testPrescriptionId}/verify`)
        .set('Authorization', `Bearer ${pharmacistToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.verifiedBy).toBe(pharmacistId.toString());
      expect(response.body.data.verifiedAt).toBeDefined();
    });

    test('should fail with doctor token (insufficient permissions)', async () => {
      const response = await request(app)
        .post(`/api/prescriptions/${testPrescriptionId}/verify`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('POST /api/prescriptions/:id/dispense', () => {
    beforeEach(async () => {
      const prescription = await Prescription.create({
        prescriptionNumber: 'RX-TEST-006',
        doctor: {
          id: doctorId,
          name: 'Dr. Test',
          specialization: 'General Medicine',
          licenseNumber: 'DOC123',
          contact: { email: 'doctor@test.com' }
        },
        patient: {
          id: patientId,
          name: 'Patient Test',
          age: 30,
          gender: 'Male'
        },
        medicines: [{
          name: 'Test Medicine',
          dosage: '100mg',
          frequency: 'Once daily',
          duration: '5 days',
          dispensed: false
        }],
        status: 'active'
      });
      testPrescriptionId = prescription._id;
    });

    test('should dispense medicine with pharmacist token', async () => {
      const response = await request(app)
        .post(`/api/prescriptions/${testPrescriptionId}/dispense`)
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({ 
          medicineIndex: 0,
          pharmacistNotes: 'Dispensed as prescribed'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.medicines[0].dispensed).toBe(true);
      expect(response.body.data.medicines[0].dispensedBy).toBe(pharmacistId.toString());
      expect(response.body.data.status).toBe('dispensed');
    });

    test('should fail with invalid medicine index', async () => {
      const response = await request(app)
        .post(`/api/prescriptions/${testPrescriptionId}/dispense`)
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({ medicineIndex: 999 });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_MEDICINE_INDEX');
    });

    test('should fail with doctor token (insufficient permissions)', async () => {
      const response = await request(app)
        .post(`/api/prescriptions/${testPrescriptionId}/dispense`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ medicineIndex: 0 });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('GET /api/prescriptions/:id/audit', () => {
    beforeEach(async () => {
      const prescription = await Prescription.create({
        prescriptionNumber: 'RX-TEST-007',
        doctor: {
          id: doctorId,
          name: 'Dr. Test',
          specialization: 'General Medicine',
          licenseNumber: 'DOC123',
          contact: { email: 'doctor@test.com' }
        },
        patient: {
          id: patientId,
          name: 'Patient Test',
          age: 30,
          gender: 'Male'
        },
        medicines: [{
          name: 'Test Medicine',
          dosage: '100mg',
          frequency: 'Once daily',
          duration: '5 days'
        }],
        status: 'active'
      });
      testPrescriptionId = prescription._id;
    });

    test('should get audit trail with authorized user', async () => {
      const response = await request(app)
        .get(`/api/prescriptions/${testPrescriptionId}/audit`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/prescriptions/${testPrescriptionId}/audit`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('POST /api/prescriptions/verify (by prescription number)', () => {
    beforeEach(async () => {
      const prescription = await Prescription.create({
        prescriptionNumber: 'RX-TEST-008',
        doctor: {
          id: doctorId,
          name: 'Dr. Test',
          specialization: 'General Medicine',
          licenseNumber: 'DOC123',
          contact: { email: 'doctor@test.com' }
        },
        patient: {
          id: patientId,
          name: 'Patient Test',
          age: 30,
          gender: 'Male'
        },
        medicines: [{
          name: 'Test Medicine',
          dosage: '100mg',
          frequency: 'Once daily',
          duration: '5 days'
        }],
        status: 'active'
      });
      testPrescriptionId = prescription._id;
    });

    test('should verify prescription by prescription number', async () => {
      const response = await request(app)
        .post('/api/prescriptions/verify')
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({ prescriptionNumber: 'RX-TEST-008' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.verifiedBy).toBe(pharmacistId.toString());
    });

    test('should fail with invalid prescription number', async () => {
      const response = await request(app)
        .post('/api/prescriptions/verify')
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({ prescriptionNumber: 'INVALID-NUMBER' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('PRESCRIPTION_NOT_FOUND');
    });
  });
});