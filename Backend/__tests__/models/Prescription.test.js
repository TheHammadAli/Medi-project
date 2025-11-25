const mongoose = require('mongoose');
const Prescription = require('../../Model/Prescription');

describe('Prescription Model', () => {
  describe('Schema Validation', () => {
    test('should create a valid prescription', async () => {
      const prescriptionData = createTestPrescription();
      const prescription = new Prescription(prescriptionData);
      
      const savedPrescription = await prescription.save();
      
      expect(savedPrescription._id).toBeDefined();
      expect(savedPrescription.prescriptionNumber).toMatch(/^RX-[A-Z0-9]+-[A-Z0-9]+$/);
      expect(savedPrescription.doctor.name).toBe('Dr. John Smith');
      expect(savedPrescription.patient.name).toBe('Jane Doe');
      expect(savedPrescription.medicines).toHaveLength(1);
      expect(savedPrescription.status).toBe('active');
      expect(savedPrescription.version).toBe(1);
    });

    test('should require doctor information', async () => {
      const prescriptionData = createTestPrescription();
      delete prescriptionData.doctor;
      
      const prescription = new Prescription(prescriptionData);
      
      await expect(prescription.save()).rejects.toThrow();
    });

    test('should require patient information', async () => {
      const prescriptionData = createTestPrescription();
      delete prescriptionData.patient;
      
      const prescription = new Prescription(prescriptionData);
      
      await expect(prescription.save()).rejects.toThrow();
    });

    test('should require at least one medicine', async () => {
      const prescriptionData = createTestPrescription({
        medicines: []
      });
      
      const prescription = new Prescription(prescriptionData);
      
      await expect(prescription.save()).rejects.toThrow('At least one medicine is required');
    });

    test('should validate patient age range', async () => {
      const prescriptionData = createTestPrescription({
        patient: {
          id: new mongoose.Types.ObjectId(),
          name: 'Invalid Patient',
          age: 200,
          gender: 'Male'
        }
      });
      
      const prescription = new Prescription(prescriptionData);
      
      await expect(prescription.save()).rejects.toThrow('Patient age must be between 1 and 150');
    });

    test('should validate gender enum', async () => {
      const prescriptionData = createTestPrescription({
        patient: {
          id: new mongoose.Types.ObjectId(),
          name: 'Test Patient',
          age: 30,
          gender: 'Invalid'
        }
      });
      
      const prescription = new Prescription(prescriptionData);
      
      await expect(prescription.save()).rejects.toThrow();
    });

    test('should validate status enum', async () => {
      const prescriptionData = createTestPrescription({
        status: 'invalid_status'
      });
      
      const prescription = new Prescription(prescriptionData);
      
      await expect(prescription.save()).rejects.toThrow();
    });

    test('should validate medicine required fields', async () => {
      const prescriptionData = createTestPrescription({
        medicines: [{
          name: 'Test Medicine',
          // Missing required fields
        }]
      });
      
      const prescription = new Prescription(prescriptionData);
      
      await expect(prescription.save()).rejects.toThrow();
    });
  });

  describe('Pre-save Middleware', () => {
    test('should generate unique prescription number', async () => {
      const prescriptionData1 = createTestPrescription();
      const prescriptionData2 = createTestPrescription();
      
      const prescription1 = new Prescription(prescriptionData1);
      const prescription2 = new Prescription(prescriptionData2);
      
      const saved1 = await prescription1.save();
      const saved2 = await prescription2.save();
      
      expect(saved1.prescriptionNumber).toBeDefined();
      expect(saved2.prescriptionNumber).toBeDefined();
      expect(saved1.prescriptionNumber).not.toBe(saved2.prescriptionNumber);
    });

    test('should increment version on update', async () => {
      const prescriptionData = createTestPrescription();
      const prescription = new Prescription(prescriptionData);
      
      const savedPrescription = await prescription.save();
      expect(savedPrescription.version).toBe(1);
      
      savedPrescription.additionalNotes = 'Updated notes';
      const updatedPrescription = await savedPrescription.save();
      
      expect(updatedPrescription.version).toBe(2);
    });

    test('should not change prescription number on update', async () => {
      const prescriptionData = createTestPrescription();
      const prescription = new Prescription(prescriptionData);
      
      const savedPrescription = await prescription.save();
      const originalNumber = savedPrescription.prescriptionNumber;
      
      savedPrescription.additionalNotes = 'Updated notes';
      const updatedPrescription = await savedPrescription.save();
      
      expect(updatedPrescription.prescriptionNumber).toBe(originalNumber);
    });
  });

  describe('Instance Methods', () => {
    test('canBeModified should return true for active prescriptions', async () => {
      const prescriptionData = createTestPrescription();
      const prescription = new Prescription(prescriptionData);
      const savedPrescription = await prescription.save();
      
      expect(savedPrescription.canBeModified()).toBe(true);
    });

    test('canBeModified should return false for dispensed prescriptions', async () => {
      const prescriptionData = createTestPrescription({
        status: 'dispensed'
      });
      const prescription = new Prescription(prescriptionData);
      const savedPrescription = await prescription.save();
      
      expect(savedPrescription.canBeModified()).toBe(false);
    });

    test('canBeModified should return false for deleted prescriptions', async () => {
      const prescriptionData = createTestPrescription({
        isDeleted: true
      });
      const prescription = new Prescription(prescriptionData);
      const savedPrescription = await prescription.save();
      
      expect(savedPrescription.canBeModified()).toBe(false);
    });

    test('isFullyDispensed should return true when all medicines are dispensed', async () => {
      const prescriptionData = createTestPrescription({
        medicines: [{
          name: 'Medicine 1',
          dosage: '100mg',
          frequency: 'Once daily',
          duration: '30 days',
          dispensed: true
        }, {
          name: 'Medicine 2',
          dosage: '200mg',
          frequency: 'Twice daily',
          duration: '15 days',
          dispensed: true
        }]
      });
      const prescription = new Prescription(prescriptionData);
      const savedPrescription = await prescription.save();
      
      expect(savedPrescription.isFullyDispensed()).toBe(true);
    });

    test('isFullyDispensed should return false when some medicines are not dispensed', async () => {
      const prescriptionData = createTestPrescription({
        medicines: [{
          name: 'Medicine 1',
          dosage: '100mg',
          frequency: 'Once daily',
          duration: '30 days',
          dispensed: true
        }, {
          name: 'Medicine 2',
          dosage: '200mg',
          frequency: 'Twice daily',
          duration: '15 days',
          dispensed: false
        }]
      });
      const prescription = new Prescription(prescriptionData);
      const savedPrescription = await prescription.save();
      
      expect(savedPrescription.isFullyDispensed()).toBe(false);
    });
  });

  describe('Static Methods', () => {
    test('findActiveByDoctor should return active prescriptions for a doctor', async () => {
      const doctorId = new mongoose.Types.ObjectId();
      
      // Create active prescription
      const activePrescription = new Prescription(createTestPrescription({
        doctor: { ...createTestPrescription().doctor, id: doctorId },
        status: 'active'
      }));
      await activePrescription.save();
      
      // Create deleted prescription
      const deletedPrescription = new Prescription(createTestPrescription({
        doctor: { ...createTestPrescription().doctor, id: doctorId },
        isDeleted: true
      }));
      await deletedPrescription.save();
      
      // Create dispensed prescription
      const dispensedPrescription = new Prescription(createTestPrescription({
        doctor: { ...createTestPrescription().doctor, id: doctorId },
        status: 'dispensed'
      }));
      await dispensedPrescription.save();
      
      const results = await Prescription.findActiveByDoctor(doctorId);
      
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('active');
      expect(results[0].isDeleted).toBe(false);
    });

    test('findByPatient should return all prescriptions for a patient', async () => {
      const patientId = new mongoose.Types.ObjectId();
      
      // Create multiple prescriptions for the patient
      const prescription1 = new Prescription(createTestPrescription({
        patient: { ...createTestPrescription().patient, id: patientId }
      }));
      await prescription1.save();
      
      const prescription2 = new Prescription(createTestPrescription({
        patient: { ...createTestPrescription().patient, id: patientId },
        status: 'completed'
      }));
      await prescription2.save();
      
      // Create prescription for different patient
      const otherPrescription = new Prescription(createTestPrescription());
      await otherPrescription.save();
      
      const results = await Prescription.findByPatient(patientId);
      
      expect(results).toHaveLength(2);
      expect(results.every(p => p.patient.id.equals(patientId))).toBe(true);
    });
  });

  describe('Indexes', () => {
    test('should enforce unique prescription number', async () => {
      const prescriptionData1 = createTestPrescription();
      const prescriptionData2 = createTestPrescription();
      
      const prescription1 = new Prescription(prescriptionData1);
      const savedPrescription1 = await prescription1.save();
      
      // Try to create another prescription with the same number
      const prescription2 = new Prescription(prescriptionData2);
      prescription2.prescriptionNumber = savedPrescription1.prescriptionNumber;
      
      await expect(prescription2.save()).rejects.toThrow();
    });
  });
});