const request = require('supertest');
const express = require('express');
const prescriptionRoutes = require('../../Routes/prescriptionRoutes');

// Simple test app
const app = express();
app.use(express.json());
app.use('/api/prescriptions', prescriptionRoutes);

describe('Prescription API Integration Tests', () => {
  test('should respond to health check', async () => {
    const response = await request(app)
      .get('/api/prescriptions');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('Prescription API is active');
  });

  test('should require authentication for creating prescriptions', async () => {
    const response = await request(app)
      .post('/api/prescriptions')
      .send({
        patient: { id: '507f1f77bcf86cd799439011', name: 'Test Patient', age: 30, gender: 'Male' },
        medicines: [{ name: 'Test Medicine', dosage: '100mg', frequency: 'Once daily', duration: '5 days' }]
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('MISSING_TOKEN');
  });

  test('should require authentication for getting prescriptions', async () => {
    const response = await request(app)
      .get('/api/prescriptions/list');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('MISSING_TOKEN');
  });

  test('should validate prescription ID format', async () => {
    const response = await request(app)
      .get('/api/prescriptions/invalid-id')
      .set('Authorization', 'Bearer fake-token');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_PRESCRIPTION_ID');
  });

  test('should validate prescription creation data', async () => {
    const response = await request(app)
      .post('/api/prescriptions')
      .set('Authorization', 'Bearer fake-token')
      .send({
        patient: { name: 'Test' }, // Missing required fields
        medicines: [] // Empty medicines array
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});